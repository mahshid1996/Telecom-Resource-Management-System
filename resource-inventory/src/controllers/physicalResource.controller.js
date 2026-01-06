/**
 * @file physicalResource.controller.js
 * @description Handles business logic for managing physical resources.
 * 
 * Responsibilities:
 * - Receive requests from routes
 * - Validate input data
 * - Interact with MongoDB via model
 * - Send Kafka events after successful operations
 * - Record actions in audit logs
 * - Return structured responses
 */

const PhysicalResource = require('../models/physicalResource.model');
const { kafkaProducer } = require('../config');
const { auditLog } = require('../services/audit.service');
const { applog } = require('../services/logger.service');

/**
 * @swagger
 * tags:
 *   name: PhysicalResource
 *   description: Physical resource management
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     PhysicalResource:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "64f2a9c8b2f1a123456789ab"
 *         name:
 *           type: string
 *           example: "Physical Server 1"
 *         value:
 *           type: string
 *           example: "Server-001"
 *         type:
 *           type: string
 *           example: "Server"
 *         description:
 *           type: string
 *           example: "Dell PowerEdge R740"
 *         isBundle:
 *           type: boolean
 *           example: false
 *         category:
 *           type: array
 *           items:
 *             type: string
 *             example: "Rack Server"
 *         relatedParty:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               href:
 *                 type: string
 *               role:
 *                 type: string
 *               name:
 *                 type: string
 *         validFor:
 *           type: object
 *           properties:
 *             startDateTime:
 *               type: string
 *               format: date-time
 *             endDateTime:
 *               type: string
 *               format: date-time
 *         lastUpdate:
 *           type: string
 *           format: date-time
 *         realizingResourceType:
 *           type: string
 *           enum: ["logicalResource", "physicalResource", "nonSerializedResource"]
 *         baseType:
 *           type: string
 *           example: "PhysicalResource"
 *
 * security:
 *   - bearerAuth: []
 */

/**
 * @swagger
 * /api/physical-resources:
 *   post:
 *     summary: Create a new physical resource
 *     tags: [PhysicalResource]
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
 * /api/physical-resources:
 *   get:
 *     summary: Get all physical resources
 *     tags: [PhysicalResource]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of physical resources
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/physical-resources/{id}:
 *   get:
 *     summary: Get a physical resource by ID
 *     tags: [PhysicalResource]
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
 * /api/physical-resources/{id}:
 *   patch:
 *     summary: Update an existing physical resource
 *     tags: [PhysicalResource]
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
 * /api/physical-resources/{id}:
 *   delete:
 *     summary: Delete a physical resource
 *     tags: [PhysicalResource]
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


exports.createPhysicalResource = async (req, res) => {
  try {
    const { value, type, description } = req.body;

    //Validate required fields
    if (!value || !type) {
      return res.status(400).json({ error: 'Value and type are required' });
    }

    //Build the resource document using request body
    const resource = new PhysicalResource({
      description,
      name : req.body.name,
      type,
      isBundle: typeof req.body.isBundle === 'boolean' ? req.body.isBundle : false,
      businessType: Array.isArray(req.body.businessType) ? req.body.businessType : [],
      category: Array.isArray(req.body.category) ? req.body.category : [req.body.category],
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
      resourceCharacteristic: Array.isArray(req.body.resourceCharacteristic) ? req.body.resourceCharacteristic : [],
      resourceRelationship: Array.isArray(req.body.resourceRelationship) ? req.body.resourceRelationship : [],
      bundledResources: Array.isArray(req.body.bundledResources) ? req.body.bundledResources : [],
    });

    //Save to MongoDB
    const saved = await resource.save();
    saved.id = saved._id.toString();
    await saved.save();

    auditLog('CREATE', 'PhysicalResource', saved._id, req.user?.username || 'unknown');
    // Send Kafka event
    const eventPayload = JSON.stringify({
      event: 'PhysicalResourceCreated',
      data: saved,
      timestamp: new Date().toISOString(),
    });

    applog('info', new Date().toISOString(), 'Sending Kafka event:'+ eventPayload);
    kafkaProducer.send(
      [{ topic: 'physical-resource-events', messages: eventPayload }],
      (err, data) => {
        if (err) {
          applog('error', new Date().toISOString(), 'Kafka publish failed: ' + err.message);
        } else {
          applog('info', new Date().toISOString(), 'Kafka event published successfully');
          applog('info', new Date().toISOString(), 'Kafka publish result:'+ data);
        }
      }
    );

    applog('info', new Date().toISOString(), `Physical resource created: ${saved._id}`);
    res.status(201).json(saved);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Create physical resource failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

//Get all Physical Resources
exports.getPhysicalResources = async (req, res) => {
  try {
    const resources = await PhysicalResource.find();
    applog('info', new Date().toISOString(), `Fetched ${resources.length} physical resources`);
    res.json(resources);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Fetch physical resources failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

//Get a Physical Resource by ID
exports.getPhysicalResourceById = async (req, res) => {
  try {
    const resource = await PhysicalResource.findById(req.params.id);
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    applog('info', new Date().toISOString(), `Fetched physical resource: ${resource._id}`);
    res.json(resource);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Fetch by ID failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

//Update a Physical Resource
exports.updatePhysicalResource = async (req, res) => {
  try {
    const updated = await PhysicalResource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: 'Resource not found' });

    auditLog('UPDATE', 'PhysicalResource', updated._id, req.user?.username || 'unknown');

    const eventPayload = JSON.stringify({
      event: 'PhysicalResourceUpdated',
      data: updated,
      timestamp: new Date().toISOString(),
    });

    kafkaProducer.send(
      [{ topic: 'physical-resource-events', messages: eventPayload }],
      (err) => {
        if (err)
          applog('error', new Date().toISOString(), 'Kafka publish failed: ' + err.message);
        else applog('info', new Date().toISOString(), 'Kafka event published: PhysicalResourceUpdated');
      }
    );

    applog('info', new Date().toISOString(), `Physical resource updated: ${updated._id}`);
    res.json(updated);
  } catch (err) {
    applog('error', new Date().toISOString(), 'Update physical resource failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};

//Delete a Physical Resource
exports.deletePhysicalResource = async (req, res) => {
  try {
    const deleted = await PhysicalResource.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Resource not found' });

    auditLog('DELETE', 'PhysicalResource', deleted._id, req.user?.username || 'unknown');

    const eventPayload = JSON.stringify({
      event: 'PhysicalResourceDeleted',
      data: deleted,
      timestamp: new Date().toISOString(),
    });

    kafkaProducer.send(
      [{ topic: 'physical-resource-events', messages: eventPayload }],
      (err) => {
        if (err)
          applog('error', new Date().toISOString(), 'Kafka publish failed: ' + err.message);
        else applog('info', new Date().toISOString(), 'Kafka event published: PhysicalResourceDeleted');
      }
    );

    applog('info', new Date().toISOString(), `Physical resource deleted: ${deleted._id}`);
    res.json({ message: 'Physical resource deleted successfully' });
  } catch (err) {
    applog('error', new Date().toISOString(), 'Delete physical resource failed: ' + err.message);
    res.status(500).json({ error: err.message });
  }
};
