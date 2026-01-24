const mongoose = require('mongoose');

const reportDetailSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification', required: true },
  subject: { type: String, required: true },
  emails: [
    {
      email: { type: String, required: true },
      status: { type: String, required: true } 
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ReportDetail', reportDetailSchema);
