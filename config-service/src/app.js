const express = require('express');
const { swaggerUi, specs } = require('./swagger');
const MasterConfig = require('./models/masterConfigRoutes'); // اصلاح مدل
const { masterConfigSchema } = require('./validation.js');
const cors = require("cors");

const app = express();

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:5174"] }));
app.use(express.json());

/**
 * @swagger
 * /master-config:
 *   get:
 *     summary: Get all configs (filterable)
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
app.get('/master-config', async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.name) filter.name = { $regex: req.query.name, $options: 'i' };
    if (req.query.code) filter.code = req.query.code;

    const results = await MasterConfig.find(filter);
    res.status(200).json(results);
  } catch (err) {
    console.error('Error in GET /master-config:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /master-config:
 *   post:
 *     summary: Create a new config
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created successfully
 */
app.post('/master-config', async (req, res) => {
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

/**
 * @swagger
 * /master-config/{id}:
 *   get:
 *     summary: Get config by ID
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
app.get('/master-config/:id', async (req, res) => {
  try {
    const result = await MasterConfig.findById(req.params.id);
    if (!result)
      return res.status(404).json({ error: 'No record found with this ID' });

    res.status(200).json(result);
  } catch (err) {
    console.error('Error in GET /master-config/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /master-config/{id}:
 *   delete:
 *     summary: Delete config by ID
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
app.delete('/master-config/:id', async (req, res) => {
  try {
    const result = await MasterConfig.findByIdAndDelete(req.params.id);
    if (!result)
      return res.status(404).json({ error: 'Not found' });

    res.status(204).send();
  } catch (err) {
    console.error('Error in DELETE /master-config/:id:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * @swagger
 * /master-config/{id}:
 *   patch:
 *     summary: Partially update a config
 */
app.patch('/master-config/:id', async (req, res) => {
  try {
    const updated = await MasterConfig.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.status(200).json(updated);
  } catch (err) {
    console.error('Error in PATCH /master-config:', err);
    res.status(400).json({ error: err.message });
  }
});

// 📘 Swagger docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = app;
