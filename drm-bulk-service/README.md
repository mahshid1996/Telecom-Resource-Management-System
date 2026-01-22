================
DRM Bulk Service
================

The DRM Bulk Service provides asynchronous bulk provisioning of logical and physical resources into the Inventory system. Bulk requests are ingested via REST APIs, persisted in MongoDB, processed through a worker engine, and finalized with a downloadable execution report.

The service returns immediately after upload and executes provisioning asynchronously via the Inventory gRPC service.

---

## Features

* Bulk ingestion via HTTP REST
* Asynchronous processing using worker pool
* MongoDB persistence for requests, items, and reports
* Integration with Inventory gRPC microservices
* Status tracking (pending → processing → completed)
* Success/failure accounting
* Final report generation and download
* GridFS storage for report artifacts

---

## Architecture Components

| Component   | Responsibility                            |
| ----------- | ----------------------------------------- |
| Handler     | HTTP REST endpoints                       |
| Router      | Request routing                           |
| Service     | Business logic and report finalization    |
| Repository  | MongoDB read/write operations             |
| Worker      | Bulk execution engine (gRPC interactions) |
| Model       | Domain models                             |
| gRPC Client | Inventory communication layer             |

---

## Execution Flow

HTTP Upload
|
v
[ Bulk API Handler ]
|
|-- persist BulkRequest + BulkItems
|-- return requestId immediately
|
v
[ Worker Engine ]
|
|-- Inventory gRPC provisioning
|-- update item statuses
|-- update request summary (counts)
|
v
[ Report Service ]
|
|-- generate CSV
|-- store in GridFS
|-- expose via HTTP download

---

## Technology Stack

* Language: Go
* Data Store: MongoDB + GridFS
* Protocol: HTTP REST for ingestion
* Communication: gRPC for provisioning
* Deployment: Local or container

---

## Directory Layout

internal/
api/
repository/
report/
worker/
model/
grpc/
db/
cmd/
server/

---

## Environment Variables

| Variable               | Description               |
| ---------------------- | ------------------------- |
| MONGO_URI              | MongoDB connection string |
| MONGO_DB               | MongoDB database name     |
| INVENTORY_GRPC_ADDRESS | Inventory gRPC endpoint   |
| PORT                   | HTTP listener port        |

---

## Running Locally

1. Download dependencies
   go mod download

2. Start MongoDB (local or container)

3. Start service
   go run cmd/server/main.go

Service runs at:
[http://localhost](http://localhost):<PORT>

---

## REST Endpoints

POST /v1/drm-bulk/resources
Upload bulk file (CSV)

GET /v1/drm-bulk/resources/{requestId}
Retrieve request and item status

GET /v1/drm-bulk/resources/{requestId}/report
Download final execution report (CSV)

---

## gRPC Dependencies

The worker invokes:

* CreateLogicalResource
* CreatePhysicalResource

from the external Inventory microservices.

---

## Report Output

Report includes:

* Total items processed
* Success count
* Failure count
* Per-item errors
* Completed timestamp

---

## Planned Enhancements

* Retry / backoff mechanism
* Validation layer
* Update operations
* Rollback/failure handling
* Metrics and monitoring
  ==================================================

