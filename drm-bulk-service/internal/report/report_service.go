package report

import (
	"context"
	"drm-bulk-service/internal/model"
	"drm-bulk-service/internal/repository"
	"encoding/csv"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
)

type Service struct {
	itemRepo   *repository.BulkItemRepository
	reportRepo *repository.BulkReportRepository
	db         *mongo.Database
}

func NewService(
	itemRepo *repository.BulkItemRepository,
	reportRepo *repository.BulkReportRepository,
	db *mongo.Database,
) *Service {
	return &Service{
		itemRepo:   itemRepo,
		reportRepo: reportRepo,
		db:         db,
	}
}

/*
===========================
Finalize Bulk (ONE TIME)
===========================
*/
func (s *Service) Finalize(ctx context.Context, req model.BulkRequest) error {
	// ---------- Idempotency ----------
	if _, err := s.reportRepo.FindByRequestID(ctx, req.ID.Hex()); err == nil {
		return nil
	}

	items, err := s.itemRepo.FindByBulkRequestID(ctx, req.ID.Hex())
	if err != nil {
		return err
	}

	tmp := filepath.Join(os.TempDir(), fmt.Sprintf("bulk_%s.csv", req.ID.Hex()))

	if err := writeCSV(tmp, items); err != nil {
		log.Printf("Failed to write CSV: %v", err)
		return err
	}

	fileID, err := storeGridFS(ctx, s.db, tmp, req.ID.Hex())
	if err != nil {
		log.Printf("Failed to store GridFS: %v", err)
		return err
	}

	report := model.BulkReport{
		RequestID:    req.ID,
		TotalItems:   len(items),
		SuccessCount: count(items, "success"),
		FailureCount: count(items, "failure"),
		FileID:       fileID,
	}

	if err := s.reportRepo.Create(ctx, &report); err != nil {
		log.Printf("Failed to create report document: %v", err)
		return err
	}
	log.Printf("Report finalized: requestId=%s fileID=%s", req.ID.Hex(), fileID.Hex())
	return nil

}

/*
===========================
Helpers
===========================
*/
func count(items []model.BulkItem, status string) int {
	total := 0
	for _, i := range items {
		if i.Status == status {
			total++
		}
	}
	return total
}

func writeCSV(path string, items []model.BulkItem) error {
	file, err := os.Create(path)
	if err != nil {
		return err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// detect if this is an UPDATE bulk (has UpdateFields)
	hasUpdateFields := false
	for _, it := range items {
		if len(it.UpdateFields) > 0 {
			hasUpdateFields = true
			break
		}
	}

	if hasUpdateFields {
		// Header for update
		if err := writer.Write([]string{
			"Value",
			"Name",
			"Status",
			"ErrorMessage",
		}); err != nil {
			return err
		}

		// Rows for update
		for _, item := range items {
			value := item.Value
			name := item.UpdateFields["name"]

			if err := writer.Write([]string{
				value,
				name,
				item.Status,
				item.ErrorMessage,
			}); err != nil {
				return err
			}
		}
		return nil
	}

	// Existing CREATE report (MSISDN/MobileClass)
	if err := writer.Write([]string{
		"MSISDN",
		"MobileClass",
		"Status",
		"ErrorMessage",
	}); err != nil {
		return err
	}

	for _, item := range items {
		msisdn := ""
		mobileClass := ""

		for _, rc := range item.ResourceCharacteristic {
			switch rc.Code {
			case "MSISDN":
				msisdn = rc.Value
			case "MobileClass":
				mobileClass = rc.Value
			}
		}

		if err := writer.Write([]string{
			msisdn,
			mobileClass,
			item.Status,
			item.ErrorMessage,
		}); err != nil {
			return err
		}
	}

	return nil
}

func storeInGridFS(
	ctx context.Context,
	db *mongo.Database,
	filePath string,
	requestID string,
) (primitive.ObjectID, error) {

	bucket, err := gridfs.NewBucket(db)
	if err != nil {
		return primitive.NilObjectID, err
	}

	file, err := os.Open(filePath)
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer file.Close()

	uploadStream, err := bucket.OpenUploadStream(
		fmt.Sprintf("bulk_report_%s.csv", requestID),
	)
	if err != nil {
		return primitive.NilObjectID, err
	}
	defer uploadStream.Close()

	if _, err := io.Copy(uploadStream, file); err != nil {
		return primitive.NilObjectID, err
	}

	id, ok := uploadStream.FileID.(primitive.ObjectID)
	if !ok {
		return primitive.NilObjectID, fmt.Errorf("invalid GridFS FileID type")
	}

	return id, nil
}

func storeGridFS(ctx context.Context, db *mongo.Database, path, name string) (primitive.ObjectID, error) {
	// Create a GridFS bucket
	bucket, err := gridfs.NewBucket(db)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to create GridFS bucket: %w", err)
	}

	// Open the file
	f, err := os.Open(path)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to open file: %w", err)
	}
	defer f.Close()

	// Upload to GridFS
	uploadStream, err := bucket.OpenUploadStream(name)
	if err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to open upload stream: %w", err)
	}
	defer uploadStream.Close()

	if _, err := io.Copy(uploadStream, f); err != nil {
		return primitive.NilObjectID, fmt.Errorf("failed to copy file to GridFS: %w", err)
	}

	// Safely get ObjectID
	var fileID primitive.ObjectID
	switch v := uploadStream.FileID.(type) {
	case primitive.ObjectID:
		fileID = v
	case string:
		fileID, err = primitive.ObjectIDFromHex(v)
		if err != nil {
			return primitive.NilObjectID, fmt.Errorf("invalid FileID string: %s", v)
		}
	default:
		return primitive.NilObjectID, fmt.Errorf("unexpected FileID type: %T", v)
	}

	return fileID, nil
}
