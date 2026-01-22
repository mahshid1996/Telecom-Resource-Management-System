//Imports Mongoose library for MongoDB object modeling
const mongoose = require('mongoose');

//Defines a schema for related parties
const relatedPartySchema = new mongoose.Schema({
  role: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' }
}, { _id: false }); //means Mongoose won’t automatically create an _id field for this subdocument

//This section is for the values inside configCharacteristics
const configCharacteristicValueSchema = new mongoose.Schema({
  valueType: { type: String, required: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true }
}, { _id: false });


const configCharacteristicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  valueType: { type: String, required: true },
  configCharacteristicsValues: [configCharacteristicValueSchema]
}, { _id: false });

//Attachment placeholder
const attachmentSchema = new mongoose.Schema({}, { _id: false, strict: false });

//Main schema masterConfigSchema for storing master configuration documents
const masterConfigSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true }, 
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
