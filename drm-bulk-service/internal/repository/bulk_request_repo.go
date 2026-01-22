package repository

import (
	"context"
	"time"

	"drm-bulk-service/internal/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BulkRequestRepository struct {
	collection *mongo.Collection
}

func NewBulkRequestRepository(db *mongo.Database) *BulkRequestRepository {
	return &BulkRequestRepository{
		collection: db.Collection("bulk_requests"),
	}
}

// Insert creates a new BulkRequest
func (r *BulkRequestRepository) Insert(ctx context.Context, req *model.BulkRequest) error {
	now := time.Now()
	req.CreatedAt = now
	req.UpdatedAt = now
	req.Status = "pending"
	req.ProgressPercent = 0

	res, err := r.collection.InsertOne(ctx, req)
	if err != nil {
		return err
	}

	req.ID = res.InsertedID.(primitive.ObjectID)
	return nil
}

// GetByID returns a BulkRequest by its ID
func (r *BulkRequestRepository) GetByID(ctx context.Context, reqID string) (*model.BulkRequest, error) {
	var req model.BulkRequest
	objID, _ := primitive.ObjectIDFromHex(reqID)
	err := r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&req)
	if err != nil {
		return nil, err
	}
	return &req, nil
}

// UpdateTotalCount sets the total count for items in a BulkRequest
func (r *BulkRequestRepository) UpdateTotalCount(ctx context.Context, reqID string, total int) error {
	objID, err := primitive.ObjectIDFromHex(reqID)
	if err != nil {
		return err
	}

	update := bson.M{
		"totalCount":      total,
		"progressPercent": 0,
		"updatedAt":       time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, bson.M{"$set": update})
	return err
}

// UpdateProgress sets the progress percent of a BulkRequest
func (r *BulkRequestRepository) UpdateProgress(ctx context.Context, reqID string, progress int) error {
	objID, err := primitive.ObjectIDFromHex(reqID)
	if err != nil {
		return err
	}

	update := bson.M{
		"progressPercent": progress,
		"updatedAt":       time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, bson.M{"$set": update})
	return err
}

// SaveReport stores a report in the bulk_reports collection
func (r *BulkRequestRepository) SaveReport(ctx context.Context, report *model.BulkReport) error {
	now := time.Now()
	report.CreatedAt = now
	report.UpdatedAt = now

	collection := r.collection.Database().Collection("bulk_reports")
	_, err := collection.InsertOne(ctx, report)
	return err
}

// Collection returns the MongoDB collection
func (r *BulkRequestRepository) Collection() *mongo.Collection {
	return r.collection
}

/*
===========================
Interface methods for Processor
===========================
*/

// UpdateStatus implements BulkRequestUpdater
func (r *BulkRequestRepository) UpdateStatus(ctx context.Context, id string, status string) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	update := bson.M{
		"status":    status,
		"updatedAt": time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, bson.M{"$set": update})
	return err
}

// UpdateCounts implements BulkRequestUpdater
func (r *BulkRequestRepository) UpdateCounts(ctx context.Context, id string, processed, success, failure int) error {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	update := bson.M{
		"processedCount": processed,
		"successCount":   success,
		"failureCount":   failure,
		"updatedAt":      time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, bson.M{"$set": update})
	return err
}
