const logger = require('../logger');
const { evaluatePolicy } = require('./policyService');
const { addDurationToDate } = require('../utils/dateUtils');
const {
  getRetiredLogical,
  getRetiredPhysical,
  patchLogicalResource,
  patchPhysicalResource
} = require('./inventoryApi');

async function runRecycling() {
  const now = new Date();

  const logical = await getRetiredLogical();
  const physical = await getRetiredPhysical();

  const process = async (resource, isLogical) => {
    if (!resource.resourceRecycleDate) return;

    const recycleDate = new Date(resource.resourceRecycleDate);
    if (recycleDate > now) return;

    const policy = evaluatePolicy(resource);
    if (!policy) return;

    const payload = {
      resourceStatus: policy.nextResourceStatus,
      operationalState: policy.nextOperationalState,
      resourceRecycleDate: null
    };

    if (isLogical)
      await patchLogicalResource(resource.id, payload);
    else
      await patchPhysicalResource(resource.id, payload);
  };

  for (const r of logical) await process(r, true);
  for (const r of physical) await process(r, false);

  logger.info('Recycling cycle completed');
}

function startRecyclingJob(interval) {
  setInterval(runRecycling, interval);
}

module.exports = { startRecyclingJob };