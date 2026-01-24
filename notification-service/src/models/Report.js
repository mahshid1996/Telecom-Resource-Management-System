const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  notificationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification' },
  subject: String, 
  totalEmails: Number,
  successCount: Number,
  failureCount: Number,
  emails: [
    {
      email: String,
      status: String
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Report', reportSchema);
