package repository

import (
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// InventoryPhysicalRepository updates physicalresources collection directly
type InventoryPhysicalRepository struct {
	collection *mongo.Collection
}

func NewInventoryPhysicalRepository(db *mongo.Database) *InventoryPhysicalRepository {
	return &InventoryPhysicalRepository{
		collection: db.Collection("physicalresources"),
	}
}

func (r *InventoryPhysicalRepository) UpdateByTypeAndValue(
	ctx context.Context,
	resourceType, value string,
	fields map[string]string,
) error {

	if resourceType == "" || value == "" {
		return fmt.Errorf("resourceType and value are required")
	}
	if len(fields) == 0 {
		return nil
	}

	filter := bson.M{
		"type":  resourceType,
		"value": value,
	}

	set := bson.M{"updatedAt": time.Now()}
	for k, v := range fields {
		set[k] = v
	}
	update := bson.M{"$set": set}

	res, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return fmt.Errorf("update physicalresource failed: %w", err)
	}
	if res.MatchedCount == 0 {
		return fmt.Errorf("no physicalresource found for type=%s value=%s", resourceType, value)
	}
	return nil
}
