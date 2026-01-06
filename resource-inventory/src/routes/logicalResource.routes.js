const express = require('express');
const router = express.Router();
const controller = require('../controllers/logicalResource.controller');
const authenticateToken = require('../middleware/auth.middleware');

//All routes below are protected by JWT authentication
router.post('/', authenticateToken, controller.createLogicalResource);
router.get('/', authenticateToken, controller.getLogicalResources);
router.get('/:id', authenticateToken, controller.getLogicalResourceById);
router.patch('/:id', authenticateToken, controller.updateLogicalResource);
router.delete('/:id', authenticateToken, controller.deleteLogicalResource);

module.exports = router;
