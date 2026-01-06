/**
 * @file logicalResource.controller.js
 * @description Handles business logic for managing logical resources.
 * 
 * Responsibilities:
 * - Receive requests from routes
 * - Validate input data
 * - Interact with the service layer to perform CRUD operations
 * - Send appropriate responses (success or error)
 */

// Import necessary modules and utilities
const LogicalResource = require('../models/logicalResource.model');
const { kafkaProducer } = require('../config');
const { auditLog } = require('../services/audit.service');
const { applog } = require('../services/logger.service.js');

/**
 * @swagger
 * tags:
 *   name: LogicalResource
 *   description: Logical resource management
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     LogicalResource:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f2a9c8b2f1a123456789ab"
 *         name:
 *           type: string
 *           example: "UI Test 14"
 *         value:
 *           type: string
 *           example: "1234567890"
 *         type:
 *           type: string
 *           example: "MSISDN"
 *         description:
 *           type: string
 *           example: "Mobile number"
 *         isBundle:
 *           type: boolean
 *           example: false
 *         businessType:
 *           type: array
 *           items:
 *             type: string
 *             example: "Postpaid"
 *         category:
 *           type: array
 *           items:
 *             type: string
 *             example: "SIM Card"
 *         note:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               authorRole:
 *                 type: string
 *               author:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *               text:
 *                 type: string
 *         baseType:
 *           type: string
 *           example: "LogicalResource"
 *         resourceStatus:
 *           type: string
 *           example: "Available"
 *         operationalState:
 *           type: string
 *           example: "Functional"
 *         cost:
 *           type: object
 *           properties:
 *             taxFreeValue:
 *               type: number
 *               example: 0
 *             taxedValue:
 *               type: number
 *               example: 0
 *             unit:
 *               type: string
 *               example: "USD"
 *
 * security:
 *   - bearerAuth: []
 */


/**
 * @swagger
 * /api/logical-resources:
 *   post:
 *     summary: Create a new logical resource
 *     tags: [LogicalResource]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               isBundle:
 *                 type: boolean
 *               businessType:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *               note:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     authorRole:
 *                       type: string
 *                     author:
 *                       type: string
 *                     date:
 *                       type: string
 *                     text:
 *                       type: string
 *     responses:
 *       201:
 *         description: Resource created successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/logical-resources/{id}:
 *   patch:
 *     summary: Update an existing logical resource
 *     tags: [LogicalResource]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The resource ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               value:
 *                 type: string
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               isBundle:
 *                 type: boolean
 *               businessType:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *               note:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     authorRole:
 *                       type: string
 *                     author:
 *                       type: string
 *                     date:
 *                       type: string
 *                     text:
 *                       type: string
 *     responses:
 *       200:
 *         description: Resource updated successfully
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/logical-resources/{id}:
 *   delete:
 *     summary: Delete a logical resource
 *     tags: [LogicalResource]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The resource ID
 *     responses:
 *       200:
 *         description: Resource deleted successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/logical-resources/{id}:
 *   get:
 *     summary: Get a logical resource by ID
 *     tags: [LogicalResource]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The resource ID
 *     responses:
 *       200:
 *         description: Resource fetched successfully
 *       404:
 *         description: Resource not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/logical-resources:
 *   get:
 *     summary: Get logical resources with filtering, sorting, and pagination
 *     tags: [LogicalResource]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Maximum number of resources to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of resources to skip
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: "-name"
 *         description: Sort by field, prefix '-' for DESC, '+' for ASC
 *       # Comparison operators
 *       - in: query
 *         name: version.gt
 *         schema:
 *           type: number
 *         description: Filter resources with version greater than this value
 *       - in: query
 *         name: version.gte
 *         schema:
 *           type: number
 *         description: Filter resources with version greater than or equal to this value
 *       - in: query
 *         name: version.lt
 *         schema:
 *           type: number
 *         description: Filter resources with version less than this value
 *       - in: query
 *         name: version.lte
 *         schema:
 *           type: number
 *         description: Filter resources with version less than or equal to this value
 *       # Regex search
 *       - in: query
 *         name: name.regex
 *         schema:
 *           type: string
 *           example: "^UI Test"
 *         description: Regex search on resource name
 *       - in: query
 *         name: description.regex
 *         schema:
 *           type: string
 *           example: "Mobile number"
 *         description: Regex search on description
 *     responses:
 *       200:
 *         description: List of logical resources
 *         headers:
 *           X-Total-Count:
 *             description: Total number of logical resources matching the filter
 *             schema:
 *               type: integer
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/LogicalResource'
 *       500:
 *         description: Internal server error
 */


// Create a new Logical Resource
exports.createLogicalResource = async (req, res) => {
  try {
    const { value, type, description } = req.body;

    // Validate mandatory fields
    if (!value || !type) {
      return res.status(400).json({ error: 'Value and type are required' });
    }

    // Build the resource document using request body data
    const resource = new LogicalResource({
      description,
      name: req.body.name,
      type,
      isBundle: typeof req.body.isBundle === 'boolean' ? req.body.isBundle : false,
      businessType: Array.isArray(req.body.businessType) ? req.body.businessType : [],
      category: Array.isArray(req.body.category) ? req.body.category : [req.body.category], // make array
      value: req.body.value,
      note: Array.isArray(req.body.note)
        ? req.body.note.map(n => ({
            authorRole: n.authorRole,
            author: n.author,
            date: new Date(n.date),
            text: n.text,
          }))
        : [],
      relatedParty: Array.isArray(req.body.relatedParty) ? req.body.relatedParty : [],
      resourceCharacteristic: Array.isArray(req.body.resourceCharacteristic)
        ? req.body.resourceCharacteristic
        : [],
      resourceRelationship: Array.isArray(req.body.resourceRelationship)
        ? req.body.resourceRelationship
        : [],
      bundledResources: Array.isArray(req.body.bundledResources) ? req.body.bundledResources : [],
    });

    // Save the resource in MongoDB
    const saved = await resource.save();
    // Add a readable `id` field from MongoDB _id
    saved.id = saved._id.toString();
    await saved.save();

    auditLog('CREATE', 'LogicalResource', saved._id, req.user?.username || 'unknown');

    // Send a Kafka event after successful creation
    const eventPayload = JSON.stringify({
      event: 'LogicalResourceCreated',
      data: saved,
      timestamp: new Date().toISOString(),
    });

    applog('info', new Date().toISOString(), 'Sending Kafka event:' + eventPayload);
    // Publish event to Kafka topic
    kafkaProducer.send(
      [{ topic: 'logical-resource-events', messages: eventPayload }],
      (err, data) => {
        if (err) {
          applog('error', new Date().toISOString(), 'Kafka publish failed: ' + err.message);
        } else {
          applog('info', new Date().toISOString(), 'Kafka event published successfully');
          applog('info', new Date().toISOString(), 'Kafka publish result:' + data);
        }
      }
    );

    applog('info', new Date().toISOString(), `Resource created: ${saved._id}`);
    res.status(201).json(saved);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Create logical resource failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get Logical Resources with advanced query parameters
exports.getLogicalResources = async (req, res) => {
  try {
    const { buildQuery } = require('../utils/queryBuilder');
    const { filter, queryOptions } = buildQuery(req.query);

    // Fetch paginated resources (same behavior as before)
    const resources = await LogicalResource.find(filter)
      .skip(queryOptions.skip)
      .limit(queryOptions.limit)
      .sort(queryOptions.sort);

    // NEW: count total number of resources matching the filter (ignoring limit/offset)
    const totalCount = await LogicalResource.countDocuments(filter);

    // Expose total count in response headers (visible in Postman, etc.)
    res.set('X-Total-Count', totalCount.toString());
    // For browsers/clients with CORS, explicitly expose the header
    res.set('Access-Control-Expose-Headers', 'X-Total-Count');

    applog(
      'info',
      new Date().toISOString(),
      `Fetched ${resources.length} logical resources with filters (total matching: ${totalCount})`
    );

    res.json(resources);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Fetch logical resources failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get a Logical Resource by ID
exports.getLogicalResourceById = async (req, res) => {
  try {
    const resource = await LogicalResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    applog('info', new Date().toISOString(), `Fetched resource: ${resource._id}`);
    res.json(resource);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Fetch by ID failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Update an existing Logical Resource
exports.updateLogicalResource = async (req, res) => {
  try {
    const updated = await LogicalResource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Resource not found' });

    auditLog('UPDATE', 'LogicalResource', updated._id, req.user?.username || 'unknown');

    const eventPayload = JSON.stringify({
      event: 'LogicalResourceUpdated',
      data: updated,
      timestamp: new Date().toISOString(),
    });

    kafkaProducer.send([{ topic: 'logical-resource-events', messages: eventPayload }], err => {
      if (err) applog('error', new Date().toISOString(), 'Kafka publish failed: ' + err.message);
      else applog('info', new Date().toISOString(), 'Kafka event published: LogicalResourceUpdated');
    });

    applog('info', new Date().toISOString(), `Resource updated: ${updated._id}`);
    res.json(updated);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Update logical resource failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

// Delete a Logical Resource
exports.deleteLogicalResource = async (req, res) => {
  try {
    const deleted = await LogicalResource.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Resource not found' });

    auditLog('DELETE', 'LogicalResource', deleted._id, req.user?.username || 'unknown');

    const eventPayload = JSON.stringify({
      event: 'LogicalResourceDeleted',
      data: deleted,
      timestamp: new Date().toISOString(),
    });

    kafkaProducer.send([{ topic: 'logical-resource-events', messages: eventPayload }], err => {
      if (err) applog('error', new Date().toISOString(), 'Kafka publish failed: ' + err.message);
      else applog('info', new Date().toISOString(), 'Kafka event published: LogicalResourceDeleted');
    });

    applog('info', new Date().toISOString(), `Resource deleted: ${deleted._id}`);
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    applog('error', new Date().toISOString(), 'Delete logical resource failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};