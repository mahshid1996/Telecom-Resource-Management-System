//Health check endpoint
const express = require('express');
const router = express.Router();
const { getHealth } = require('../controllers/health.controller');
const logger = require('../services/logger.service.js'); 

//This route responds with system status and current timestamp
router.get('/', (req, res) => {
  logger.applog('info', new Date().toISOString(), 'Health check endpoint called');
  getHealth(req, res);
});

module.exports = router;
