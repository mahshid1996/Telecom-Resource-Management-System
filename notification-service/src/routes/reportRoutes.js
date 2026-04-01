const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const Report = require('../models/Report');
const logger = require('../utils/logger');

// GET all reports (for UI list)
router.get('/', async (req, res) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 });
    res.status(200).json(reports);
  } catch (err) {
    logger.error(`Error fetching reports: ${err.message}`);
    res.status(500).json({ message: 'Error fetching reports' });
  }
});

// GET report as CSV by ID
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let report = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      report = await Report.findById(id);
      if (!report) {
        report = await Report.findOne({ notificationId: new mongoose.Types.ObjectId(id) });
      }
    }

    if (!report) {
      logger.warn(`No report found for ID: ${id}`);
      return res.status(404).json({ message: 'Report not found' });
    }

    const rows = report.emails.map(e => ({
      notificationId: report.notificationId,
      email: e.email,
      status: e.status,
      subject: report.subject || ''
    }));

    const parser = new Parser({ fields: ['notificationId', 'email', 'status', 'subject'] });
    const csv = parser.parse(rows);

    res.setHeader('Content-Disposition', `attachment; filename=report_${report._id}.csv`);
    res.setHeader('Content-Type', 'text/csv');

    logger.info(`Report generated successfully for ID: ${id}`);

    res.status(200).send(csv);

  } catch (err) {
    logger.error(`Error generating report: ${err.message}`);
    res.status(500).json({ message: 'Error generating report' });
  }
});

module.exports = router;