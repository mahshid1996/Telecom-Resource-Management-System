package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Mongo holds the MongoDB client and database connection instances
type Mongo struct {
	Client *mongo.Client
	DB     *mongo.Database
}

// Connect initializes and verifies the connection to MongoDB
func Connect(uri string, dbName string) (*Mongo, error) {
	// Create a context with a 10-second timeout for the connection process
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Initialize the MongoDB client using the provided URI
	client, err := mongo.Connect(ctx, options.Client().ApplyURI(uri))
	if err != nil {
		return nil, err
	}
	// Ping the server to verify the connection is actually established
	if err := client.Ping(ctx, nil); err != nil {
		return nil, err
	}

	log.Println("MongoDB connected")
	// Return a pointer to the Mongo struct containing the active client and database
	return &Mongo{
		Client: client,
		DB:     client.Database(dbName),
	}, nil
}
