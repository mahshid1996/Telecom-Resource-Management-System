const axios = require('axios');
const config = require('../config');

async function patchLogicalResource(id, payload) {
  await axios.patch(
    ${config.inventoryBaseUrl}/api/logical-resources/${id},
    payload
  );
}

async function patchPhysicalResource(id, payload) {
  await axios.patch(
    ${config.inventoryBaseUrl}/api/physical-resources/${id},
    payload
  );
}

async function getRetiredLogical() {
  const res = await axios.get(
    ${config.inventoryBaseUrl}/api/logical-resources?resourceStatus=Retired
  );
  return res.data;
}

async function getRetiredPhysical() {
  const res = await axios.get(
    ${config.inventoryBaseUrl}/api/physical-resources?resourceStatus=Retired
  );
  return res.data;
}

module.exports = {
  patchLogicalResource,
  patchPhysicalResource,
  getRetiredLogical,
  getRetiredPhysical
};