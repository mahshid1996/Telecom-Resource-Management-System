const express = require('express');
const router = express.Router();
const MasterConfig = require('../models/masterConfigRoutes.js');
const { masterConfigSchema } = require('../validation');
const logger = require('../utils/logger');

// GET all or filtered
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name) filter.name = { $regex: req.query.name, $options: 'i' };
    if (req.query.code) filter.code = req.query.code;

    const results = await MasterConfig.find(filter);
    logger.info(`GET /master-config → ${results.length} records`);
    res.json(results);
  } catch (err) {
    logger.error(`GET /master-config failed: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
});

// GET by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await MasterConfig.findById(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST
router.post('/', async (req, res) => {
  const { error } = masterConfigSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const config = new MasterConfig(req.body);
    const saved = await config.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH
router.patch('/:id', async (req, res) => {
  try {
    const updated = await MasterConfig.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await MasterConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
