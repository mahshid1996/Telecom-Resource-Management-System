const ResourceCategory = require('../models/resourceCategory.model');
const { applog } = require('../services/logger.service.js');
const { auditLog } = require('../services/audit.service');

const getTime = () => new Date().toISOString();

/**
 * @swagger
 * tags:
 *   name: ResourceCategory
 *   description: Resource category management
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
 * /api/resource-categories:
 *   post:
 *     summary: Create a new resource category
 *     tags: [ResourceCategory]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               href:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               code:
 *                 type: string
 *               schemaLocation:
 *                 type: string
 *               type:
 *                 type: string
 *               baseType:
 *                 type: string
 *               categorySchema:
 *                 type: string
 *               validFor:
 *                 type: object
 *                 properties:
 *                   startDateTime:
 *                     type: string
 *                   endDateTime:
 *                     type: string
 *               realizingResourceType:
 *                 type: string
 *                 enum: [logicalResource, physicalResource, nonSerializedResource]
 *               lastUpdate:
 *                 type: string
 *               isBundle:
 *                 type: boolean
 *               category:
 *                 type: array
 *                 items:
 *                   type: string
 *               relatedParty:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     href:
 *                       type: string
 *                     role:
 *                       type: string
 *                     name:
 *                       type: string
 *     responses:
 *       201:
 *         description: ResourceCategory created successfully
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-categories:
 *   get:
 *     summary: Get all resource categories
 *     tags: [ResourceCategory]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resource categories
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-categories/{id}:
 *   get:
 *     summary: Get a resource category by ID
 *     tags: [ResourceCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       200:
 *         description: ResourceCategory fetched successfully
 *       404:
 *         description: ResourceCategory not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-categories/{id}:
 *   patch:
 *     summary: Update an existing resource category
 *     tags: [ResourceCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: ResourceCategory updated successfully
 *       404:
 *         description: ResourceCategory not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /api/resource-categories/{id}:
 *   delete:
 *     summary: Delete a resource category
 *     tags: [ResourceCategory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The category ID
 *     responses:
 *       200:
 *         description: ResourceCategory deleted successfully
 *       404:
 *         description: ResourceCategory not found
 *       500:
 *         description: Internal server error
 */

//Create a new ResourceCategory
const createResourceCategory = async (req, res) => {
  try {
    const category = new ResourceCategory(req.body);
    await category.save();

    auditLog('CREATE', 'ResourceCategory', category.id, req.user || 'system');
    applog('info', getTime(), `Created ResourceCategory ${category.id}`);
    res.status(201).json(category);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

//Get all ResourceCategories
const getResourceCategories = async (req, res) => {
  try {
    const categories = await ResourceCategory.find().exec();
    res.json(categories);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

//Get a single ResourceCategory by ID
const getResourceCategoryById = async (req, res) => {
  try {
    const category = await ResourceCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });
    res.json(category);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

//Update an existing ResourceCategory by ID
const updateResourceCategory = async (req, res) => {
  try {
    const category = await ResourceCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!category) return res.status(404).json({ error: 'Not found' });

    auditLog('UPDATE', 'ResourceCategory', category.id, req.user || 'system');
    applog('info', getTime(), `Updated ResourceCategory ${category.id}`);
    res.json(category);
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

//Delete a ResourceCategory by ID
const deleteResourceCategory = async (req, res) => {
  try {
    const category = await ResourceCategory.findByIdAndDelete(req.params.id);
    if (!category) return res.status(404).json({ error: 'Not found' });

    auditLog('DELETE', 'ResourceCategory', category.id, req.user || 'system');
    applog('info', getTime(), `Deleted ResourceCategory ${category.id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    applog('error', getTime(), err.message);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  createResourceCategory,
  getResourceCategories,
  getResourceCategoryById,
  updateResourceCategory,
  deleteResourceCategory,
};
