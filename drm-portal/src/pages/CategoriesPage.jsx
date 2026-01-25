import React from "react";
import { useNavigate } from "react-router-dom";
import { listCategories, deleteResourceCategory, patchResourceCategory } from "../api/categories";
import { listResourceSchemas, getResourceSchemaById, patchResourceSchema } from "../api/schemas";

export default function CategoriesPage() {
  const nav = useNavigate(); 

  const [q, setQ] = React.useState("");
  const [rows, setRows] = React.useState([]);
  const [schemas, setSchemas] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const [editing, setEditing] = React.useState(null);
  const [editingSchema, setEditingSchema] = React.useState(null);

  async function loadAll() {
    setLoading(true);
    setError(null);

    try {
      const cats = await listCategories();
      setRows(Array.isArray(cats) ? cats : (cats?.items ?? []));
    } catch (e) {
      setError(e.message || "Failed to load categories");
      setRows([]);
    }

    try {
      const sch = await listResourceSchemas();
      setSchemas(Array.isArray(sch) ? sch : (sch?.items ?? []));
    } catch {
      setSchemas([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    loadAll();
  }, []);

  const filtered = rows.filter((r) => {
    const text = `${r.name ?? ""} ${r.description ?? ""} ${r.realizingResourceType ?? ""}`.toLowerCase();
    return text.includes(q.toLowerCase());
  });

  async function onDelete(cat) {
    const id = cat.id || cat._id;
    if (!id) return;

    if (!confirm(`Delete category "${cat.name}"?`)) return;

    try {
      await deleteResourceCategory(id);
      await loadAll();
    } catch (e) {
      setError(e.message || "Delete failed");
    }
  }

  async function openSchemaEditor(schemaId) {
    try {
      const full = await getResourceSchemaById(schemaId);
      setEditingSchema(full);
    } catch (e) {
      setError(e.message || "Failed to load schema");
    }
  }

  return (
    <div className="container">
      <h1>Categories Management</h1>
      <div className="subtitle">Manage resource categories, schemas, and data structures</div>

      <div style={{ height: 16 }} />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
          <input
            placeholder="Search categories..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ maxWidth: 520 }}
          />

          {/*  enabled and navigates */}
          <button
            className="btn btn-primary"
            type="button"
            onClick={() => nav("/categories/create")}
          >
            + Create New Category
          </button>
        </div>

        <div className="subtitle" style={{ marginTop: 14 }}>
          {loading ? "Loading..." : `Showing ${filtered.length} of ${rows.length} categories`}
        </div>

        <div style={{ marginTop: 14 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "18%" }}>Category Name</th>
                <th style={{ width: "34%" }}>Description</th>
                <th style={{ width: "22%" }}>Schema Fields Summary</th>
                <th style={{ width: "14%" }}>Resource Type</th>
                <th style={{ width: "12%" }}>Created Date</th>
                <th style={{ width: "10%" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((c) => (
                <tr key={c.id || c._id}>
                  <td style={{ fontWeight: 900 }}>{(c.name || "").toUpperCase()}</td>
                  <td className="help">{c.description || "-"}</td>
                  <td><SchemaSummary category={c} schemas={schemas} /></td>
                  <td><span className="badge badge-blue">{c.realizingResourceType || "-"}</span></td>
                  <td className="help">{formatDate(c.createdAt)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="iconBtn" title="Edit" type="button" onClick={() => setEditing(c)}>✎</button>
                      <button className="iconBtn iconBtnDanger" title="Delete" type="button" onClick={() => onDelete(c)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="help" style={{ padding: 16 }}>
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <EditCategoryModal
          category={editing}
          schemas={schemas}
          onClose={() => setEditing(null)}
          onUpdated={async () => { setEditing(null); await loadAll(); }}
          onOpenSchemaEditor={openSchemaEditor}
          patchCategory={patchResourceCategory}
        />
      )}

      {editingSchema && (
        <EditSchemaModal
          schema={editingSchema}
          onClose={() => setEditingSchema(null)}
          onUpdated={async () => { setEditingSchema(null); await loadAll(); }}
          patchSchema={patchResourceSchema}
        />
      )}
    </div>
  );
}

function SchemaSummary({ category, schemas }) {
  const schemaId = category.categorySchema;
  const schema = schemas.find((s) => (s.id || s._id) === schemaId);
  const props = schema?.resourceSchema?.properties || {};
  const keys = Object.keys(props);

  if (!schema) return <span className="help">No schema</span>;
  if (keys.length === 0) return <span className="help">No fields</span>;

  const first = keys.slice(0, 3);
  const rest = keys.length - first.length;

  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {first.map((k) => <span key={k} className="badge badge-blue">{k}</span>)}
      {rest > 0 && <span className="badge badge-gray">+{rest}</span>}
    </div>
  );
}

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString();
}

function useModalUX(onClose) {
  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
}

/* Center modal: Edit Category */
function EditCategoryModal({ category, schemas, onClose, onUpdated, onOpenSchemaEditor, patchCategory }) {
  useModalUX(onClose);

  const id = category.id || category._id;
  const [name, setName] = React.useState(category.name || "");
  const [description, setDescription] = React.useState(category.description || "");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  const schemaId = category.categorySchema;
  const schema = schemas.find((s) => (s.id || s._id) === schemaId);
  const rp = Array.isArray(category.relatedParty) ? category.relatedParty : [];

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      await patchCategory(id, { name, description });
      await onUpdated();
    } catch (e) {
      setError(e.message || "Update failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Edit Category</div>
            <div className="subtitle">Update category information</div>
          </div>
          <button className="modalClose" onClick={onClose} type="button">×</button>
        </div>

        <div className="modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="section-title">Basic Information</div>

          <div className="field">
            <div className="label">Category Name *</div>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="field">
            <div className="label">Description</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

          <div className="section-title">Resource Configuration</div>
          <div className="field">
            <div className="label">Realizing Resource Type *</div>
            <input value={category.realizingResourceType || ""} disabled />
            <div className="help">This value cannot be changed after category creation.</div>
          </div>

          <div className="section-title">Related Party</div>
          <div className="card" style={{ boxShadow: "none", border: "1px solid var(--border)" }}>
            {rp.length === 0 && <div className="help">No related parties</div>}
            {rp.map((p, idx) => (
              <div key={idx} className="help" style={{ display: "flex", gap: 12, padding: "6px 0" }}>
                <div><b>Name:</b> {p.name || "-"}</div>
                <div><b>Role:</b> {p.role || "-"}</div>
              </div>
            ))}
            <div className="help" style={{ marginTop: 8 }}>Related parties are read-only in edit mode.</div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "14px 0" }} />

          <div className="section-title">Schema</div>
          <div className="field">
            <div className="label">Selected Schema</div>
            <input value={schema ? `${schema.name}` : `Schema ID: ${schemaId || "-"}`} disabled />
            <div className="help">Schema cannot be changed for an existing category.</div>
          </div>

          <button
            className="btn btn-secondary"
            type="button"
            disabled={!schemaId}
            onClick={() => {
              onClose();
              onOpenSchemaEditor(schemaId);
            }}
          >
            Update Schema
          </button>
        </div>

        <div className="drawerFooter">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" disabled={saving || !name} onClick={onSave} type="button">
            {saving ? "Updating..." : "Update Category"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* Center modal: Update Schema */
function EditSchemaModal({ schema, onClose, onUpdated, patchSchema }) {
  useModalUX(onClose);

  const id = schema.id || schema._id;
  const initialProps = schema?.resourceSchema?.properties || {};
  const initialRequired = schema?.resourceSchema?.required || [];

  const [name, setName] = React.useState(schema.name || "");
  const [description, setDescription] = React.useState(schema.description || "");
  const [version, setVersion] = React.useState(schema.version ?? 1);

  const [fields, setFields] = React.useState(() => {
    const keys = Object.keys(initialProps);
    if (keys.length === 0) return [{ fieldName: "", fieldType: "string", pattern: "", required: false }];

    return keys.map((k) => ({
      fieldName: k,
      fieldType: ["string", "number", "integer", "boolean"].includes(initialProps[k]?.type) ? initialProps[k]?.type : "string",
      pattern: initialProps[k]?.pattern || "",
      required: initialRequired.includes(k),
    }));
  });

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  function addField() {
    setFields((f) => [...f, { fieldName: "", fieldType: "string", pattern: "", required: false }]);
  }

  function updateField(idx, patch) {
    setFields((prev) => prev.map((x, i) => (i === idx ? { ...x, ...patch } : x)));
  }

  async function onSave() {
    setSaving(true);
    setError(null);

    try {
      const properties = {};
      const required = [];

      for (const f of fields) {
        if (!f.fieldName) continue;
        properties[f.fieldName] = { type: f.fieldType, ...(f.pattern ? { pattern: f.pattern } : {}) };
        if (f.required) required.push(f.fieldName);
      }

      const patch = {
        name,
        description,
        version: Number(version) || 1,
        resourceSchema: {
          schema: "http://json-schema.org/draft-04/schema#",
          type: "object",
          properties,
          required,
        },
      };

      await patchSchema(id, patch);
      await onUpdated();
    } catch (e) {
      setError(e.message || "Update schema failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modalOverlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modalHeader">
          <div>
            <div className="modalTitle">Update Schema</div>
            <div className="subtitle">Edit the schema linked to this category</div>
          </div>
          <button className="modalClose" onClick={onClose} type="button">×</button>
        </div>

        <div className="modalBody">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="card" style={{ boxShadow: "none" }}>
            <div className="section-title">Schema Metadata</div>

            <div className="row2">
              <div className="field">
                <div className="label">Schema Name *</div>
                <input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <div className="label">Version</div>
                <input type="number" value={version} onChange={(e) => setVersion(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <div className="label">Schema Description</div>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>

          <div style={{ height: 14 }} />

          <div className="card" style={{ boxShadow: "none" }}>
            <div className="section-title">Schema Fields</div>

            {fields.map((f, idx) => (
              <div key={idx} style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <div className="row3">
                  <div className="field">
                    <div className="label">Field Name *</div>
                    <input value={f.fieldName} onChange={(e) => updateField(idx, { fieldName: e.target.value })} />
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
                    <input value={f.pattern} onChange={(e) => updateField(idx, { pattern: e.target.value })} />
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
        </div>

        <div className="drawerFooter">
          <button className="btn btn-secondary" onClick={onClose} type="button">Cancel</button>
          <button className="btn btn-primary" disabled={saving || !name} onClick={onSave} type="button">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}