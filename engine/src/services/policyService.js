const policies = [
  {
    categoryCode: "RC34",
    resourceStatus: "Retired",
    operationalState: "Terminated",
    duration: 180,
    unit: "Minute",
    nextResourceStatus: "Available",
    nextOperationalState: "Functional"
  }
];

function evaluatePolicy(resource) {
  const categoryCode = Array.isArray(resource.category)
    ? resource.category[0]
    : resource.category;

  return policies.find(p =>
    p.categoryCode === categoryCode &&
    p.resourceStatus === resource.resourceStatus &&
    p.operationalState === resource.operationalState
  );
}

module.exports = { evaluatePolicy };