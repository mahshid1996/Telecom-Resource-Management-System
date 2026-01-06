const mongoose = require('mongoose');

const relatedPartySchema = new mongoose.Schema({
  role: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { _id: false });

// این قسمت برای مقادیر داخل configCharacteristics
const configCharacteristicValueSchema = new mongoose.Schema({
  valueType: { type: String, required: true },
  // هر چی داخل value باشه (array, object, string) میاد
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });

// خود configCharacteristic
const configCharacteristicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  valueType: { type: String, required: true },
  configCharacteristicsValues: [configCharacteristicValueSchema]
}, { _id: false });

// attachment placeholder
const attachmentSchema = new mongoose.Schema({}, { _id: false, strict: false });

const masterConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true }, // الان کاملاً آزاد
  baseType: { type: String, required: true }, 
  status: { type: String, enum: ['Active', 'InActive'], required: true },
  code: { type: String, required: true },
  configCharacteristics: [configCharacteristicSchema],
  relatedParty: [relatedPartySchema],
  attachment: [attachmentSchema],
  version: { type: Number, default: 0 },
  createdAt: Date,
  updatedAt: Date,
  batchStart: String,
  currentBatch: String,
  href: String
}, { timestamps: true });

const MasterConfig = mongoose.model('MasterConfig', masterConfigSchema, 'masterconfig');

module.exports = MasterConfig;
