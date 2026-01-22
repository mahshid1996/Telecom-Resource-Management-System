package model

import "go.mongodb.org/mongo-driver/bson/primitive"

type PropertySchema struct {
	Type    string `bson:"type" json:"type"`
	Pattern string `bson:"pattern,omitempty" json:"pattern,omitempty"`
}

type ResourceSchema struct {
	Properties map[string]PropertySchema `bson:"properties" json:"properties"`
	Required   []string                  `bson:"required" json:"required"`
}

type Schema struct {
	ID             primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Version        int                `bson:"version" json:"version"`
	Name           string             `bson:"name" json:"name"`
	Description    string             `bson:"description" json:"description"`
	ResourceSchema ResourceSchema     `bson:"resourceSchema" json:"resourceSchema"`
}
