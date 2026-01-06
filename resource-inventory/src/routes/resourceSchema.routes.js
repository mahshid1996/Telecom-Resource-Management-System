const express = require('express');
const router = express.Router();
const controller = require('../controllers/resourceSchema.controller');
const authenticateToken = require('../middleware/auth.middleware');

//All routes below are protected by JWT authentication
router.post('/',authenticateToken, controller.createResourceSchema);
router.get('/',authenticateToken, controller.getResourceSchemas);
router.get('/:id',authenticateToken, controller.getResourceSchemaById);
router.patch('/:id',authenticateToken, controller.updateResourceSchema);
router.delete('/:id',authenticateToken, controller.deleteResourceSchema);

module.exports = router;
