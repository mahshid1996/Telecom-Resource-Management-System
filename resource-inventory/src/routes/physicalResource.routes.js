const express = require('express');
const router = express.Router();
const controller = require('../controllers/physicalResource.controller');
const authenticateToken = require('../middleware/auth.middleware');

//All routes below are protected by JWT authentication
router.post('/', authenticateToken, controller.createPhysicalResource);
router.get('/', authenticateToken, controller.getPhysicalResources);
router.get('/:id', authenticateToken, controller.getPhysicalResourceById);
router.patch('/:id', authenticateToken, controller.updatePhysicalResource);
router.delete('/:id', authenticateToken, controller.deletePhysicalResource);

module.exports = router;

