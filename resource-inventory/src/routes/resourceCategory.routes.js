const express = require('express');
const router = express.Router();
const controller = require('../controllers/resourceCategory.controller');
const authenticateToken = require('../middleware/auth.middleware');

//All routes below are protected by JWT authentication
router.post('/',authenticateToken, controller.createResourceCategory);
router.get('/',authenticateToken, controller.getResourceCategories);
router.get('/:id',authenticateToken, controller.getResourceCategoryById);
router.patch('/:id',authenticateToken, controller.updateResourceCategory);
router.delete('/:id',authenticateToken, controller.deleteResourceCategory);

module.exports = router;
