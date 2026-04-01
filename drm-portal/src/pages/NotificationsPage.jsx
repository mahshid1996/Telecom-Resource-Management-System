// src/pages/NotificationsPage.jsx
import React from "react";
import { createNotification, listNotifications } from "../api/notifications";

export default function NotificationsPage() {

  // ------------------- FORM STATE -------------------
  const [configCode, setConfigCode] = React.useState("NC01");
  const [subject, setSubject] = React.useState("");
  const [body, setBody] = React.useState("");

  // Optional: allow manual email override (advanced)
  const [emails, setEmails] = React.useState([""]);

  const [sending, setSending] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [success, setSuccess] = React.useState(null);

  // ------------------- REPORT LIST STATE -------------------
  const [items, setItems] = React.useState([]);
  const [loadingList, setLoadingList] = React.useState(false);

  // ------------------- LOAD REPORTS -------------------
  async function loadNotifications() {
    setLoadingList(true);
    try {
      const data = await listNotifications();
      const arr = Array.isArray(data) ? data : data?.items ?? [];
      setItems(arr);
    } catch (e) {
      console.error("Failed to load notifications:", e);
      setItems([]);
    } finally {
      setLoadingList(false);
    }
  }

  React.useEffect(() => {
    loadNotifications();
  }, []);

  // ------------------- SEND NOTIFICATION -------------------
  async function onSend() {
    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      if (!configCode.trim()) throw new Error("Configuration code is required.");
      if (!subject.trim()) throw new Error("Subject is required.");
      if (!body.trim()) throw new Error("Body is required.");

      const payload = {
        configCode: configCode.trim(),
        subject: subject.trim(),
        body: body.trim()
      };

      const res = await createNotification(payload);

      const id =
        res?.notification?._id ||
        res?.notificationId ||
        res?._id ||
        "";

      setSuccess(
        id
          ? `Notification successfully queued (ID: ${id})`
          : "Notification successfully queued."
      );

      setSubject("");
      setBody("");
      setEmails([""]);

      loadNotifications();

    } catch (e) {
      setError(e?.message || "Failed to send notification.");
    } finally {
      setSending(false);
    }
  }

  // ------------------- EMAIL INPUT HANDLERS -------------------
  function updateEmail(index, value) {
    const updated = [...emails];
    updated[index] = value;
    setEmails(updated);
  }

  function addEmailField() {
    setEmails([...emails, ""]);
  }

  function removeEmailField(index) {
    setEmails(emails.filter((_, i) => i !== index));
  }

  // ------------------- RENDER -------------------
  return (
    <div className="container">
      <h1>Notifications</h1>

      <div className="subtitle">
        Send email notifications through the Notification Microservice.
        Configuration settings are centrally managed in the Config Service.
      </div>

      {/* ------------------- SEND FORM ------------------- */}
      <div className="card" style={{ marginTop: 16 }}>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="section-title">Create Notification</div>

        <div className="row2">

          {/* CONFIG CODE */}
          <div className="field">
            <div className="label">Notification Configuration Code *</div>
            <input
              value={configCode}
              onChange={(e) => setConfigCode(e.target.value)}
              placeholder="NC01"
            />
            <div className="help">
              This code references a NotificationConfig stored in the Config Service.
            </div>
          </div>

          {/* SUBJECT */}
          <div className="field">
            <div className="label">Subject *</div>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Notification subject"
            />
          </div>
        </div>

        {/* BODY */}
        <div className="field">
          <div className="label">Body *</div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification body text"
          />
        </div>

        {/* OPTIONAL EMAIL OVERRIDE SECTION */}
        <div className="field">
          <div className="label">
            Optional Email Override (Advanced)
          </div>

          {emails.map((email, index) => (
            <div key={index} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                value={email}
                onChange={(e) => updateEmail(index, e.target.value)}
                placeholder="example@company.com"
              />
              {emails.length > 1 && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => removeEmailField(index)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            className="btn btn-secondary"
            onClick={addEmailField}
          >
            + Add Another Email
          </button>

          <div className="help">
            If left empty, recipients will be resolved from the configuration policy.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            className="btn btn-primary"
            type="button"
            disabled={sending}
            onClick={onSend}
          >
            {sending ? "Sending..." : "Send Notification"}
          </button>
        </div>
      </div>

      <div style={{ height: 24 }} />

      {/* ------------------- HISTORY ------------------- */}
      <div className="section-title">Notification History</div>

      <div className="card">

        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div className="help">
            Data loaded from <code>GET /api/reports</code>.
          </div>
          <button
            className="btn btn-secondary"
            onClick={loadNotifications}
            disabled={loadingList}
          >
            {loadingList ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Recipients</th>
              <th>Status</th>
              <th>Created At</th>
              <th>Success</th>
              <th>Failure</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => {

              const emailsArray = Array.isArray(n.emails)
                ? n.emails.map((e) => e.email)
                : [];

              const successCount = n.successCount || 0;
              const failureCount = n.failureCount || 0;

              const createdAt = n.createdAt
                ? new Date(n.createdAt).toLocaleString()
                : "-";

              return (
                <tr key={n._id}>
                  <td>{n.subject || "-"}</td>
                  <td>{emailsArray.join(", ") || "-"}</td>
                  <td>{failureCount > 0 ? "Failed" : "Success"}</td>
                  <td>{createdAt}</td>
                  <td style={{ color: "green", fontWeight: 600 }}>{successCount}</td>
                  <td style={{ color: "red", fontWeight: 600 }}>{failureCount}</td>
                </tr>
              );
            })}

            {items.length === 0 && !loadingList && (
              <tr>
                <td colSpan={6} style={{ padding: 16 }}>
                  No notification history found.
                </td>
              </tr>
            )}

          </tbody>
        </table>

      </div>
    </div>
  );
}