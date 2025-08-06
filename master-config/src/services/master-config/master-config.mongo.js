
/* eslint quotes: 0 */
// Defines the MongoDB $jsonSchema for service `masterConfig`. (Can be re-generated.)
const merge = require('lodash.merge')
// !code: imports // !end
// !code: init // !end

let moduleExports = merge({},
  // !<DEFAULT> code: model
  {
    bsonType: "object",
    additionalProperties: false,
    properties: {
      _id: {
        bsonType: "objectId"
      },
      href: {
        bsonType: "string"
      },
      name: {
        bsonType: "string"
      },
      description: {
        bsonType: "string"
      },
      status: {
        enum: [
          "Active",
          "InActive"
        ],
        bsonType: "string"
      },
      code: {
        bsonType: "string"
      },
      type: {
        bsonType: "string"
      },
      baseType: {
        bsonType: "string"
      },
      batchStart: {
        bsonType: "string"
      },
      currentBatch: {
        bsonType: "string"
      },
      relatedParty: {
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
        },
        bsonType: "array"
      },
      configCharacteristics: {
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
        },
        bsonType: "array"
      }
    }
  },
  // !end
  // !code: moduleExports // !end
)

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
