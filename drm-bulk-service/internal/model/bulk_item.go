package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type ResourceCharacteristic struct {
	Code  string `bson:"code" json:"code"`
	Name  string `bson:"name" json:"name"`
	Value string `bson:"value" json:"value"`
}

type BulkItem struct {
	ID            primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	BulkRequestID primitive.ObjectID `bson:"bulkRequestId"`

	Value    string `bson:"value" json:"value"`
	Type     string `bson:"type" json:"type"`
	BaseType string `bson:"baseType" json:"baseType"`

	Status       string `bson:"status" json:"status"`
	ErrorMessage string `bson:"errorMessage,omitempty" json:"errorMessage,omitempty"`

	// For bulk create report
	ResourceCharacteristic []ResourceCharacteristic `bson:"resourceCharacteristic,omitempty" json:"resourceCharacteristic,omitempty"`

	UpdateFields map[string]string `bson:"updateFields,omitempty" json:"updateFields,omitempty"`

	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
}
