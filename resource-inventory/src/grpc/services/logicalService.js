const LogicalResource = require("../../models/logicalResource.model.js");
const { applog } = require('../../../src/services/logger.service.js');

module.exports = {
  // Create a new logical resource
  CreateLogicalResource: async (call, callback) => {
    try {
      const newResource = new LogicalResource(call.request);
      const saved = await newResource.save();
      callback(null, saved);
    } catch (err) {
      callback(err);
    }
  },
  // Patch/update a logical resource by id
  PatchLogicalResource: async (call, callback) => {
    try {
      const { id, logicalResource } = call.request;
       applog('info', new Date().toISOString(), "Patch ID:"+ JSON.stringify(id));
       applog('info', new Date().toISOString(), "Fields to update:"+ JSON.stringify(logicalResource));
      // Update only the fields provided in logicalResource
      const updated = await LogicalResource.findOneAndUpdate(
        { _id: id },      
        { $set: logicalResource },
        { new: true, upsert: false } 
      );
   applog('info', new Date().toISOString(), "Updated resource:"+ JSON.stringify(updated));
      if (!updated) {
        return callback({ code: 5, message: "Resource not found" });
      }

      callback(null, updated);
    } catch (err) {
      callback(err);
    }
  }
};
