import { getToken } from "./client";

const BASE = import.meta.env.VITE_MASTER_CONFIG_BASE_URL || "http://localhost:3030";

async function request(path, { method = "GET", body } = {}) {
  const token = getToken(); // reuse JWT if your master-config is protected (if not, it's still ok)
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${BASE}${path} failed: ${res.status} ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

// GET /master-config?name=&type=&status=&code=
export function listMasterConfigs(filters = {}) {
  const params = new URLSearchParams();
  if (filters.name) params.set("name", filters.name);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.code) params.set("code", filters.code);

  const qs = params.toString();
  return request(`/master-config${qs ? `?${qs}` : ""}`, { method: "GET" });
}

export function createMasterConfig(payload) {
  return request("/master-config", { method: "POST", body: payload });
}

export function deleteMasterConfig(id) {
  return request(`/master-config/${id}`, { method: "DELETE" });
}