import React from "react";
import { useNavigate } from "react-router-dom";
import { listCategories } from "../api/categories";
import { bulkCreate } from "../api/bulk";

export default function BulkCreatePage() {
  const nav = useNavigate();

  const [categories, setCategories] = React.useState([]);

  // backend expects these exact values: "LogicalResource" | "PhysicalResource"
  const [baseType, setBaseType] = React.useState("LogicalResource");

  //  Type is free text (user types)
  const [type, setType] = React.useState("");

  const [categoryId, setCategoryId] = React.useState("");
  const [schemaId, setSchemaId] = React.useState(""); // derived from selected category.categorySchema

  const [skipLines, setSkipLines] = React.useState(1);
  const [file, setFile] = React.useState(null);

  const [columnMapping, setColumnMapping] = React.useState("MSISDN,MobileClass");
  const [note, setNote] = React.useState("for test");

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

  // Filter categories based on baseType mapping
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
      fd.append("type", type); // free text
      fd.append("baseType", baseType);
      fd.append("columnMapping", columnMapping);
      fd.append("skipLines", String(skipLines));
      fd.append("categoryId", categoryId);

      //  schemaId comes from selected category.categorySchema
      fd.append("schemaId", schemaId);

      // user fields (as before)
      fd.append("userName", "myuser");
      fd.append("userRole", "myuser");
      fd.append("userType", "DRMUser");
      fd.append("userBaseType", "DRMUser");

      fd.append("note", note);

      const res = await bulkCreate(fd); // { requestId, status }

      // store in UI local history
      const entry = {
        requestId: res?.requestId,
        action: "Bulk Create",
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
      setError(e?.message || "Bulk create failed");
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
    !!type &&
    !!categoryId &&
    !!schemaId &&
    !!baseType &&
    !!columnMapping;

  return (
    <div className="container">
      <h1>Bulk Create</h1>
      <div className="subtitle">Upload CSV to create resources in bulk</div>

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

                // reset category+schema when baseType changes
                setCategoryId("");
                setSchemaId("");
              }}
            >
              <option value="LogicalResource">LogicalResource</option>
              <option value="PhysicalResource">PhysicalResource</option>
            </select>
          </div>

          <div className="field">
            {/*  rename + free text */}
            <div className="label">Resource Type *</div>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., Router"
            />
            <div className="help">Type is free text. It will be sent to bulk service as “type”.</div>
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

          {/*  Schema removed as a selector, but show derived info */}
          <div className="field">
            <div className="label">Schema (from Category)</div>
            <input value={schemaLabel} disabled />
            <div className="help">
              We automatically use <b>category.categorySchema</b> as <b>schemaId</b> in the bulk request.
            </div>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Column Mapping</div>
            <input
              value={columnMapping}
              onChange={(e) => setColumnMapping(e.target.value)}
              placeholder="MSISDN,MobileClass"
            />
            <div className="help">Must match the CSV columns your backend expects.</div>
          </div>

          <div className="field">
            <div className="label">Note</div>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="for test" />
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
            <div className="help">
              Expected columns for create: MSISDN,MobileClass (based on your bulk-service)
            </div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button className="btn btn-secondary" type="button" onClick={() => nav("/bulk")}>
            ← Back
          </button>

          <button className="btn btn-primary" type="button" disabled={!canSubmit} onClick={onSubmit}>
            {saving ? "Uploading..." : "Start Bulk Create"}
          </button>
        </div>
      </div>
    </div>
  );
}