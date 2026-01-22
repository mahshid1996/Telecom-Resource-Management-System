package repository

import (
	"context"
	"time"

	"drm-bulk-service/internal/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// BulkReportRepository handles database operations for bulk report documents
type BulkReportRepository struct {
	collection *mongo.Collection
}

// NewBulkReportRepository initializes the repository with the bulk_reports collection
func NewBulkReportRepository(db *mongo.Database) *BulkReportRepository {
	return &BulkReportRepository{
		collection: db.Collection("bulk_reports"),
	}
}

// Create inserts a new report into MongoDB with current timestamps
func (r *BulkReportRepository) Create(ctx context.Context, report *model.BulkReport) error {
	now := time.Now()
	report.CreatedAt = now
	report.UpdatedAt = now
	_, err := r.collection.InsertOne(ctx, report)
	return err
}

// FindByRequestID retrieves a single report by converting a string ID to a Mongo ObjectID
func (r *BulkReportRepository) FindByRequestID(
	ctx context.Context,
	reqID string,
) (*model.BulkReport, error) {

	var report model.BulkReport
	objectID, _ := primitive.ObjectIDFromHex(reqID)
	err := r.collection.FindOne(ctx, bson.M{"requestId": objectID}).Decode(&report)

	if err != nil {
		return nil, err
	}
	return &report, nil
}
