const logger = require('../logger');
const { evaluatePolicy } = require('../services/policyService');
const { addDurationToDate } = require('../utils/dateUtils');
const { patchLogicalResource, patchPhysicalResource } =
  require('../services/inventoryApi');

async function handleInventoryEvent(topic, rawValue) {
  const payload = JSON.parse(rawValue);
  const resource = payload.before;

  if (!resource) return;
  if (resource.resourceStatus !== 'Retired') return;
  if (resource.resourceRecycleDate) return;

  const policy = evaluatePolicy(resource);
  if (!policy) return;

  const thresholdDate = addDurationToDate(
    new Date(),
    policy.duration,
    policy.unit
  );

  if (topic === 'logicalResourcePatchEvent') {
    await patchLogicalResource(resource.id, {
      resourceRecycleDate: thresholdDate
    });
  } else {
    await patchPhysicalResource(resource.id, {
      resourceRecycleDate: thresholdDate
    });
  }

  logger.info('Recycle date assigned for', resource.id);
}

module.exports = { handleInventoryEvent };