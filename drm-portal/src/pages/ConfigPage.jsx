import React from "react";
import { createMasterConfig, deleteMasterConfig, listMasterConfigs } from "../api/masterConfig";

const TYPE_OPTIONS = [
  { label: "All Types", value: "" },
  { label: "Policy of Logical Resource", value: "Policy" },
  { label: "Policy of Physical Resource", value: "Policy" },
  { label: "Email Notification Configuration", value: "NotificationConfig" },
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "Active" },
  { label: "InActive", value: "InActive" },
];

export default function ConfigPage() {
  const [filters, setFilters] = React.useState({ name: "", type: "", status: "" });
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [openCreate, setOpenCreate] = React.useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await listMasterConfigs(filters);
      setRows(Array.isArray(res) ? res : []);
    } catch (e) {
      setError(e.message || "Failed to load configs");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.name, filters.type, filters.status]);

  async function onDelete(id) {
    if (!confirm("Delete this configuration?")) return;
    try {
      await deleteMasterConfig(id);
      await load();
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  }

  return (
    <div className="container">
      <h1>Configuration Management</h1>

      <div style={{ marginTop: 16 }} className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <input
              placeholder="Search configurations by name"
              value={filters.name}
              onChange={(e) => setFilters((f) => ({ ...f, name: e.target.value }))}
            />

            <select value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
              {TYPE_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>

            <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button className="btn btn-primary" onClick={() => setOpenCreate(true)} type="button">
            + Create New Config
          </button>
        </div>

        <div className="subtitle" style={{ marginTop: 14 }}>
          {loading ? "Loading..." : `Showing ${rows.length} of ${rows.length} configurations`}
        </div>

        {error && <div className="alert alert-error" style={{ marginTop: 12 }}>{error}</div>}

        <div style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "45%" }}>Name</th>
                <th style={{ width: "20%" }}>Type</th>
                <th style={{ width: "12%" }}>Status</th>
                <th style={{ width: "18%" }}>Created Date</th>
                <th style={{ width: "5%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td>
                    <div style={{ fontWeight: 900 }}>{r.name}</div>
                    <div className="help">{r.description}</div>
                  </td>

                  <td><span className="badge badge-blue">{prettyType(r.type)}</span></td>

                  <td>
                    <span className={`badge ${r.status === "Active" ? "badge-green" : "badge-gray"}`}>
                      {r.status === "InActive" ? "Inactive" : r.status}
                    </span>
                  </td>

                  <td className="help">{formatDate(r.createdAt)}</td>

                  <td>
                    <button className="btn btn-secondary" onClick={() => onDelete(r._id)} type="button">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="help" style={{ padding: 16 }}>
                    No configurations found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {openCreate && (
        <CreateConfigModal
          onClose={() => setOpenCreate(false)}
          onCreated={async () => { setOpenCreate(false); await load(); }}
        />
      )}
    </div>
  );
}

function CreateConfigModal({ onClose, onCreated }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("Active");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        description,
        type,
        baseType: type === "NotificationConfig" ? "notificationConfig" : "resourceInventoryConfig",
        status,
        code: `CF-${Math.floor(Math.random() * 9000) + 1000}`,
        version: 0,
        configCharacteristics: [],
        relatedParty: [{ name: "drmuser", email: "", phone: "" }],
        attachment: [],
      };

      await createMasterConfig(payload);
      await onCreated();
    } catch (e) {
      setError(e.message || "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Create New Configuration</div>
            <div className="subtitle">Add a new system configuration with its type and specific characteristics.</div>
          </div>
          <button className="modalClose" onClick={onClose} type="button">×</button>
        </div>

        {/*  content must be inside modalBody */}
        <div className="modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <div className="label">Configuration Name *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter configuration name" />
          </div>

          <div className="field">
            <div className="label">Type *</div>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select configuration type</option>
              <option value="Policy">Policy</option>
              <option value="NotificationConfig">Email Notification Configuration</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Enter configuration description" />
          </div>

          <div className="field">
            <div className="label">Status</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="InActive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="drawerFooter">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" disabled={saving || !name || !type} onClick={onSubmit} type="button">
            {saving ? "Creating..." : "Create Configuration"}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}

function prettyType(t) {
  if (t === "NotificationConfig") return "Email Notification Configuration";
  if (t === "Policy") return "Policy";
  return t || "-";
}