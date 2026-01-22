package repository

import (
	"context"
	"fmt"
	"time"

	"drm-bulk-service/internal/model"

	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type BulkItemRepository struct {
	collection *mongo.Collection
}

func NewBulkItemRepository(db *mongo.Database) *BulkItemRepository {
	return &BulkItemRepository{
		collection: db.Collection("bulk_items"),
	}
}

// InsertMany inserts multiple BulkItem documents and sets default fields
func (r *BulkItemRepository) InsertMany(ctx context.Context, items []model.BulkItem) error {
	now := time.Now()
	for i := range items {
		items[i].CreatedAt = now
		items[i].UpdatedAt = now
		items[i].Status = "pending"
	}

	docs := make([]interface{}, len(items))
	for i, item := range items {
		docs[i] = item
	}

	res, err := r.collection.InsertMany(ctx, docs)
	if err != nil {
		return err
	}

	// Copy generated ObjectIDs back into slice
	for i, insertedID := range res.InsertedIDs {
		if oid, ok := insertedID.(primitive.ObjectID); ok {
			items[i].ID = oid
		}
	}

	return nil
}

// UpdateStatus updates the status and error message of a single BulkItem
func (r *BulkItemRepository) UpdateStatus(ctx context.Context, itemID, status, errMsg string) error {
	objID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return fmt.Errorf("invalid itemID: %w", err)
	}

	update := map[string]interface{}{
		"status":       status,
		"errorMessage": errMsg,
		"updatedAt":    time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, map[string]interface{}{"$set": update})
	return err
}

// FindByBulkRequestID returns all BulkItems associated with a given BulkRequestID
func (r *BulkItemRepository) FindByBulkRequestID(ctx context.Context, bulkReqID string) ([]model.BulkItem, error) {
	objectID, err := primitive.ObjectIDFromHex(bulkReqID)
	if err != nil {
		return nil, fmt.Errorf("invalid bulkRequestID: %w", err)
	}

	filter := map[string]interface{}{
		"bulkRequestId": objectID,
	}

	cursor, err := r.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var items []model.BulkItem
	for cursor.Next(ctx) {
		var item model.BulkItem
		if err := cursor.Decode(&item); err != nil {
			return nil, err
		}
		items = append(items, item)
	}

	if err := cursor.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// UpdateItemCounts updates success and failure counts for a BulkItem
func (r *BulkItemRepository) UpdateItemCounts(ctx context.Context, itemID string, success, failure int) error {
	objID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return err
	}

	update := map[string]interface{}{
		"successCount": success,
		"failureCount": failure,
		"updatedAt":    time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, map[string]interface{}{"$set": update})
	return err
}
func (r *BulkItemRepository) UpdateItemStatus(ctx context.Context, itemID string, status string) error {
	objID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return fmt.Errorf("invalid itemID: %w", err)
	}

	update := map[string]interface{}{
		"status":    status,
		"updatedAt": time.Now(),
	}

	_, err = r.collection.UpdateByID(ctx, objID, map[string]interface{}{"$set": update})
	return err
}

func (r *BulkItemRepository) UpdateItemStatusWithError(
	ctx context.Context,
	itemID, status, errMsg string,
) error {
	objID, err := primitive.ObjectIDFromHex(itemID)
	if err != nil {
		return err
	}

	_, err = r.collection.UpdateByID(
		ctx,
		objID,
		map[string]interface{}{
			"$set": map[string]interface{}{
				"status":       status,
				"errorMessage": errMsg,
				"updatedAt":    time.Now(),
			},
		},
	)
	return err
}
