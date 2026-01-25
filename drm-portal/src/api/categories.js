import { api } from "./client";

export async function listCategories() {
  return api("/api/resource-categories", { method: "GET" });
}

export function createResourceCategory(payload) {
  return api("/api/resource-categories", { method: "POST", body: payload });
}

export function patchResourceCategory(id, patch) {
  return api(`/api/resource-categories/${id}`, { method: "PATCH", body: patch });
}

export function deleteResourceCategory(id) {
  return api(`/api/resource-categories/${id}`, { method: "DELETE" });
}