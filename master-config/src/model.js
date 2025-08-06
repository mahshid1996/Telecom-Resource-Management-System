const mongoose = require('mongoose');

const relatedPartySchema = new mongoose.Schema({
  role: String,
  name: String,
  email: String,
  phone: String
}, { _id: false });

const configCharacteristicValueSchema = new mongoose.Schema({}, { _id: false, strict: false });

const configCharacteristicSchema = new mongoose.Schema({
  name: String,
  code: String,
  valueType: String,
  configCharacteristicsValues: [configCharacteristicValueSchema]
}, { _id: false });

const attachmentSchema = new mongoose.Schema({}, { _id: false, strict: false });

const masterConfigSchema = new mongoose.Schema({
  href: String,
  name: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['Active', 'InActive'], required: true },
  code: { type: String, required: true },
  type: { type: String, required: true },
  baseType: { type: String, required: true },
  batchStart: String,
  currentBatch: String,
  relatedParty: [relatedPartySchema],
  attachment: [attachmentSchema],
  configCharacteristics: [configCharacteristicSchema],
  version: Number
}, { timestamps: true });

const MasterConfig = mongoose.model('MasterConfig', masterConfigSchema, 'masterconfig');

module.exports = MasterConfig;