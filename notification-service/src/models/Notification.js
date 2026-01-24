const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  emailLists: [{ type: String, required: true }], 
  body: { type: String, required: true },
  subject: { type: String, required: false },
  emailStatuses: [ 
    {
      email: String,
      status: String // success | failure
    }
  ],
  status: { type: String, default: 'queued' }, 
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
