import React from "react";
import { useNavigate } from "react-router-dom";
import { exportResources } from "../api/bulk";

const PREVIEW_MAX_ROWS = 200;

export default function BulkReportPage() {
  const nav = useNavigate();

  const [baseType, setBaseType] = React.useState("LogicalResource");

  //  user types fields (not fixed/hardcoded)
  const [fields, setFields] = React.useState("");

  //  allow single OR multiple "type" values (comma-separated)
  const [type, setType] = React.useState("");

  //  allow single OR multiple "value" values (comma-separated)
  // This will be converted into valueFrom/valueTo if one value,
  // or multiple exports (one per value) if many values.
  const [values, setValues] = React.useState("");

  const [limit, setLimit] = React.useState(1000);
  const [resourceStatus, setResourceStatus] = React.useState("");

  // optional range (still supported)
  const [valueFrom, setValueFrom] = React.useState("");
  const [valueTo, setValueTo] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Preview state
  const [csvText, setCsvText] = React.useState("");
  const [csvHeader, setCsvHeader] = React.useState([]);
  const [csvRows, setCsvRows] = React.useState([]);

  function clearPreview() {
    setCsvText("");
    setCsvHeader([]);
    setCsvRows([]);
  }

  async function onExportPreview() {
    setLoading(true);
    setError(null);
    clearPreview();

    try {
      // Read from UI input exactly; split multiple values by comma/newline/space
      const typeList = splitList(type);     // e.g. "Router,SIM" -> ["Router","SIM"]
      const valueList = splitList(values);  // e.g. "8007...,8008..." -> ["8007...","8008..."]

      // If user provided multiple values, backend doesn't support "values=..."
      // So we do multiple export calls and merge CSV results in UI preview.
      const multiValueMode = valueList.length > 1;

      // If user provided single value, we can map it to valueFrom=valueTo for exact match
      const singleValue = valueList.length === 1 ? valueList[0] : "";

      // If user left fields empty, backend defaults to "value".
      // We send exactly what user typed (could be empty).
      const fieldsParam = fields.trim();

      // Build base params used by all calls
      const baseParams = {
        baseType,
        limit: String(limit || 1000),
        ...(fieldsParam ? { fields: fieldsParam } : {}),
        ...(resourceStatus ? { resourceStatus } : {}),
      };

      // Decide query for value:
      // - multi value: do multiple requests each with valueFrom=valueTo=thatValue
      // - single value: valueFrom=valueTo
      // - none: use valueFrom/valueTo range if provided
      const buildValueParams = (v) => {
        if (v) return { valueFrom: v, valueTo: v };
        if (valueFrom || valueTo) return { ...(valueFrom ? { valueFrom } : {}), ...(valueTo ? { valueTo } : {}) };
        return {};
      };

      // Decide query for type:
      // backend supports only single "type", so:
      // - if multiple types: run multiple requests and merge results
      // - if single type: send it
      const typeModeMulti = typeList.length > 1;

      const tasks = [];

      // create combinations:
      // - types: 0/1/many
      // - values: 0/1/many
      const typesToRun = typeModeMulti ? typeList : [typeList[0] || ""];
      const valuesToRun = multiValueMode ? valueList : [""]; // "" means use range or none; singleValue handled below

      for (const t of typesToRun) {
        if (multiValueMode) {
          for (const v of valuesToRun) {
            tasks.push({ ...(t ? { type: t } : {}), ...buildValueParams(v) });
          }
        } else {
          // singleValue mode or range mode
          const vParams = singleValue ? { valueFrom: singleValue, valueTo: singleValue } : buildValueParams("");
          tasks.push({ ...(t ? { type: t } : {}), ...vParams });
        }
      }

      // Run exports sequentially to keep order stable and avoid huge concurrency
      const csvParts = [];
      let finalHeader = null;

      for (const extra of tasks) {
        const params = { ...baseParams, ...extra };
        const blob = await exportResources(params);
        const text = await blob.text();

        const parsed = parseCsvSimple(text);

        // If response is empty, skip
        if (!parsed.header.length) continue;

        // Keep the first header, and then append only rows from subsequent responses
        if (!finalHeader) {
          finalHeader = parsed.header;
          csvParts.push(parsed.header.join(","));
        }

        // If header differs (different fields), we still append rows (best effort).
        // (Better approach would be separate previews per task.)
        for (const row of parsed.rows) {
          csvParts.push(row.join(","));
        }
      }

      const mergedCsv = csvParts.join("\n");
      const mergedParsed = parseCsvSimple(mergedCsv);

      setCsvText(mergedCsv);
      setCsvHeader(mergedParsed.header);
      setCsvRows(mergedParsed.rows.slice(0, PREVIEW_MAX_ROWS));
    } catch (e) {
      setError(e.message || "Export failed");
    } finally {
      setLoading(false);
    }
  }

  function onDownloadCsv() {
    if (!csvText) return;
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resource_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const hasPreview = !!csvText || csvRows.length > 0;

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
            <div className="label">Type(s) (optional)</div>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              placeholder="e.g., Router   OR   Router,SIM"
            />
            <div className="help">You can enter multiple types separated by comma.</div>
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <div className="label">Resource Status (optional)</div>
            <input
              value={resourceStatus}
              onChange={(e) => setResourceStatus(e.target.value)}
              placeholder="e.g., Available"
            />
          </div>

          <div className="field">
            <div className="label">Limit</div>
            <input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} />
          </div>
        </div>

        {/*  Single OR multiple values */}
        <div className="field">
          <div className="label">Value(s) (optional)</div>
          <input
            value={values}
            onChange={(e) => setValues(e.target.value)}
            placeholder="e.g., 800700000   OR   800700000,800700001,800700002"
          />
          <div className="help">
            If you enter multiple values, the UI will export multiple times and merge results in the preview.
          </div>
        </div>

        {/* Range still supported */}
        <div className="row2">
          <div className="field">
            <div className="label">Value From (optional)</div>
            <input value={valueFrom} onChange={(e) => setValueFrom(e.target.value)} placeholder="Start value" />
          </div>
          <div className="field">
            <div className="label">Value To (optional)</div>
            <input value={valueTo} onChange={(e) => setValueTo(e.target.value)} placeholder="End value" />
          </div>
        </div>

        {/*  Fields read from UI input (not fixed) */}
        <div className="field">
          <div className="label">Fields (comma-separated)</div>
          <input
            value={fields}
            onChange={(e) => setFields(e.target.value)}
            placeholder="e.g., value,name,baseType"
          />
          <div className="help">
            Type any fields you want. Example: value,name,baseType,category,type,resourceStatus
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
          <button className="btn btn-secondary" type="button" onClick={() => nav("/bulk")}>
            ← Back
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" type="button" onClick={clearPreview} disabled={loading || !hasPreview}>
              Clear
            </button>

            {/*  allow export even if fields is empty (backend defaults to value) */}
            <button className="btn btn-primary" type="button" disabled={loading} onClick={onExportPreview}>
              {loading ? "Exporting..." : "Export & Preview"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 16 }} />

      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div className="section-title" style={{ marginBottom: 0 }}>Preview</div>
            <div className="subtitle" style={{ marginTop: 6 }}>
              {csvRows.length > 0
                ? `Showing ${csvRows.length} row(s) (max ${PREVIEW_MAX_ROWS})`
                : "No data loaded yet. Click “Export & Preview”."}
            </div>
          </div>

          <button className="btn btn-primary" type="button" onClick={onDownloadCsv} disabled={!csvText}>
            Download CSV
          </button>
        </div>

        <div style={{ height: 12 }} />

        {csvHeader.length > 0 ? (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  {csvHeader.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {csvRows.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, j) => (
                      <td key={j} className="help">{cell}</td>
                    ))}
                  </tr>
                ))}
                {csvRows.length === 0 && (
                  <tr>
                    <td colSpan={csvHeader.length} className="help" style={{ padding: 16 }}>
                      CSV returned only header (no rows).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="help">No preview available.</div>
        )}
      </div>
    </div>
  );
}

/**
 * Split user input into list of tokens.
 * Accepts comma, newline, semicolon, or spaces.
 */
function splitList(s) {
  return String(s || "")
    .split(/[\n,; ]+/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

/**
 * Simple CSV parser good enough for your export format.
 * Assumes:
 * - comma separator
 * - no embedded commas inside quoted fields
 */
function parseCsvSimple(text) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return { header: [], rows: [] };

  const header = lines[0].split(",").map((x) => x.trim());
  const rows = lines.slice(1).map((line) => line.split(",").map((x) => x.trim()));

  return { header, rows };
}