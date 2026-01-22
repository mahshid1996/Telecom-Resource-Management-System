const Joi = require('joi');
// Description Schema for individual characteristic values
const configCharacteristicValueSchema = Joi.object().unknown(true);

const configCharacteristicSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),
  valueType: Joi.string().required(),
  configCharacteristicsValues: Joi.array().items(configCharacteristicValueSchema).required()
});

// Schema for master configuration and related entities
const masterConfigSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string().valid('Active', 'InActive').required(),
  code: Joi.string().required(),
  type: Joi.string().required(),
  baseType: Joi.string().required(),
  configCharacteristics: Joi.array().items(configCharacteristicSchema).required(),
  relatedParty: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().allow(''),
      phone: Joi.string().allow('')
    })
  ),
  attachment: Joi.array().items(Joi.object().unknown(true)),
  version: Joi.number().optional()
});

module.exports = { masterConfigSchema };