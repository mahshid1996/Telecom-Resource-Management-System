// src/api/notifications.js
const NOTIF_BASE = import.meta.env.VITE_NOTIFICATION_BASE_URL || "http://localhost:3039";

// simple helper with NO AUTH
async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(${NOTIF_BASE}${path}, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(${method} ${path} failed: ${res.status} ${text});
  }

  if (res.status === 204) return null;
  return res.json();
}

// POST /v1/notifications  - send email notification
export function createNotification(payload) {
  // payload: { configCode: string, subject: string, body: string }
  return request("/v1/notifications", { method: "POST", body: payload });
}

// GET /api/reports  - list notification reports
// each report may look like:
//   { notificationId, email, status, subject }
// or like:
//   { notificationId, subject, totalEmails, successCount, failureCount, emails: [...], createdAt }
export function listNotifications() {
  return request("/api/reports", { method: "GET" });
}