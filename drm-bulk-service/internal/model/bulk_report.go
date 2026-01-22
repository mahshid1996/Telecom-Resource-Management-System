package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BulkReport struct {
	ID           primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RequestID    primitive.ObjectID `bson:"requestId" json:"requestId"`
	TotalItems   int                `bson:"totalItems" json:"totalItems"`
	SuccessCount int                `bson:"successCount" json:"successCount"`
	FailureCount int                `bson:"failureCount" json:"failureCount"`
	FileID       primitive.ObjectID `bson:"fileId" json:"fileId"`
	CreatedAt    time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time          `bson:"updatedAt" json:"updatedAt"`
}
