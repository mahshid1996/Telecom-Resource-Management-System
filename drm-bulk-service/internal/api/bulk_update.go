package api

import (
	"bufio"
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"drm-bulk-service/internal/model"
	"drm-bulk-service/internal/report"
	"drm-bulk-service/internal/repository"
	"drm-bulk-service/internal/worker"
)

/*
===========================
POST /v1/drm-bulk/resources/update
Bulk UPDATE entrypoint

CSV format:

	value,name
	800700000,Router
	800700008,Router2

Form-data:

	type       = Router
	baseType   = LogicalResource
	schemaId   = ...
	categoryId = ...
	skipLines  = 1
	user*      = user info

===========================
*/
func (s *Server) handleBulkUpdateUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse multipart form (file + fields)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "invalid multipart form", http.StatusBadRequest)
		return
	}

	file, header, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "CSV file is required", http.StatusBadRequest)
		return
	}
	defer file.Close()

	skip, _ := strconv.Atoi(r.FormValue("skipLines"))

	// Build BulkRequest metadata
	req := model.BulkRequest{
		Type:       r.FormValue("type"),     // e.g. "Router"
		BaseType:   r.FormValue("baseType"), // "LogicalResource"
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

	// Insert BulkRequest document
	if err := s.bulkReqRepo.Insert(ctx, &req); err != nil {
		http.Error(w, "failed to create request", http.StatusInternalServerError)
		return
	}

	// Read CSV content: value,name
	scanner := bufio.NewScanner(file)
	line := 0
	var items []model.BulkItem

	for scanner.Scan() {
		line++
		if line <= skip {
			// skip header
			continue
		}

		text := scanner.Text()
		parts := strings.Split(text, ",")
		// we expect 3 columns: value,type,name
		if len(parts) < 3 {
			continue
		}

		value := strings.TrimSpace(parts[0])   // value column
		rowType := strings.TrimSpace(parts[1]) // type column from CSV
		rowName := strings.TrimSpace(parts[2]) // name column from CSV

		// decide which type to use for this item:
		// - if you pass type in form-data (req.Type), use that
		// - otherwise fall back to type from CSV
		itemType := req.Type
		if itemType == "" {
			itemType = rowType
		}

		updateFields := map[string]string{
			"name": rowName,
		}

		item := model.BulkItem{
			BulkRequestID: req.ID,
			Value:         value,
			Type:          itemType,
			BaseType:      req.BaseType,
			Status:        "pending",
			UpdateFields:  updateFields,
		}
		items = append(items, item)
	}

	if err := scanner.Err(); err != nil {
		http.Error(w, "failed to read CSV", http.StatusBadRequest)
		return
	}

	if len(items) == 0 {
		http.Error(w, "no valid rows found in CSV", http.StatusBadRequest)
		return
	}

	// Insert BulkItems
	if err := s.bulkItemRepo.InsertMany(ctx, items); err != nil {
		http.Error(w, "failed to save items", http.StatusInternalServerError)
		return
	}

	// Update totalCount in BulkRequest
	_ = s.bulkReqRepo.UpdateTotalCount(ctx, req.ID.Hex(), len(items))

	// Start background UPDATE processor
	go func() {
		bgCtx := context.Background()

		// Mongo-based updater for logicalresources collection
		logicalUpdater := repository.NewInventoryLogicalRepository(s.db)

		processor := worker.NewUpdateProcessor(
			s.invClient,
			s.bulkItemRepo,
			s.bulkReqRepo,
			report.NewService(s.bulkItemRepo, s.reportRepo, s.db),
			logicalUpdater, // logical updater
			nil,            // no physical updater yet
		)

		processor.Process(bgCtx, req, items)
	}()

	// Immediate response
	_ = json.NewEncoder(w).Encode(map[string]any{
		"requestId": req.ID.Hex(),
		"status":    "pending",
	})
}
