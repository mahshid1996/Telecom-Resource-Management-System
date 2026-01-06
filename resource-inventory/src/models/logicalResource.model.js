const mongoose = require('mongoose'); 

const noteSchema = new mongoose.Schema({
  authorRole: String,
  author: String,
  date: { type: Date },
  text: String,
}, { _id: false });

const relatedPartySchema = new mongoose.Schema({
  name: String,
  role: String,
  type: String,
  baseType: String,
}, { _id: false });

const resourceCharacteristicSchema = new mongoose.Schema({
  code: String,
  name: String,
  publicIdentifier: { type: Boolean, default: true },
  value: String,
  valueType: String,
}, { _id: false });

const resourceRelationshipSchema = new mongoose.Schema({
  relationshipType: {
    type: String,
    enum: ['reliesOn', 'bundle', 'dependency', 'starterPack', 'capacity', 'pool', ''],
  },
  validFor: {
    startDateTime: Date,
    endDateTime: Date,
  },
  resource: {
    type: new mongoose.Schema({
      id: String,
      type: String,
      baseType: String,
    }, { _id: false }),
    required: true,
  },
}, { _id: false });

const bundledResourcesSchema = new mongoose.Schema({
  id: String,
  href: String,
  type: String,
  baseType: String,
  schemaLocation: String,
}, { _id: false });

const costSchema = new mongoose.Schema({
  taxFreeValue: Number,
  taxedValue: Number,
  unit: String,
}, { _id: false });

//Main Schema
const logicalResourceSchema = new mongoose.Schema({
  //id will be generated from MongoDB _id
  description: String,
  name: String,
  type: String,
  baseType: { type: String, default: 'LogicalResource' },
  isBundle: { type: Boolean, default: false },
  value: String, 
  startOperatingDate: Date,
  endOperatingDate: Date,
  resourceRecycleDate: Date,
  resourceStatus: {
    type: String,
    enum: ['Created', 'Available', 'Reserved', 'InUse', 'Retired', 'Disabled'],
  },
  businessType: [String],
  category: [String],
  cost: costSchema,
  note: [noteSchema],
  relatedParty: [relatedPartySchema],
  resourceCharacteristic: [resourceCharacteristicSchema],
  resourceRelationship: [resourceRelationshipSchema],
  bundledResources: [bundledResourcesSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

//virtual field to return _id as id in response
logicalResourceSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

//Clean JSON output
logicalResourceSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) { delete ret._id; }
});

//Export Model
module.exports = mongoose.model('LogicalResource', logicalResourceSchema);
