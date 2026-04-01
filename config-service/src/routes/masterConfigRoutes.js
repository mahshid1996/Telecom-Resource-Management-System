const express = require('express');
const router = express.Router();
const controller = require('../controllers/masterConfigController');
const { masterConfigSchema } = require('../middleware/validation');

// Validation middleware
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: error.details[0].message
    });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: MasterConfig
 *   description: Master Configuration management
 */

/**
 * @swagger
 * /master-config:
 *   get:
 *     summary: Get all configs (filterable)
 *     tags: [MasterConfig]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by name (partial match)
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Filter by code
 *     responses:
 *       200:
 *         description: List of filtered configs
 */
router.get('/', controller.getAllConfigs);

/**
 * @swagger
 * /master-config/{id}:
 *   get:
 *     summary: Get config by ID
 *     tags: [MasterConfig]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Config found
 *       404:
 *         description: Not found
 */
router.get('/:id', controller.getConfigById);

/**
 * @swagger
 * /master-config:
 *   post:
 *     summary: Create a new config
 *     tags: [MasterConfig]
 *     requestBody:
 *       required: true
 *     responses:
 *       201:
 *         description: Created successfully
 */
router.post('/', validate(masterConfigSchema), controller.createConfig);

/**
 * @swagger
 * /master-config/{id}:
 *   patch:
 *     summary: Partially update a config
 *     tags: [MasterConfig]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated successfully
 */
router.patch('/:id', controller.updateConfig);

/**
 * @swagger
 * /master-config/{id}:
 *   delete:
 *     summary: Delete config by ID
 *     tags: [MasterConfig]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted successfully
 */
router.delete('/:id', controller.deleteConfig);

module.exports = router;

