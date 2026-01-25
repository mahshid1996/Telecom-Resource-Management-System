import React from "react";
import { useNavigate } from "react-router-dom";
import { createResourceCategory } from "../api/categories";
import { listResourceSchemas, createResourceSchema } from "../api/schemas";

export default function CreateCategoryPage() {
  const nav = useNavigate();

  const [schemas, setSchemas] = React.useState([]);
  const [loadingSchemas, setLoadingSchemas] = React.useState(false);

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [realizingResourceType, setRealizingResourceType] = React.useState("logicalResource");

  const [partyName, setPartyName] = React.useState("drmuser");
  const [partyRole, setPartyRole] = React.useState("drmUser");

  const [schemaId, setSchemaId] = React.useState("");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [openSchemaModal, setOpenSchemaModal] = React.useState(false);

  async function reloadSchemas() {
    setLoadingSchemas(true);
    try {
      const sch = await listResourceSchemas();
      setSchemas(Array.isArray(sch) ? sch : (sch?.items ?? []));
    } finally {
      setLoadingSchemas(false);
    }
  }

  React.useEffect(() => {
    (async () => {
      setError(null);
      try {
        await reloadSchemas();
      } catch (e) {
        setError(e.message || "Failed to load schemas");
      }
    })();
  }, []);

  async function onCreateCategory() {
    setSaving(true);
    setError(null);

    try {
      const payload = {
        name,
        description,
        realizingResourceType,
        categorySchema: schemaId,
        relatedParty: [{ name: partyName, role: partyRole }],
      };

      await createResourceCategory(payload);
      nav("/categories", { replace: true });
    } catch (e) {
      setError(e.message || "Create category failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="container">
      <h1>Create Category</h1>
      <div className="subtitle">Add a new resource category</div>

      {error && <div className="alert alert-error" style={{ marginTop: 14 }}>{error}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-title">Basic Information</div>

        <div className="field">
          <div className="label">Category Name *</div>
          <input
            placeholder="e.g., MSISDN, SIM Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <div className="label">Description</div>
          <textarea
            placeholder="Brief description of this category"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

        <div className="section-title">Resource Configuration</div>

        <div className="field">
          <div className="label">Realizing Resource Type *</div>
          <select value={realizingResourceType} onChange={(e) => setRealizingResourceType(e.target.value)}>
            <option value="logicalResource">Logical Resource</option>
            <option value="physicalResource">Physical Resource</option>
            <option value="nonSerializedResource">Non Serialized Resource</option>
          </select>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

        <div className="section-title">Related Party</div>

        <div className="row2">
          <div className="field">
            <div className="label">Name</div>
            <input value={partyName} onChange={(e) => setPartyName(e.target.value)} placeholder="e.g., drmuser" />
          </div>

          <div className="field">
            <div className="label">Role</div>
            <input value={partyRole} onChange={(e) => setPartyRole(e.target.value)} placeholder="e.g., drmUser" />
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

        <div className="section-title">Schema</div>

        <div className="row2" style={{ alignItems: "end" }}>
          <div className="field">
            <div className="label">Select Schema *</div>
            <select
              value={schemaId}
              onChange={(e) => setSchemaId(e.target.value)}
              disabled={loadingSchemas}
            >
              <option value="">{loadingSchemas ? "Loading..." : "Select a schema"}</option>
              {schemas.map((s) => {
                const id = s.id || s._id;
                const fields = Object.keys(s?.resourceSchema?.properties || {}).length;
                return (
                  <option key={id} value={id}>
                    {s.name} ({fields} fields)
                  </option>
                );
              })}
            </select>
          </div>

          <button className="btn btn-secondary" type="button" onClick={() => setOpenSchemaModal(true)}>
            + Create New Schema
          </button>
        </div>

        {/* Bottom actions: Back on LEFT, Create on RIGHT */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 18 }}>
          <button className="btn btn-secondary" type="button" onClick={() => nav("/categories")}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" type="button" onClick={() => nav("/categories")}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              type="button"
              disabled={saving || !name || !schemaId}
              onClick={onCreateCategory}
            >
              {saving ? "Creating..." : "Create Category"}
            </button>
          </div>
        </div>
      </div>

      {openSchemaModal && (
        <CreateSchemaModal
          onClose={() => setOpenSchemaModal(false)}
          onCreated={async (createdSchema) => {
            setOpenSchemaModal(false);
            await reloadSchemas();
            const newId = createdSchema?.id || createdSchema?._id;
            if (newId) setSchemaId(newId);
          }}
        />
      )}
    </div>
  );
}

function CreateSchemaModal({ onClose, onCreated }) {
  const [schemaName, setSchemaName] = React.useState("");
  const [schemaDescription, setSchemaDescription] = React.useState("");
  const [version, setVersion] = React.useState(1);

  const [fields, setFields] = React.useState([
    { fieldName: "", fieldType: "string", pattern: "", required: false },
  ]);

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  function addField() {
    setFields((prev) => [...prev, { fieldName: "", fieldType: "string", pattern: "", required: false }]);
  }

  function updateField(idx, patch) {
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  async function onSaveSchema() {
    setSaving(true);
    setError(null);

    try {
      const properties = {};
      const required = [];

      for (const f of fields) {
        if (!f.fieldName) continue;
        properties[f.fieldName] = {
          type: f.fieldType,
          ...(f.pattern ? { pattern: f.pattern } : {}),
        };
        if (f.required) required.push(f.fieldName);
      }

      const payload = {
        name: schemaName,
        description: schemaDescription,
        version: Number(version) || 1,
        resourceSchema: {
          schema: "http://json-schema.org/draft-04/schema#",
          type: "object",
          properties,
          required,
        },
      };

      const created = await createResourceSchema(payload);
      await onCreated(created);
    } catch (e) {
      setError(e.message || "Create schema failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Create New Schema</div>
            <div className="subtitle">Define a new schema structure for your categories</div>
          </div>
          <button className="modalClose" onClick={onClose} type="button">×</button>
        </div>

        <div className="modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="section-title">Schema Metadata</div>

          <div className="row2">
            <div className="field">
              <div className="label">Schema Name *</div>
              <input value={schemaName} onChange={(e) => setSchemaName(e.target.value)} placeholder="e.g., MSISDN Schema" />
            </div>
            <div className="field">
              <div className="label">Version</div>
              <input type="number" value={version} onChange={(e) => setVersion(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <div className="label">Schema Description</div>
            <textarea value={schemaDescription} onChange={(e) => setSchemaDescription(e.target.value)} placeholder="Brief description of this schema" />
          </div>

          <div style={{ height: 14 }} />

          <div className="section-title">Schema Fields</div>

          {fields.map((f, idx) => (
            <div key={idx} className="card" style={{ boxShadow: "none", marginBottom: 10 }}>
              <div className="row3">
                <div className="field">
                  <div className="label">Field Name *</div>
                  <input value={f.fieldName} onChange={(e) => updateField(idx, { fieldName: e.target.value })} placeholder="e.g., msisdn" />
                </div>

                <div className="field">
                  <div className="label">Field Type *</div>
                  <select value={f.fieldType} onChange={(e) => updateField(idx, { fieldType: e.target.value })}>
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="integer">integer</option>
                    <option value="boolean">boolean</option>
                  </select>
                </div>

                <div className="field">
                  <div className="label">Pattern / Regex (optional)</div>
                  <input value={f.pattern} onChange={(e) => updateField(idx, { pattern: e.target.value })} placeholder="e.g., ^[0-9]{10}$" />
                </div>
              </div>

              <label className="help" style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 6 }}>
                <input
                  type="checkbox"
                  checked={!!f.required}
                  onChange={(e) => updateField(idx, { required: e.target.checked })}
                  style={{ width: 16, height: 16 }}
                />
                Required
              </label>
            </div>
          ))}

          <button className="btn btn-secondary" type="button" onClick={addField} style={{ width: "100%", justifyContent: "center" }}>
            + Add Field
          </button>
        </div>

        <div className="drawerFooter">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" type="button" disabled={saving || !schemaName} onClick={onSaveSchema}>
            {saving ? "Saving..." : "Save Schema"}
          </button>
        </div>
      </div>
    </div>
  );
}