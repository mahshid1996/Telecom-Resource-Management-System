const mongoose = require('mongoose'); 
const resourceSchemaSchema = new mongoose.Schema({
  version: { type: Number, default: 1 },
  href: String,
  name: String,
  description: String,
  code: String,
  resourceSchema: {
    type: Object,
    required: true,
  },
}, { timestamps: true });

resourceSchemaSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

resourceSchemaSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (doc, ret) => { delete ret._id; }
});

module.exports = mongoose.model('ResourceSchema', resourceSchemaSchema);
