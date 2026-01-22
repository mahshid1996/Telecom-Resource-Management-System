package api

import (
	"bufio"
	"context"
	"drm-bulk-service/internal/config"
	grpcclient "drm-bulk-service/internal/grpc"
	"drm-bulk-service/internal/health"
	"drm-bulk-service/internal/model"
	"drm-bulk-service/internal/report"
	"drm-bulk-service/internal/repository"
	"drm-bulk-service/internal/worker"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/gridfs"
	"go.mongodb.org/mongo-driver/mongo/options"
)

/*
Server is the HTTP API layer

It holds:
- configuration
- HTTP mux/router
- repositories for bulk_request, bulk_item, bulk_report
- gRPC inventory client
- Mongo database handle (for GridFS, etc.)
- schemaRepo: to load schema documents by schemaId
*/
type Server struct {
	cfg          config.Config
	mux          *http.ServeMux
	bulkReqRepo  *repository.BulkRequestRepository
	bulkItemRepo *repository.BulkItemRepository
	reportRepo   *repository.BulkReportRepository
	invClient    *grpcclient.InventoryClient
	db           *mongo.Database

	schemaRepo *repository.SchemaRepository // access to schema collection
}

/*
===========================
Server Setup
===========================
*/
// withCORS enables browser calls from your Vite UI (http://localhost:5173)
// Without this, the browser blocks the request (Failed to fetch) and your handlers won't log anything
func withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Allow local dev origins (Vite)
		allowed := map[string]bool{
			"http://localhost:5173": true,
			"http://127.0.0.1:5173": true,
		}

		if allowed[origin] {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			// good practice for caches/proxies
			w.Header().Set("Vary", "Origin")
		}

		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "600")

		// Preflight request
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// NewServer creates the Server and wires all dependencies
func NewServer(
	cfg config.Config,
	bulkReqRepo *repository.BulkRequestRepository,
	bulkItemRepo *repository.BulkItemRepository,
	reportRepo *repository.BulkReportRepository,
	invClient *grpcclient.InventoryClient,
	db *mongo.Database,
	schemaRepo *repository.SchemaRepository,
) *Server {
	s := &Server{
		cfg:          cfg,
		mux:          http.NewServeMux(),
		bulkReqRepo:  bulkReqRepo,
		bulkItemRepo: bulkItemRepo,
		reportRepo:   reportRepo,
		invClient:    invClient,
		db:           db,
		schemaRepo:   schemaRepo,
	}
	s.routes() // register routes
	return s
}

// routes sets up all HTTP endpoints
func (s *Server) routes() {
	// Health check
	s.mux.HandleFunc("/health", health.Handler)

	// POST: bulk create
	s.mux.HandleFunc("/v1/drm-bulk/resources", s.handleBulkUpload)

	// POST: bulk update (implemented in bulk_update.go)
	s.mux.HandleFunc("/v1/drm-bulk/resources/update", s.handleBulkUpdateUpload)

	// GET: request details OR report download
	s.mux.HandleFunc("/v1/drm-bulk/resources/", s.handleGet)

	// GET: bulk export
	s.mux.HandleFunc("/v1/drm-bulk/resources/export", s.handleBulkExport)
}

/*
===========================
POST /v1/drm-bulk/resources
Bulk CREATE entrypoint
===========================
*/
func (s *Server) handleBulkUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart/form-data (file + form fields)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Invalid multipart form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "CSV file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	// How many header lines to skip in CSV
	skip, _ := strconv.Atoi(r.FormValue("skipLines"))

	// Build BulkRequest master record.
	// Here we store:
	// - type / baseType  (resource type)
	// - schemaId / categoryId from form-data
	req := model.BulkRequest{
		Type:       r.FormValue("type"),
		BaseType:   r.FormValue("baseType"),
		FileName:   header.Filename,
		Status:     "pending",
		SchemaID:   r.FormValue("schemaId"),
		CategoryID: r.FormValue("categoryId"),

		UserName:     r.FormValue("userName"),
		UserRole:     r.FormValue("userRole"),
		UserType:     r.FormValue("userType"),
		UserBaseType: r.FormValue("userBaseType"),
	}

	ctx := r.Context()

	// Optional: load schema by schemaId if provided
	// Later (Phase 2) we will pass this schema into the worker to shape the gRPC payload
	if req.SchemaID != "" {
		schema, err := s.schemaRepo.GetByID(ctx, req.SchemaID)
		if err != nil {
			log.Printf("Failed to load schema %s: %v", req.SchemaID, err)
		} else {
			log.Printf("Loaded schema %s (%s)", req.SchemaID, schema.Name)
			// TODO (Phase 2): use this schema in worker to build LogicalResource payload
		}
	}

	// Insert BulkRequest into MongoDB
	if err := s.bulkReqRepo.Insert(ctx, &req); err != nil {
		http.Error(w, "Failed to create request", http.StatusInternalServerError)
		return
	}

	// Read CSV file line by line and build BulkItem slice
	scanner := bufio.NewScanner(file)
	var items []model.BulkItem
	line := 0

	for scanner.Scan() {
		line++
		if line <= skip {
			// skip header lines
			continue
		}

		text := scanner.Text()
		parts := strings.Split(text, ",")
		if len(parts) < 2 {
			continue
		}

		// For creation we still interpret:
		//   parts[0] = MSISDN
		//   parts[1] = MobileClass
		// and store them as resourceCharacteristics
		items = append(items, model.BulkItem{
			BulkRequestID: req.ID,
			Value:         text, // you can change to parts[0] if you want
			Type:          req.Type,
			BaseType:      req.BaseType,
			Status:        "pending",
			ResourceCharacteristic: []model.ResourceCharacteristic{
				{Code: "MSISDN", Value: parts[0]},
				{Code: "MobileClass", Value: parts[1]},
			},
		})
	}

	if err := scanner.Err(); err != nil {
		http.Error(w, "Failed to read CSV", http.StatusBadRequest)
		return
	}

	// Insert all BulkItems into MongoDB
	if err := s.bulkItemRepo.InsertMany(ctx, items); err != nil {
		http.Error(w, "Failed to save items", http.StatusInternalServerError)
		return
	}

	// Update BulkRequest with total item count
	_ = s.bulkReqRepo.UpdateTotalCount(ctx, req.ID.Hex(), len(items))

	// Start background worker to process the bulk creation
	go func() {
		bgCtx := context.Background()

		processor := worker.NewProcessor(
			s.invClient,
			s.bulkItemRepo,
			s.bulkReqRepo,
			report.NewService(s.bulkItemRepo, s.reportRepo, s.db),
		)

		processor.Process(bgCtx, req, items)
	}()

	// Respond immediately to client; processing continues in background
	_ = json.NewEncoder(w).Encode(map[string]any{
		"requestId": req.ID.Hex(),
		"status":    "pending",
	})
}

/*
===========================
GET /v1/drm-bulk/resources/{id}
GET /v1/drm-bulk/resources/{id}/report
===========================
*/
func (s *Server) handleGet(w http.ResponseWriter, r *http.Request) {
	if strings.HasSuffix(r.URL.Path, "/report") {
		s.handleReportDownload(w, r)
		return
	}
	s.handleGetRequest(w, r)
}

// handleGetRequest returns BulkRequest + all its BulkItems
func (s *Server) handleGetRequest(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/v1/drm-bulk/resources/")
	reqID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	req, _ := s.bulkReqRepo.GetByID(ctx, reqID.Hex())
	items, _ := s.bulkItemRepo.FindByBulkRequestID(ctx, reqID.Hex())

	_ = json.NewEncoder(w).Encode(map[string]any{
		"request": req,
		"items":   items,
	})
}

/*
===========================
GET /v1/drm-bulk/resources/{id}/report
Streams CSV report from GridFS
===========================
*/
func (s *Server) handleReportDownload(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSuffix(
		strings.TrimPrefix(r.URL.Path, "/v1/drm-bulk/resources/"),
		"/report",
	)

	reqID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		http.Error(w, "Invalid request ID", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	reportDoc, err := s.reportRepo.FindByRequestID(ctx, reqID.Hex())
	if err != nil || reportDoc == nil {
		http.Error(w, "Report not ready", http.StatusNotFound)
		return
	}

	bucket, err := gridfs.NewBucket(s.db)
	if err != nil {
		http.Error(w, "Storage error", http.StatusInternalServerError)
		return
	}

	stream, err := bucket.OpenDownloadStream(reportDoc.FileID)
	if err != nil {
		http.Error(w, "Failed to read report", http.StatusInternalServerError)
		return
	}
	defer stream.Close()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set(
		"Content-Disposition",
		fmt.Sprintf("attachment; filename=bulk_report_%s.csv", reqID.Hex()),
	)

	// Stream GridFS file directly to HTTP response
	if _, err := io.Copy(w, stream); err != nil {
		log.Println("Failed to stream report:", err)
		http.Error(w, "Failed to stream report", http.StatusInternalServerError)
		return
	}
}

// Start runs the HTTP server on the configured port
// Start runs the HTTP server on the configured port
func (s *Server) Start() error {
	return http.ListenAndServe(":"+s.cfg.Port, withCORS(s.mux))
}

/*
===========================
GET /v1/drm-bulk/resources/export
Bulk EXPORT (synchronous, CSV streaming)

Query params:

	baseType        = LogicalResource | PhysicalResource  (default: LogicalResource)
	limit           = number of rows to export (default: 1000)
	fields          = comma-separated list of fields, e.g. "value,name,baseType,category"
	                  - "value" is always included (mandatory)
	type            = filter by resource type (e.g. "Router", "MSISDN")
	resourceStatus  = filter by resourceStatus (if your documents have it)
	valueFrom       = lower bound for value (inclusive)  (optional, string compare)
	valueTo         = upper bound for value (inclusive)  (optional)

Examples:

	/v1/drm-bulk/resources/export?baseType=LogicalResource&type=Router&limit=1000&fields=value,name,baseType,category

	/v1/drm-bulk/resources/export?baseType=LogicalResource&valueFrom=800700000&valueTo=800700999&fields=value,name,baseType,type

===========================
*/
func (s *Server) handleBulkExport(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	ctx := r.Context()
	q := r.URL.Query()

	// BaseType → select collection
	baseType := q.Get("baseType")
	if baseType == "" {
		baseType = "LogicalResource"
	}

	var coll *mongo.Collection
	switch baseType {
	case "PhysicalResource":
		coll = s.db.Collection("physicalresources")
	default:
		// default to logicalresources
		coll = s.db.Collection("logicalresources")
	}

	// Limit
	limit := int64(1000)
	if lStr := q.Get("limit"); lStr != "" {
		if l, err := strconv.ParseInt(lStr, 10, 64); err == nil && l > 0 {
			limit = l
		}
	}

	// Fields (dynamic header). "value" must always be present
	fieldsParam := q.Get("fields")
	if fieldsParam == "" {
		fieldsParam = "value" // default only value
	}
	rawFields := strings.Split(fieldsParam, ",")
	var fields []string
	hasValue := false
	for _, f := range rawFields {
		f = strings.TrimSpace(f)
		if f == "" {
			continue
		}
		if f == "value" {
			hasValue = true
		}
		fields = append(fields, f)
	}
	if !hasValue {
		fields = append([]string{"value"}, fields...)
	}

	// Build Mongo filter
	filter := bson.M{}
	// optional baseType field in docs
	filter["baseType"] = baseType

	if t := q.Get("type"); t != "" {
		filter["type"] = t
	}
	if rs := q.Get("resourceStatus"); rs != "" {
		filter["resourceStatus"] = rs
	}

	// Optional range on value
	valueFrom := q.Get("valueFrom")
	valueTo := q.Get("valueTo")
	if valueFrom != "" || valueTo != "" {
		rangeCond := bson.M{}
		if valueFrom != "" {
			rangeCond["$gte"] = valueFrom
		}
		if valueTo != "" {
			rangeCond["$lte"] = valueTo
		}
		filter["value"] = rangeCond
	}

	// Query Mongo
	findOpts := options.Find().SetLimit(limit)
	// Optional: sort by value ascending
	findOpts.SetSort(bson.D{{Key: "value", Value: 1}})

	cursor, err := coll.Find(ctx, filter, findOpts)
	if err != nil {
		log.Printf("export: Mongo Find error: %v", err)
		http.Error(w, "failed to query resources", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	// Prepare CSV response
	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set(
		"Content-Disposition",
		fmt.Sprintf(`attachment; filename="resource_export_%d.csv"`, time.Now().Unix()),
	)

	writer := csv.NewWriter(w)
	defer writer.Flush()

	// CSV header
	if err := writer.Write(fields); err != nil {
		log.Printf("export: write header error: %v", err)
		http.Error(w, "failed to write csv header", http.StatusInternalServerError)
		return
	}

	// 7) Stream rows
	for cursor.Next(ctx) {
		var doc bson.M
		if err := cursor.Decode(&doc); err != nil {
			log.Printf("export: decode error: %v", err)
			http.Error(w, "failed to decode resource", http.StatusInternalServerError)
			return
		}

		row := make([]string, len(fields))
		for i, f := range fields {
			row[i] = extractField(doc, f)
		}

		if err := writer.Write(row); err != nil {
			log.Printf("export: write row error: %v", err)
			http.Error(w, "failed to write csv row", http.StatusInternalServerError)
			return
		}
	}

	if err := cursor.Err(); err != nil {
		log.Printf("export: cursor error: %v", err)
		http.Error(w, "failed to iterate resources", http.StatusInternalServerError)
		return
	}
}

// extractField returns a string value for a given field name from a Mongo document
// It supports simple top-level fields and array fields (joined by ';')
func extractField(doc bson.M, field string) string {
	v, ok := doc[field]
	if !ok {
		return ""
	}

	switch val := v.(type) {
	case string:
		return val
	case []interface{}:
		// e.g. category: [], businessType: []
		parts := make([]string, 0, len(val))
		for _, el := range val {
			parts = append(parts, fmt.Sprint(el))
		}
		return strings.Join(parts, ";")
	default:
		return fmt.Sprint(v)
	}
}
