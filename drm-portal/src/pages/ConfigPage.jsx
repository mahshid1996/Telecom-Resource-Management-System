import React from "react";
import {
  createMasterConfig,
  deleteMasterConfig,
  listMasterConfigs
} from "../api/masterConfig";

const TYPE_OPTIONS = [
  { label: "All Types", type: "", name: "" },
  {
    label: "Policy of Logical Resource",
    type: "Policy",
    name: "LogicalResourcePolicy"
  },
  {
    label: "Policy of Physical Resource",
    type: "Policy",
    name: "PhysicalResourcePolicy"
  },
  {
    label: "Email Notification Configuration",
    type: "NotificationConfig",
    name: ""
  }
];

const STATUS_OPTIONS = [
  { label: "All Status", value: "" },
  { label: "Active", value: "Active" },
  { label: "InActive", value: "InActive" }
];

export default function ConfigPage() {
  const [filters, setFilters] = React.useState({
    name: "",
    type: "",
    status: ""
  });

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
      setError(e.message || "Failed to load configurations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [filters.name, filters.type, filters.status]);

  async function onDelete(id) {
    if (!confirm("Are you sure you want to delete this configuration?")) return;
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

      <div className="card" style={{ marginTop: 16 }}>
        {/*  FIXED TOP FILTER LAYOUT */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", gap: 12, flex: 1 }}>
            <input
              placeholder="Search by configuration name"
              value={filters.name}
              onChange={(e) =>
                setFilters((f) => ({ ...f, name: e.target.value }))
              }
              style={{ minWidth: 220 }}
            />

            <select
              value={TYPE_OPTIONS.findIndex(
                (o) => o.type === filters.type && o.name === filters.name
              )}
              onChange={(e) => {
                const selected = TYPE_OPTIONS[e.target.value];
                setFilters((f) => ({
                  ...f,
                  type: selected.type,
                  name: selected.name
                }));
              }}
              style={{ minWidth: 200 }}
            >
              {TYPE_OPTIONS.map((o, index) => (
                <option key={index} value={index}>
                  {o.label}
                </option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, status: e.target.value }))
              }
              style={{ minWidth: 140 }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.label} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            type="button"
            style={{ whiteSpace: "nowrap" }}
            onClick={() => setOpenCreate(true)}
          >
            + Create New Config
          </button>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        <table className="table" style={{ marginTop: 16 }}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Created Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id}>
                <td>
                  <strong>{r.name}</strong>
                  <div className="help">{r.description}</div>
                </td>
                <td>{prettyType(r.type)}</td>
                <td>{r.status}</td>
                <td>{formatDate(r.createdAt)}</td>
                <td>
                  <button
                    className="btn btn-secondary"
                    type="button"
                    onClick={() => onDelete(r._id)}
                  >
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

      {openCreate && (
        <CreateConfigModal
          onClose={() => setOpenCreate(false)}
          onCreated={async () => {
            setOpenCreate(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

/* ===========================================================
    BELOW THIS â€” NO LOGIC CHANGED (MODAL UNTOUCHED)
   =========================================================== */

function CreateConfigModal({ onClose, onCreated }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState("Active");

  const [transitions, setTransitions] = React.useState([{ from: "", to: "" }]);
  const [emailRecipients, setEmailRecipients] = React.useState([""]);
  const [chunkSize, setChunkSize] = React.useState(50);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  function addTransition() {
    setTransitions((prev) => [...prev, { from: "", to: "" }]);
  }

  function removeTransition(index) {
    setTransitions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateTransition(index, field, value) {
    const updated = [...transitions];
    updated[index][field] = value;
    setTransitions(updated);
  }

  function addEmail() {
    setEmailRecipients([...emailRecipients, ""]);
  }

  function removeEmail(index) {
    setEmailRecipients(emailRecipients.filter((_, i) => i !== index));
  }

  function updateEmail(index, value) {
    const updated = [...emailRecipients];
    updated[index] = value;
    setEmailRecipients(updated);
  }

  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      let configCharacteristics = [];

      if (type === "Policy") {
        configCharacteristics = [
          {
            name: "transitions",
            code: "transitions",
            valueType: "array",
            configCharacteristicsValues: [
              {
                valueType: "array",
                value: transitions
              }
            ]
          }
        ];
      }

      if (type === "NotificationConfig") {
        configCharacteristics = [
          {
            name: "emailRecipients",
            code: "emailRecipients",
            valueType: "array",
            configCharacteristicsValues: [
              {
                valueType: "array",
             value: emailRecipients
  .map(e => e.trim().replace(/^"+|"+$/g, ""))
  .filter(Boolean)
              }
            ]
          },
          {
            name: "chunkSize",
            code: "chunkSize",
            valueType: "number",
            configCharacteristicsValues: [
              {
                valueType: "number",
                value: chunkSize
              }
            ]
          }
        ];
      }

      const payload = {
        name,
        description,
        type,
        baseType:
          type === "NotificationConfig"
            ? "notificationConfig"
            : "resourceInventoryConfig",
        status,
        configCharacteristics,
        relatedParty: [{ name: "drmuser", email: "", phone: "" }],
        attachment: []
      };

      await createMasterConfig(payload);
      await onCreated();
    } catch (e) {
      setError(e.message || "Creation failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div className="modalTitle">Create New Configuration</div>
          <button onClick={onClose}>Ã—</button>
        </div>

        <div className="modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="field">
            <div className="label">Configuration Name *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Type *</div>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="">Select type</option>
              <option value="Policy">Policy</option>
              <option value="NotificationConfig">
                Email Notification Configuration
              </option>
            </select>
          </div>

          <div className="field">
            <div className="label">Description</div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="field">
            <div className="label">Status</div>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="Active">Active</option>
              <option value="InActive">Inactive</option>
            </select>
          </div>

          {type === "Policy" && (
            <div className="field">
              <div className="label">State Transitions</div>

              {transitions.map((t, index) => (
                <div key={index} style={{ display: "flex", gap: 8 }}>
                  <input
                    placeholder="From"
                    value={t.from}
                    onChange={(e) =>
                      updateTransition(index, "from", e.target.value)
                    }
                  />
                  <input
                    placeholder="To"
                    value={t.to}
                    onChange={(e) =>
                      updateTransition(index, "to", e.target.value)
                    }
                  />
                  <button onClick={() => removeTransition(index)}>
                    Remove
                  </button>
                </div>
              ))}

              <button onClick={addTransition}>+ Add Transition</button>
            </div>
          )}

          {type === "NotificationConfig" && (
            <div className="field">
              <div className="label">Email Recipients *</div>

              {emailRecipients.map((email, index) => (
                <div key={index} style={{ display: "flex", gap: 8 }}>
                  <input
                    value={email}
                    onChange={(e) => updateEmail(index, e.target.value)}
                    placeholder="example@company.com"
                  />
                  {emailRecipients.length > 1 && (
                    <button onClick={() => removeEmail(index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button onClick={addEmail}>+ Add Email</button>

              <div className="field" style={{ marginTop: 12 }}>
                <div className="label">Chunk Size *</div>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                />
              </div>
            </div>
          )}
        </div>

        <div className="drawerFooter">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            disabled={!name || !type || saving}
            onClick={onSubmit}
          >
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
  return dt.toLocaleDateString();
}

function prettyType(t) {
  if (t === "NotificationConfig")
    return "Email Notification Configuration";
  if (t === "Policy") return "Policy";
  return t || "-";
} 