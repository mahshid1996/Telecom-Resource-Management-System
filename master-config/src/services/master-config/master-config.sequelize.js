
/* eslint quotes: 0 */
// Defines Sequelize model for service `masterConfig`. (Can be re-generated.)
const merge = require('lodash.merge')
const Sequelize = require('sequelize')
// eslint-disable-next-line no-unused-vars
const DataTypes = Sequelize.DataTypes
// !code: imports // !end
// !code: init // !end

let moduleExports = merge({},
  // !<DEFAULT> code: sequelize_model
  {
    id: {
      type: DataTypes.TEXT,
      autoIncrement: true,
      primaryKey: true
    },
    href: {
      type: DataTypes.TEXT
    },
    name: {
      type: DataTypes.TEXT
    },
    description: {
      type: DataTypes.TEXT
    },
    status: {
      type: Sequelize.ENUM(["Active","InActive"])
    },
    code: {
      type: DataTypes.TEXT
    },
    type: {
      type: DataTypes.TEXT
    },
    baseType: {
      type: DataTypes.TEXT
    },
    batchStart: {
      type: DataTypes.TEXT
    },
    currentBatch: {
      type: DataTypes.TEXT
    },
    relatedParty: {
      type: DataTypes.JSONB
    },
    configCharacteristics: {
      type: DataTypes.JSONB
    }
  },
  // !end
  // !code: moduleExports // !end
)

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
