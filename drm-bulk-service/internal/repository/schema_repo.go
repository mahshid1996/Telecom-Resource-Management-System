package repository

import (
	"context"

	"drm-bulk-service/internal/model"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type SchemaRepository struct {
	collection *mongo.Collection
}

func NewSchemaRepository(db *mongo.Database) *SchemaRepository {
	return &SchemaRepository{
		collection: db.Collection("resourceschemas"),
	}
}

func (r *SchemaRepository) GetByID(ctx context.Context, id string) (*model.Schema, error) {
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var s model.Schema
	if err := r.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&s); err != nil {
		return nil, err
	}
	return &s, nil
}
