package main

import (
	"context"
	"log"
	"time"

	"drm-bulk-service/internal/api"
	"drm-bulk-service/internal/config"
	"drm-bulk-service/internal/db"
	grpcclient "drm-bulk-service/internal/grpc"
	"drm-bulk-service/internal/repository"
)

func main() {
	// Load configuration (PORT, MONGO_URI, MONGO_DB)
	cfg := config.Load()

	// Connect to MongoDB
	mongoConn, err := db.Connect(cfg.MongoURI, cfg.MongoDB)
	if err != nil {
		log.Fatal("MongoDB connection failed:", err)
	}
	defer func() {
		// graceful disconnect on shutdown
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		if err := mongoConn.Client.Disconnect(ctx); err != nil {
			log.Println("Mongo disconnect error:", err)
		}
	}()

	// Initialize repositories (Mongo collections)
	bulkReqRepo := repository.NewBulkRequestRepository(mongoConn.DB)
	bulkItemRepo := repository.NewBulkItemRepository(mongoConn.DB)
	reportRepo := repository.NewBulkReportRepository(mongoConn.DB)
	schemaRepo := repository.NewSchemaRepository(mongoConn.DB) // for schemaId support

	// Create Inventory gRPC client (Logical + Physical)
	// replace "localhost:50051" with real address in non-local env
	invClient, err := grpcclient.NewInventoryClient("localhost:50051")
	if err != nil {
		log.Fatal("Inventory gRPC connection failed:", err)
	}
	log.Println("Inventory gRPC connected")

	// Create HTTP API server with all dependencies injected
	server := api.NewServer(
		cfg,
		bulkReqRepo,
		bulkItemRepo,
		reportRepo,
		invClient,
		mongoConn.DB,
		schemaRepo,
	)

	// Start HTTP server
	log.Println("Bulk service starting on port", cfg.Port)
	if err := server.Start(); err != nil {
		log.Fatal(err)
	}
}
