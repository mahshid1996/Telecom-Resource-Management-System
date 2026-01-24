const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Parser } = require('json2csv');
const Report = require('../models/Report');

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
      console.log(`No report found for ID: ${id}`);
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
    console.log(`Report generated successfully for ID: ${id}`);
    res.status(200).send(csv);

  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ message: 'Error generating report' });
  }
});

module.exports = router;
