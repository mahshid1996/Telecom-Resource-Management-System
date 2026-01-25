const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

export function getToken() {
  return localStorage.getItem("access_token");
}
export function setToken(token) {
  localStorage.setItem("access_token", token);
}
export function clearToken() {
  localStorage.removeItem("access_token");
}

export async function api(path, { method = "GET", body, auth = true } = {}) {
  const token = auth ? getToken() : null;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Auto-handle expired/invalid token
  if (res.status === 401) {
    clearToken();
    // Redirect to login (optional but recommended)
    window.location.href = "/login";
    throw new Error("Unauthorized: token expired or invalid. Please login again.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} failed: ${res.status} ${text}`);
  }

  if (res.status === 204) return null;
  return res.json();
}