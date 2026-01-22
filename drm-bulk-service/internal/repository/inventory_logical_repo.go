package repository

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// InventoryLogicalRepository updates the logicalresources collection directly
type InventoryLogicalRepository struct {
	collection *mongo.Collection
}

// NewInventoryLogicalRepository creates a new repo bound to the logicalresources collection
func NewInventoryLogicalRepository(db *mongo.Database) *InventoryLogicalRepository {
	return &InventoryLogicalRepository{
		collection: db.Collection("logicalresources"),
	}
}

// UpdateByTypeAndValue updates one logical resource by (type, value)
// Example: fields["name"] = "Customer A Router"
func (r *InventoryLogicalRepository) UpdateByTypeAndValue(
	ctx context.Context,
	resourceType, value string,
	fields map[string]string,
) error {

	if resourceType == "" || value == "" {
		return fmt.Errorf("resourceType and value are required")
	}
	if len(fields) == 0 {
		// nothing to update – not an error
		log.Printf("[logicalresources] skip update: empty fields for type=%q value=%q", resourceType, value)
		return nil
	}

	filter := bson.M{
		"type":  resourceType,
		"value": value,
	}

	set := bson.M{
		"updatedAt": time.Now(),
	}
	for k, v := range fields {
		set[k] = v
	}

	update := bson.M{"$set": set}

	log.Printf("[logicalresources] UPDATE start: filter=%v set=%v", filter, set)

	res, err := r.collection.UpdateOne(ctx, filter, update)
	if err != nil {
		log.Printf("[logicalresources] UPDATE error: %v", err)
		return fmt.Errorf("update logicalresource failed: %w", err)
	}

	log.Printf("[logicalresources] UPDATE result: matched=%d modified=%d type=%q value=%q",
		res.MatchedCount, res.ModifiedCount, resourceType, value)

	if res.MatchedCount == 0 {
		// Extra debug: see if document exists at least by value
		var byValue bson.M
		err2 := r.collection.FindOne(ctx, bson.M{"value": value}).Decode(&byValue)
		if err2 != nil {
			log.Printf("[logicalresources] no doc found even by value=%q (err=%v)", value, err2)
		} else {
			log.Printf("[logicalresources] doc found by value=%q but filter type=%q didn't match: doc=%v",
				value, resourceType, byValue)
		}
		return fmt.Errorf("no logicalresource found for type=%s value=%s", resourceType, value)
	}

	// log the updated document when a match happened
	var doc bson.M
	if err := r.collection.FindOne(ctx, filter).Decode(&doc); err == nil {
		log.Printf("[logicalresources] UPDATED DOC: %v", doc)
	} else {
		log.Printf("[logicalresources] failed to load updated doc for type=%q value=%q: %v",
			resourceType, value, err)
	}

	return nil
}
