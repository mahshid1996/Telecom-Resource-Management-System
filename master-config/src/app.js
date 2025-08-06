const express = require('express');
const { swaggerUi, specs } = require('./swagger');
const MasterConfig = require('./model');
const { masterConfigSchema } = require('./validation.js');
const app = express();
app.use(express.json());

/**
 * @swagger
 * /master-config:
 *   get:
 *     summary: Get all configs
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Filter by code
 *     responses:
 *       200:
 *         description: List of configs
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
 *         description: Created
 */

app.get('/master-config', async (req, res) => {
  try {
    const filter = req.query.code ? { code: req.query.code } : {};
    const result = await MasterConfig.find(filter);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


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
 *     summary: Get config by id
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
 *   delete:
 *     summary: Delete config by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Deleted
 */

app.get('/master-config/:id', async (req, res) => {
  try {
    const config = await MasterConfig.findById(req.params.id);
    if (!config) return res.status(404).json({ error: 'Not found' });
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/master-config/:id', async (req, res) => {
  try {
    const result = await MasterConfig.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

module.exports = app;