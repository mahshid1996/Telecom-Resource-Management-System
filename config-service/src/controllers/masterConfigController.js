const MasterConfig = require('../models/masterConfig');
const logger = require('../utils/logger');

/**
 * MasterConfig Controller
 *
 * Handles business logic related to Master Configuration management.
 * This layer is responsible for:
 * - Filtering logic
 * - Database interaction
 * - Returning standardized HTTP responses
 *
 * It does not handle routing or request validation.
 */

// Retrieves all configurations with optional query filtering
exports.getAllConfigs = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name)
      filter.name = { $regex: req.query.name, $options: 'i' };
    if (req.query.code) filter.code = req.query.code;

    const results = await MasterConfig.find(filter);
    logger.info(`Fetched ${results.length} configs`);
    res.status(200).json(results);
  } catch (err) {
    next(err);
  }
};


exports.getConfigById = async (req, res, next) => {
  try {
    logger.info(`Fetching config by ID: ${req.params.id}`);
    const result = await MasterConfig.findById(req.params.id);
    if (!result) {
      logger.warn(`Config not found for ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Not found' });
    }
    res.status(200).json(result);
  } catch (err) {
    logger.error('Error fetching config by ID', { error: err.message });
    next(err);
  }
};

exports.createConfig = async (req, res, next) => {
  try {
    // Get last CF code
    const lastConfig = await MasterConfig
      .findOne({ code: /^CF\d+$/ })
      .sort({ createdAt: -1 });

    let nextNumber = 1;

    if (lastConfig && lastConfig.code) {
      const currentNumber = parseInt(lastConfig.code.replace("CF", ""), 10);
      nextNumber = currentNumber + 1;
    }

    const generatedCode = `CF${nextNumber}`;

    const config = new MasterConfig({
      ...req.body,
      code: generatedCode,
      version: 0
    });

    const saved = await config.save();

    logger.info(`Config created with code ${generatedCode}`);

    res.status(201).json(saved);
  } catch (err) {
    logger.error("Error creating config", { error: err.message });
    next(err);
  }
};

exports.updateConfig = async (req, res, next) => {
  try {
    const existing = await MasterConfig.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: 'Not found' });
    }

    const updated = await MasterConfig.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
        $inc: { version: 1 }
      },
      { new: true, runValidators: true }
    );

    logger.info(`Config updated. ID: ${req.params.id}, New version: ${updated.version}`);

    res.json(updated);
  } catch (err) {
    logger.error("Error updating config", { error: err.message });
    next(err);
  }
};

exports.deleteConfig = async (req, res, next) => {
  try {
    const deleted = await MasterConfig.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};