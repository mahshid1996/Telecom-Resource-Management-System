
/* eslint quotes: 0 */
// Defines Mongoose model for service `masterConfig`. (Can be re-generated.)
const merge = require('lodash.merge')
// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose')
// !code: imports // !end
// !code: init // !end

let moduleExports = merge({},
  // !<DEFAULT> code: model
  {
    href: String,
    name: String,
    description: String,
    status: {
      type: String,
      enum: [
        "Active",
        "InActive"
      ]
    },
    code: String,
    type: String,
    baseType: String,
    batchStart: String,
    currentBatch: String,
    relatedParty: [
      {
        role: String,
        name: String,
        email: String,
        phone: String
      }
    ],
    configCharacteristics: [
      {
        name: String,
        code: String,
        valueType: String,
        configCharacteristicsValues: [
          {}
        ]
      }
    ]
  },
  // !end
  // !code: moduleExports // !end
)

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
