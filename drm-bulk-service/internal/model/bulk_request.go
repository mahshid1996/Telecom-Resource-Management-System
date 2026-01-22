package model

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type BulkRequest struct {
	ID primitive.ObjectID `bson:"_id,omitempty" json:"id"`

	// Metadata
	Type     string `bson:"type" json:"type"`
	BaseType string `bson:"baseType" json:"baseType"`

	FileName string `bson:"fileName" json:"fileName"`

	// User info
	UserName     string `bson:"userName" json:"userName"`
	UserRole     string `bson:"userRole" json:"userRole"`
	UserType     string `bson:"userType" json:"userType"`
	UserBaseType string `bson:"userBaseType" json:"userBaseType"`

	// Bulk statistics
	TotalCount     int `bson:"totalCount" json:"totalCount"`
	ProcessedCount int `bson:"processedCount" json:"processedCount"`
	SuccessCount   int `bson:"successCount" json:"successCount"`
	FailureCount   int `bson:"failureCount" json:"failureCount"`

	// Status & progress
	Status          string `bson:"status" json:"status"` // pending | processing | completed | failed
	ProgressPercent int    `bson:"progressPercent" json:"progressPercent"`

	// Time tracking
	CreatedAt   time.Time  `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time  `bson:"updatedAt" json:"updatedAt"`
	CompletedAt *time.Time `bson:"completedAt,omitempty" json:"completedAt,omitempty"`

	SchemaID   string `bson:"schemaId,omitempty" json:"schemaId,omitempty"`
	CategoryID string `bson:"categoryId,omitempty" json:"categoryId,omitempty"`
}
