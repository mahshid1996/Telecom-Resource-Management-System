import { api, getToken } from "./client";

/
 * Create Logical Resource
 */
export function createLogicalResource(payload) {
  return api("/api/logical-resources", { method: "POST", body: payload });
}

/
 * Create Physical Resource
 */
export function createPhysicalResource(payload) {
  return api("/api/physical-resources", { method: "POST", body: payload });
}

/
 * LIST endpoints (used in normal UI pages)
 * These remain unchanged and safe.
 */
export async function listLogicalResources() {
  return await api("/api/logical-resources", { method: "GET" });
}

export async function listPhysicalResources() {
  return await api("/api/physical-resources", { method: "GET" });
}

/
 * SEARCH endpoints
 */
export function searchLogicalResources(params) {
  const q = new URLSearchParams(params).toString();
  return api(/api/logical-resources/search?${q}, { method: "GET" });
}

export function searchPhysicalResources(params) {
  const q = new URLSearchParams(params).toString();
  return api(/api/physical-resources/search?${q}, { method: "GET" });
}

/
 * INTERNAL helper to fetch only X-Total-Count header.
 * Uses Authorization header because Inventory APIs are protected.
 * Uses limit=1 to avoid heavy payload transfer.
 */
async function fetchTotalCount(path) {
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

  const response = await fetch(`${base}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  const total = response.headers.get("X-Total-Count");
  return Number(total || 0);
}

/
 * KPI Dashboard metrics
 * Uses existing Inventory filtering APIs.
 * Does NOT introduce new backend endpoints.
 * Does NOT affect any other UI logic.
 */
export async function getResourceKpis() {
  const logical = "/api/logical-resources";
  const physical = "/api/physical-resources";

  const [
    totalLogical,
    totalPhysical,
    availableLogical,
    availablePhysical,
    reservedLogical,
    reservedPhysical,
    retiredLogical,
    retiredPhysical,
  ] = await Promise.all([
    fetchTotalCount(${logical}?limit=1),
    fetchTotalCount(${physical}?limit=1),

    fetchTotalCount(${logical}?resourceStatus=Available&limit=1),
    fetchTotalCount(${physical}?resourceStatus=Available&limit=1),

    fetchTotalCount(${logical}?resourceStatus=Reserved&limit=1),
    fetchTotalCount(${physical}?resourceStatus=Reserved&limit=1),

    fetchTotalCount(${logical}?resourceStatus=Retired&limit=1),
    fetchTotalCount(${physical}?resourceStatus=Retired&limit=1),
  ]);

  return {
    generated: { total: totalLogical + totalPhysical },
    available: { total: availableLogical + availablePhysical },
    reserved: { total: reservedLogical + reservedPhysical },
    retired: { total: retiredLogical + retiredPhysical },
    updatedAt: new Date().toISOString(),
  };
}