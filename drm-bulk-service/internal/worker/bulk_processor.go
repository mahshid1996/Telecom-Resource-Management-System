package worker

import (
	"context"
	"log"
	"sync"
	"sync/atomic"
	"time"

	grpcclient "drm-bulk-service/internal/grpc"
	"drm-bulk-service/internal/model"
	"drm-bulk-service/internal/report"

	logicalpb "drm-bulk-service/internal/proto/logicalresource"
	physicalpb "drm-bulk-service/internal/proto/physicalresource"
)

/*
===========================
Processor
===========================
*/
type Processor struct {
	invClient *grpcclient.InventoryClient
	itemRepo  BulkItemUpdater
	reqRepo   BulkRequestUpdater
	reportSvc *report.Service
}

/*
===========================
Interfaces
===========================
*/
type BulkItemUpdater interface {
	UpdateItemStatusWithError(ctx context.Context, itemID, status, errMsg string) error
}

type BulkRequestUpdater interface {
	UpdateStatus(ctx context.Context, id string, status string) error
	UpdateCounts(ctx context.Context, id string, processed, success, failure int) error
}

/*
===========================
Constructor
===========================
*/
func NewProcessor(
	inv *grpcclient.InventoryClient,
	itemRepo BulkItemUpdater,
	reqRepo BulkRequestUpdater,
	reportSvc *report.Service,
) *Processor {
	return &Processor{
		invClient: inv,
		itemRepo:  itemRepo,
		reqRepo:   reqRepo,
		reportSvc: reportSvc,
	}
}

/*
===========================
Process (parallel with worker pool)
===========================
*/
func (p *Processor) Process(
	ctx context.Context,
	req model.BulkRequest,
	items []model.BulkItem,
) {
	start := time.Now() //start timer

	log.Printf("BULK PROCESSOR STARTED: items=%d\n", len(items))

	const workerCount = 10

	jobs := make(chan model.BulkItem)

	var wg sync.WaitGroup
	var successCount int32
	var failureCount int32

	// Start workers
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for item := range jobs {
				status := "success"
				errMsg := ""

				if err := callInventory(p.invClient, item); err != nil {
					status = "failure"
					errMsg = err.Error()
					log.Printf("[worker %d] inventory failed item=%s err=%v",
						workerID, item.ID.Hex(), err)
				}

				if err := p.itemRepo.UpdateItemStatusWithError(
					ctx,
					item.ID.Hex(),
					status,
					errMsg,
				); err != nil {
					log.Printf("[worker %d] mongo update failed item=%s err=%v",
						workerID, item.ID.Hex(), err)
				}

				if status == "success" {
					atomic.AddInt32(&successCount, 1)
				} else {
					atomic.AddInt32(&failureCount, 1)
				}
			}
		}(i + 1)
	}

	// Send jobs
	go func() {
		defer close(jobs)
		for _, item := range items {
			select {
			case <-ctx.Done():
				log.Println("context cancelled, stopping bulk processor")
				return
			case jobs <- item:
			}
		}
	}()

	// Wait for all workers to finish
	wg.Wait()

	success := int(atomic.LoadInt32(&successCount))
	failure := int(atomic.LoadInt32(&failureCount))
	processed := success + failure

	_ = p.reqRepo.UpdateCounts(ctx, req.ID.Hex(), processed, success, failure)
	_ = p.reqRepo.UpdateStatus(ctx, req.ID.Hex(), "completed")
	_ = p.reportSvc.Finalize(ctx, req)

	duration := time.Since(start) // end timer
	log.Printf(
		"BULK PROCESSOR FINISHED: items=%d success=%d failure=%d duration=%s",
		len(items), success, failure, duration,
	)
}

/*
===========================
Inventory Call
===========================
*/
func callInventory(client *grpcclient.InventoryClient, item model.BulkItem) error {
	ctx, cancel := grpcclient.Context()
	defer cancel()

	msisdn := ""
	mobileClass := ""

	for _, rc := range item.ResourceCharacteristic {
		if rc.Code == "MSISDN" {
			msisdn = rc.Value
		}
		if rc.Code == "MobileClass" {
			mobileClass = rc.Value
		}
	}

	if item.BaseType == "LogicalResource" {
		_, err := client.Logical.CreateLogicalResource(
			ctx,
			buildLogical(item, msisdn, mobileClass),
		)
		return err
	}

	_, err := client.Physical.CreatePhysicalResource(
		ctx,
		buildPhysical(item, msisdn, mobileClass),
	)
	return err
}

/*
===========================
Builders
===========================
*/
func buildLogical(item model.BulkItem, msisdn, mobileClass string) *logicalpb.LogicalResource {
	return &logicalpb.LogicalResource{
		Description: item.Type,
		Name:        mobileClass,
		Type:        item.Type,
		BaseType:    item.BaseType,
		Value:       msisdn,
		ResourceCharacteristic: []*logicalpb.LogicalResource_ResourceCharacteristic{
			{Code: "MSISDN", Value: msisdn},
			{Code: "MobileClass", Value: mobileClass},
		},
	}
}

func buildPhysical(item model.BulkItem, msisdn, mobileClass string) *physicalpb.PhysicalResource {
	return &physicalpb.PhysicalResource{
		Description: item.Type,
		Name:        mobileClass,
		Type:        item.Type,
		BaseType:    item.BaseType,
		Value:       msisdn,
		ResourceCharacteristic: []*physicalpb.PhysicalResource_ResourceCharacteristic{
			{Code: "MSISDN", Value: msisdn},
			{Code: "MobileClass", Value: mobileClass},
		},
	}
}
