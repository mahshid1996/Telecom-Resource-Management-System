import React from "react";
import { useNavigate } from "react-router-dom";
import { exportResources } from "../api/bulk";

export default function BulkReportPage() {
  const nav = useNavigate();
  const [baseType, setBaseType] = React.useState("LogicalResource");
  const [type, setType] = React.useState("");
  const [limit, setLimit] = React.useState(1000);
  const [fields, setFields] = React.useState("value,name,baseType,type");
  const [resourceStatus, setResourceStatus] = React.useState("");
  const [valueFrom, setValueFrom] = React.useState("");
  const [valueTo, setValueTo] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  async function onExport() {
    setLoading(true);
    setError(null);
    try {
      const params = {
        baseType,
        limit: String(limit || 1000),
        fields,
        ...(type ? { type } : {}),
        ...(resourceStatus ? { resourceStatus } : {}),
        ...(valueFrom ? { valueFrom } : {}),
        ...(valueTo ? { valueTo } : {}),
      };

      const blob = await exportResources(params);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resource_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      nav("/bulk", { replace: true });
    } catch (e) {
      setError(e.message || "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>Bulk Report</h1>
      <div className="subtitle">Export resources as CSV from inventory collections</div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card" style={{ marginTop: 16 }}>
        <div className="row2">
          <div className="field">
            <div className="label">Base Type *</div>
            <select value={baseType} onChange={(e) => setBaseType(e.target.value)}>
              <option value="LogicalResource">LogicalResource</option>
              <option value="PhysicalResource">PhysicalResource</option>
            </select>
          </div>

          <div className="field">
            <div className="label">Type (optional)</div>
            <input value={type} onChange={(e) => setType(e.target.value)} placeholder="e.g., Router" />
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Resource Status (optional)</div>
            <input value={resourceStatus} onChange={(e) => setResourceStatus(e.target.value)} placeholder="e.g., Available" />
          </div>

          <div className="field">
            <div className="label">Limit</div>
            <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Value From (optional)</div>
            <input value={valueFrom} onChange={(e) => setValueFrom(e.target.value)} />
          </div>
          <div className="field">
            <div className="label">Value To (optional)</div>
            <input value={valueTo} onChange={(e) => setValueTo(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <div className="label">Fields (comma-separated)</div>
          <input value={fields} onChange={(e) => setFields(e.target.value)} />
          <div className="help">Example: value,name,baseType,category,type,resourceStatus</div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button className="btn btn-secondary" type="button" onClick={() => nav("/bulk")}>← Back</button>
          <button className="btn btn-primary" type="button" disabled={loading || !fields} onClick={onExport}>
            {loading ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>
    </div>
  );
}