const PhysicalResource = require("../../models/physicalResource.model.js");
const { applog } = require('../../../src/services/logger.service.js');

module.exports = {
  // Create a new physical resource
  CreatePhysicalResource: async (call, callback) => {
    try {
      const newResource = new PhysicalResource(call.request);
      const saved = await newResource.save();
      callback(null, saved);
    } catch (err) {
      callback(err);
    }
  },

  // Patch/update a physical resource by id
  PatchPhysicalResource: async (call, callback) => {
    try {
      const { id, physicalResource } = call.request;
      applog('info', new Date().toISOString(), "Patch ID:"+ JSON.stringify(id));
      applog('info', new Date().toISOString(), "Fields to update:"+ JSON.stringify(physicalResource));

      const updated = await PhysicalResource.findOneAndUpdate(
        { _id: id },             
        { $set: physicalResource },
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
  },

  
};
