const Joi = require('joi');

// Schema for each value inside configCharacteristics
const configCharacteristicValueSchema = Joi.object({
  valueType: Joi.string().required(),
  value: Joi.any().required()
});

// Schema for configCharacteristics
const configCharacteristicSchema = Joi.object({
  name: Joi.string().required(),
  code: Joi.string().required(),  
  valueType: Joi.string().required(),
  configCharacteristicsValues: Joi.array()
    .items(configCharacteristicValueSchema)
    .required()
});

// Main master config schema 
const masterConfigSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  status: Joi.string().valid('Active', 'InActive').required(),
  type: Joi.string().required(),
  baseType: Joi.string().required(),
  configCharacteristics: Joi.array()
    .items(configCharacteristicSchema)
    .required(),
  relatedParty: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      email: Joi.string().allow(''),
      phone: Joi.string().allow('')
    })
  ),
  attachment: Joi.array().items(Joi.object().unknown(true))
});

module.exports = { masterConfigSchema };