package grpcclient

import (
	"context"
	"fmt"
	"time"

	logicalpb "drm-bulk-service/internal/proto/logicalresource"
	physicalpb "drm-bulk-service/internal/proto/physicalresource"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

type InventoryClient struct {
	Logical  logicalpb.LogicalResourceServiceClient
	Physical physicalpb.PhysicalResourceServiceClient
}

// NewInventoryClient creates a gRPC connection to Inventory server
func NewInventoryClient(address string) (*InventoryClient, error) {
	conn, err := grpc.Dial(
		address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithBlock(),
		grpc.WithTimeout(5*time.Second), // timeout for connection
	)
	if err != nil {
		return nil, fmt.Errorf("failed to dial Inventory gRPC server: %w", err)
	}

	return &InventoryClient{
		Logical:  logicalpb.NewLogicalResourceServiceClient(conn),
		Physical: physicalpb.NewPhysicalResourceServiceClient(conn),
	}, nil
}

// Context provides a timeout context for gRPC calls
func Context() (context.Context, context.CancelFunc) {
	return context.WithTimeout(context.Background(), 10*time.Second)
}
