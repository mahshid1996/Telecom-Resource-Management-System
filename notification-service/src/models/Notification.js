const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  configCode: { type: String, required: true }, 
  emailLists: [{ type: String, required: true }],
  body: { type: String, required: true },
  subject: { type: String, required: false },
  emailStatuses: [
    {
      email: String,
      status: String
    }
  ],
  status: { type: String, default: 'queued' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
