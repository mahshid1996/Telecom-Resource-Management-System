import { getToken } from "./client";

const BULK_BASE = import.meta.env.VITE_BULK_API_BASE_URL || "http://localhost:3035";

async function request(
  path,
  { method = "GET", body, auth = false, headers } = {} //  default auth=false
) {
  const token = auth ? getToken() : null;

  const res = await fetch(`${BULK_BASE}${path}`, {
    method,
    headers: {
      ...(headers || {}),
      //  do NOT set Content-Type for FormData (browser adds boundary)
      ...(body !== undefined && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }

  // Report/export endpoints return CSV
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("text/csv")) return res.blob();

  if (res.status === 204) return null;
  return res.json();
}

export function bulkCreate(formData) {
  return request("/v1/drm-bulk/resources", { method: "POST", body: formData, auth: false });
}

export function bulkUpdate(formData) {
  return request("/v1/drm-bulk/resources/update", { method: "POST", body: formData, auth: false });
}

export function getBulkRequest(id) {
  return request(`/v1/drm-bulk/resources/${id}`, { method: "GET", auth: false });
}

export async function downloadBulkReport(id) {
  return request(`/v1/drm-bulk/resources/${id}/report`, { method: "GET", auth: false });
}

export async function exportResources(params) {
  const qs = new URLSearchParams(params).toString();
  return request(`/v1/drm-bulk/resources/export?${qs}`, { method: "GET", auth: false });
}