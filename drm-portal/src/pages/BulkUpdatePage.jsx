import React from "react";
import { useNavigate } from "react-router-dom";
import { listCategories } from "../api/categories";
import { bulkUpdate } from "../api/bulk";

export default function BulkUpdatePage() {
  const nav = useNavigate();

  const [categories, setCategories] = React.useState([]);

  // backend expects these exact values: "LogicalResource" | "PhysicalResource"
  const [baseType, setBaseType] = React.useState("LogicalResource");

  //  Type is free text
  const [type, setType] = React.useState("");

  const [categoryId, setCategoryId] = React.useState("");
  const [schemaId, setSchemaId] = React.useState(""); // derived from category.categorySchema

  const [skipLines, setSkipLines] = React.useState(1);
  const [file, setFile] = React.useState(null);

  const [note, setNote] = React.useState("bulk update test");

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        const c = await listCategories();
        setCategories(Array.isArray(c) ? c : (c?.items ?? []));
      } catch {
        setCategories([]);
      }
    })();
  }, []);

  const filteredCategories = categories.filter((c) => {
    if (baseType === "LogicalResource") return c.realizingResourceType === "logicalResource";
    if (baseType === "PhysicalResource") return c.realizingResourceType === "physicalResource";
    return true;
  });

  function onSelectCategory(nextCategoryId) {
    setCategoryId(nextCategoryId);

    const cat = filteredCategories.find((x) => (x.id || x._id) === nextCategoryId);
    const derivedSchemaId = cat?.categorySchema || "";
    setSchemaId(derivedSchemaId);
  }

  async function onSubmit() {
    setSaving(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      // backend uses type as default, but it can also read type per row from CSV
      // still send it to match your curl
      fd.append("type", type);

      fd.append("baseType", baseType);
      fd.append("skipLines", String(skipLines));

      // derived from category
      fd.append("schemaId", schemaId);
      fd.append("categoryId", categoryId);

      // user fields (same as your curl)
      fd.append("userName", "myuser");
      fd.append("userRole", "myuser");
      fd.append("userType", "DRMUser");
      fd.append("userBaseType", "DRMUser");

      fd.append("note", note);

      const res = await bulkUpdate(fd); // { requestId, status }

      // store in UI local history
      const entry = {
        requestId: res?.requestId,
        action: "Bulk Update",
        categoryId,
        schemaId,
        baseType,
        type,
        status: res?.status || "pending",
        progressPercent: 0,
        totalCount: 0,
        successCount: 0,
        failureCount: 0,
        date: new Date().toISOString(),
      };

      const raw = localStorage.getItem("bulk_history");
      const prev = raw ? JSON.parse(raw) : [];
      localStorage.setItem("bulk_history", JSON.stringify([entry, ...prev]));

      nav("/bulk", { replace: true });
    } catch (e) {
      setError(e?.message || "Bulk update failed");
    } finally {
      setSaving(false);
    }
  }

  const selectedCategory = filteredCategories.find((c) => (c.id || c._id) === categoryId);
  const schemaLabel =
    selectedCategory?.categorySchema
      ? `Schema ID: ${String(selectedCategory.categorySchema)}`
      : "Schema will be auto-selected from category";

  const canSubmit =
    !saving &&
    !!file &&
    !!categoryId &&
    !!schemaId &&
    !!baseType; // type can be optional if you want, but curl includes it

  return (
    <div className="container">
      <h1>Bulk Update</h1>
      <div className="subtitle">Upload CSV to update resources in bulk</div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row2">
          <div className="field">
            <div className="label">Base Type *</div>
            <select
              value={baseType}
              onChange={(e) => {
                const next = e.target.value;
                setBaseType(next);
                setCategoryId("");
                setSchemaId("");
              }}
            >
              <option value="LogicalResource">LogicalResource</option>
              <option value="PhysicalResource">PhysicalResource</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Resource Type (optional)</div>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., Router"
            />
            <div className="help">
              If empty, your backend can use the per-row type column from the CSV (value,type,name).
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Category *</div>
            <select value={categoryId} onChange={(e) => onSelectCategory(e.target.value)}>
              <option value="">Select category</option>
              {filteredCategories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <div className="label">Schema (from Category)</div>
            <input value={schemaLabel} disabled />
            <div className="help">
              We automatically use <b>category.categorySchema</b> as <b>schemaId</b> in the bulk update request.
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Skip Lines</div>
            <input
              type="number"
              value={skipLines}
              onChange={(e) => setSkipLines(Number(e.target.value))}
            />
            <div className="help">Usually 1 to skip CSV header</div>
          </div>

          <div className="field">
            <div className="label">CSV File *</div>
            <input
              type="file"
              accept=".csv,.txt"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <div className="help">Expected columns: value,type,name</div>
          </div>
        </div>

        <div className="field">
          <div className="label">Note</div>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="bulk update test" />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button className="btn btn-secondary" type="button" onClick={() => nav("/bulk")}>
            ← Back
          </button>

          <button className="btn btn-primary" type="button" disabled={!canSubmit} onClick={onSubmit}>
            {saving ? "Uploading..." : "Start Bulk Update"}
          </button>
        </div>
      </div>
    </div>
  );
}