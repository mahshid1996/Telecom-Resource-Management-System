
/* eslint quotes: 0 */
// Validation definitions for validateSchema hook for service `masterConfig`. (Can be re-generated.)
const { validateSchema } = require('feathers-hooks-common')
const merge = require('lodash.merge')
const ajv = require('ajv')
// !code: imports // !end
// !code: init // !end

// !<DEFAULT> code: set_id_type
// eslint-disable-next-line no-unused-vars
const ID = 'string'
// !end

let base = merge({},
  // !<DEFAULT> code: base
  {
    title: "MasterConfig",
    description: "MasterConfig database.",
    required: [],
    uniqueItemProperties: [],
    properties: {
      id: {
        type: "string"
      },
      href: {
        type: "string"
      },
      name: {
        type: "string"
      },
      description: {
        type: "string"
      },
      status: {
        type: "string",
        enum: [
          "Active",
          "InActive"
        ]
      },
      code: {
        type: "string"
      },
      type: {
        type: "string"
      },
      baseType: {
        type: "string"
      },
      batchStart: {
        type: "string"
      },
      currentBatch: {
        type: "string"
      },
      relatedParty: {
        type: "array",
        items: {
          type: "object",
          properties: {
            role: {
              type: "string"
            },
            name: {
              type: "string"
            },
            email: {
              type: "string"
            },
            phone: {
              type: "string"
            }
          }
        }
      },
      configCharacteristics: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string"
            },
            code: {
              type: "string"
            },
            valueType: {
              type: "string"
            },
            configCharacteristicsValues: {
              type: "array",
              items: {
                type: "object",
                properties: {}
              }
            }
          }
        }
      }
    }
  },
  // !end
  // !code: base_more // !end
)
// !code: base_change // !end

let create = merge({},
  base,
  // !code: create_more // !end
)

let update = merge({},
  base,
  // !code: update_more // !end
)

let patch = merge({},
  base,
  // !code: patch_more // !end
)
delete patch.required
// !code: all_change // !end

let validateCreate = options => {
  // !<DEFAULT> code: func_create
  return validateSchema(create, ajv, options)
  // !end
}

let validateUpdate = options => {
  // !<DEFAULT> code: func_update
  return validateSchema(update, ajv, options)
  // !end
}

let validatePatch = options => {
  // !<DEFAULT> code: func_patch
  return validateSchema(patch, ajv, options)
  // !end
}

let quickValidate = (method, data, options) => {
  try {
    if (method === 'create') { validateCreate(options)({ type: 'before', method: 'create', data }) }
    if (method === 'update') { validateCreate(options)({ type: 'before', method: 'update', data }) }
    if (method === 'patch') { validateCreate(options)({ type: 'before', method: 'patch', data }) }
  } catch (err) {
    return err
  }
}
// !code: validate_change // !end

let moduleExports = {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch,
  quickValidate,
  // !code: moduleExports // !end
}

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
