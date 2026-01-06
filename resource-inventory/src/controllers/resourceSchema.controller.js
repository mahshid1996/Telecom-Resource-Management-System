const ResourceSchema = require('../models/resourceSchema.model');
const { applog } = require('../services/logger.service.js');
const { auditLog } = require('../services/audit.service');

const getTime = () => new Date().toISOString();


/**
 * @swagger
 * tags:
 *   name: ResourceSchema
 *   description: Resource schema management
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 * security:
 *   - bearerAuth: []
 */

/**
 * @swagger
 * /api/resource-schemas:
 *   post:
 *     summary: Create a new resource schema
 *     tags: [ResourceSchema]
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
 *               description:
 *                 type: string
 *               version:
 *                 type: integer
 *               resourceSchema:
 *                 type: object
 *                 description: JSON schema of the resource
 *             required:
 *               - name
 *               - resourceSchema
 *     responses:
 *       201:
 *         description: ResourceSchema created successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-schemas:
 *   get:
 *     summary: Get all resource schemas
 *     tags: [ResourceSchema]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resource schemas
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-schemas/{id}:
 *   get:
 *     summary: Get a resource schema by ID
 *     tags: [ResourceSchema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The schema ID
 *     responses:
 *       200:
 *         description: ResourceSchema fetched successfully
 *       404:
 *         description: ResourceSchema not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-schemas/{id}:
 *   patch:
 *     summary: Update an existing resource schema
 *     tags: [ResourceSchema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The schema ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: ResourceSchema updated successfully
 *       404:
 *         description: ResourceSchema not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-schemas/{id}:
 *   delete:
 *     summary: Delete a resource schema
 *     tags: [ResourceSchema]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The schema ID
 *     responses:
 *       200:
 *         description: ResourceSchema deleted successfully
 *       404:
 *         description: ResourceSchema not found
 *       500:
 *         description: Internal server error
 */

const createResourceSchema = async (req, res) => {
  try {
    const schema = new ResourceSchema(req.body);
    await schema.save();

    auditLog('CREATE', 'ResourceSchema', schema.id, req.user || 'system');
    applog('info', getTime(), `Created ResourceSchema ${schema.id}`);

    res.status(201).json(schema);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

const getResourceSchemas = async (req, res) => {
  try {
    const schemas = await ResourceSchema.find().exec();
    res.json(schemas);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

const getResourceSchemaById = async (req, res) => {
  try {
    const schema = await ResourceSchema.findById(req.params.id);
    if (!schema) return res.status(404).json({ error: 'Not found' });
    res.json(schema);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

const updateResourceSchema = async (req, res) => {
  try {
    const schema = await ResourceSchema.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!schema) return res.status(404).json({ error: 'Not found' });

    auditLog('UPDATE', 'ResourceSchema', schema.id, req.user || 'system');
    applog('info', getTime(), `Updated ResourceSchema ${schema.id}`);

    res.json(schema);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

const deleteResourceSchema = async (req, res) => {
  try {
    const schema = await ResourceSchema.findByIdAndDelete(req.params.id);
    if (!schema) return res.status(404).json({ error: 'Not found' });

    auditLog('DELETE', 'ResourceSchema', schema.id, req.user || 'system');
    applog('info', getTime(), `Deleted ResourceSchema ${schema.id}`);

    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createResourceSchema,
  getResourceSchemas,
  getResourceSchemaById,
  updateResourceSchema,
  deleteResourceSchema,
};
