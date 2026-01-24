const express = require('express');
const router = express.Router();
const { createNotification } = require('../controllers/notificationsController');

router.post('/', createNotification);

module.exports = router;
