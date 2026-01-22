package worker

import (
	"context"
	"fmt"
	"log"
	"sync"
	"sync/atomic"
	"time"

	grpcclient "drm-bulk-service/internal/grpc"
	"drm-bulk-service/internal/model"
	"drm-bulk-service/internal/report"
)

// InventoryUpdater abstracts update of inventory collections
// Concrete implementations: InventoryLogicalRepository, InventoryPhysicalRepository, etc
type InventoryUpdater interface {
	UpdateByTypeAndValue(ctx context.Context, resourceType, value string, fields map[string]string) error
}

type UpdateProcessor struct {
	invClient *grpcclient.InventoryClient
	itemRepo  BulkItemUpdater
	reqRepo   BulkRequestUpdater
	reportSvc *report.Service

	logicalUpdater  InventoryUpdater
	physicalUpdater InventoryUpdater
}

func NewUpdateProcessor(
	inv *grpcclient.InventoryClient,
	itemRepo BulkItemUpdater,
	reqRepo BulkRequestUpdater,
	reportSvc *report.Service,
	logicalUpdater InventoryUpdater,
	physicalUpdater InventoryUpdater,
) *UpdateProcessor {
	return &UpdateProcessor{
		invClient:       inv,
		itemRepo:        itemRepo,
		reqRepo:         reqRepo,
		reportSvc:       reportSvc,
		logicalUpdater:  logicalUpdater,
		physicalUpdater: physicalUpdater,
	}
}

func (p *UpdateProcessor) Process(
	ctx context.Context,
	req model.BulkRequest,
	items []model.BulkItem,
) {
	start := time.Now()
	log.Printf("BULK UPDATE PROCESSOR STARTED: items=%d\n", len(items))

	const workerCount = 10

	jobs := make(chan model.BulkItem)
	var wg sync.WaitGroup
	var successCount int32
	var failureCount int32

	// workers
	for i := 0; i < workerCount; i++ {
		wg.Add(1)
		go func(workerID int) {
			defer wg.Done()
			for item := range jobs {
				status := "success"
				errMsg := ""

				if err := p.updateInventoryItem(ctx, item); err != nil {
					status = "failure"
					errMsg = err.Error()
					log.Printf("[update worker %d] update failed item=%s err=%v",
						workerID, item.ID.Hex(), err)
				}

				if err := p.itemRepo.UpdateItemStatusWithError(
					ctx,
					item.ID.Hex(),
					status,
					errMsg,
				); err != nil {
					log.Printf("[update worker %d] mongo update failed item=%s err=%v",
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

	// send jobs
	go func() {
		defer close(jobs)
		for _, item := range items {
			select {
			case <-ctx.Done():
				log.Println("bulk update context cancelled")
				return
			case jobs <- item:
			}
		}
	}()

	wg.Wait()

	success := int(atomic.LoadInt32(&successCount))
	failure := int(atomic.LoadInt32(&failureCount))
	processed := success + failure

	_ = p.reqRepo.UpdateCounts(ctx, req.ID.Hex(), processed, success, failure)
	_ = p.reqRepo.UpdateStatus(ctx, req.ID.Hex(), "completed")
	_ = p.reportSvc.Finalize(ctx, req)

	log.Printf("BULK UPDATE PROCESSOR FINISHED: items=%d success=%d failure=%d duration=%s",
		len(items), success, failure, time.Since(start))
}

func (p *UpdateProcessor) updateInventoryItem(ctx context.Context, item model.BulkItem) error {
	fields := item.UpdateFields
	if fields == nil {
		fields = map[string]string{}
	}

	switch item.BaseType {
	case "LogicalResource":
		if p.logicalUpdater == nil {
			return fmt.Errorf("no logical inventory updater configured")
		}
		return p.logicalUpdater.UpdateByTypeAndValue(ctx, item.Type, item.Value, fields)

	case "PhysicalResource":
		if p.physicalUpdater == nil {
			return fmt.Errorf("no physical inventory updater configured")
		}
		return p.physicalUpdater.UpdateByTypeAndValue(ctx, item.Type, item.Value, fields)

	default:
		return fmt.Errorf("unsupported baseType: %s", item.BaseType)
	}
}
