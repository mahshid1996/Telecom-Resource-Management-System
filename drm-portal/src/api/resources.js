import { api } from "./client";

export function createLogicalResource(payload) {
  return api("/api/logical-resources", { method: "POST", body: payload });
}

export function createPhysicalResource(payload) {
  return api("/api/physical-resources", { method: "POST", body: payload });
}

// LIST endpoints (use these for KPI counts)
export function listLogicalResources() {
  return api("/api/logical-resources", { method: "GET" });
}

export function listPhysicalResources() {
  return api("/api/physical-resources", { method: "GET" });
}

// SEARCH endpoints (only if your backend supports them)
export function searchLogicalResources(params) {
  const q = new URLSearchParams(params).toString();
  return api(`/api/logical-resources/search?${q}`, { method: "GET" });
}

export function searchPhysicalResources(params) {
  const q = new URLSearchParams(params).toString();
  return api(`/api/physical-resources/search?${q}`, { method: "GET" });
}

//  KPI endpoint that returns accurate totals from Mongo (no pagination issues)
export function getResourceKpis() {
  return api("/api/resources/kpis", { method: "GET" });
}