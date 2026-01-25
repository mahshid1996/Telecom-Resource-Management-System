import { api } from "./client";

export function listResourceSchemas() {
  return api("/api/resource-schemas", { method: "GET" });
}

export function createResourceSchema(payload) {
  return api("/api/resource-schemas", { method: "POST", body: payload });
}

export function patchResourceSchema(id, patch) {
  return api(`/api/resource-schemas/${id}`, { method: "PATCH", body: patch });
}

export function getResourceSchemaById(id) {
  return api(`/api/resource-schemas/${id}`, { method: "GET" });
}