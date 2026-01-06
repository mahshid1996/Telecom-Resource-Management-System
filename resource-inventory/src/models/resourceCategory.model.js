const mongoose = require('mongoose');

const validForSchema = new mongoose.Schema({
  startDateTime: Date,
  endDateTime: Date,
}, { _id: false });

const relatedPartySchema = new mongoose.Schema({
  id: String,
  href: String,
  role: String,
  name: String,
}, { _id: false });

const resourceCategorySchema = new mongoose.Schema({
  href: String,
  name: String,
  description: String,
  code: String,
  schemaLocation: String,
  type: String,
  baseType: String,
  categorySchema: String,
  validFor: validForSchema,
  realizingResourceType: {
    type: String,
    enum: ['logicalResource', 'physicalResource','nonSerializedResource'],
  },
  lastUpdate: Date,
  isBundle: { type: Boolean, default: false },
  category: [String],
  relatedParty: [relatedPartySchema],
}, { timestamps: true });

resourceCategorySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

resourceCategorySchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { delete ret._id; }
});

module.exports = mongoose.model('ResourceCategory', resourceCategorySchema);
