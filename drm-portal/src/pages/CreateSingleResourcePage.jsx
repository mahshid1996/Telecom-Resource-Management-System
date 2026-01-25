import React from "react";
import { listCategories } from "../api/categories";
import {
  createLogicalResource,
  createPhysicalResource,
  listLogicalResources,
  listPhysicalResources,
  searchLogicalResources,
  searchPhysicalResources,
} from "../api/resources";

const REFRESH_MS = 5 * 60 * 1000;

export default function CreateSingleResourcePage() {
  const [activeTab, setActiveTab] = React.useState("create"); // "create" | "search"

  // KPI
  const [logicalCount, setLogicalCount] = React.useState(null);
  const [physicalCount, setPhysicalCount] = React.useState(null);

  // Toast
  const [toast, setToast] = React.useState(null); // {type,message}

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);


  
async function loadCounts() {
  try {
    const [l, p] = await Promise.all([listLogicalResources(), listPhysicalResources()]);

    const logicalItems = Array.isArray(l) ? l : (l?.items ?? []);
    const physicalItems = Array.isArray(p) ? p : (p?.items ?? []);

    setLogicalCount(logicalItems.length);
    setPhysicalCount(physicalItems.length);
  } catch (e) {
    setLogicalCount(null);
    setPhysicalCount(null);
  }
}

  React.useEffect(() => {
    loadCounts();
    const id = setInterval(loadCounts, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="container">
      {/* Header row + KPI cards */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <h1>Create Single Resource</h1>
          <div className="subtitle">Create and manage logical and physical resources</div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <KpiCard title="Logical Resources" value={logicalCount} tone="blue" />
          <KpiCard title="Physical Resources" value={physicalCount} tone="purple" />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: 18, borderBottom: "1px solid var(--border)", display: "flex", gap: 18 }}>
        <Tab label="Create Resource" active={activeTab === "create"} onClick={() => setActiveTab("create")} />
        <Tab label="Search Resource" active={activeTab === "search"} onClick={() => setActiveTab("search")} />
      </div>

      {toast && (
        <div className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          <div>{toast.message}</div>
          <button className="btn btn-secondary" onClick={() => setToast(null)}>Dismiss</button>
        </div>
      )}

      <div style={{ height: 16 }} />

      {activeTab === "create" ? (
        <CreateTab setToast={setToast} />
      ) : (
        <SearchTab setToast={setToast} />
      )}
    </div>
  );
}

/* -------------------- CREATE TAB -------------------- */

function CreateTab({ setToast }) {
  const [step, setStep] = React.useState(1);
  const [resourceType, setResourceType] = React.useState("logicalResource");

  const [categories, setCategories] = React.useState([]);
  const [categoryId, setCategoryId] = React.useState("");

  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [value, setValue] = React.useState("");
  const [businessType, setBusinessType] = React.useState("Postpaid");
  const [isBundle, setIsBundle] = React.useState(false);
  const [msisdn, setMsisdn] = React.useState("");

  const [saving, setSaving] = React.useState(false);

  async function onContinueToCategories() {
    try {
      const all = await listCategories();
      setCategories(all);
      setStep(2);
    } catch (e) {
      setToast({ type: "error", message: e.message || "Failed to load categories" });
    }
  }

  const filtered = categories.filter((c) => c.realizingResourceType === resourceType);

  async function onCreate() {
    setSaving(true);
    try {
      const payload = {
        name,
        type,
        description,
        value,
        isBundle,
        businessType: businessType.split(",").map((x) => x.trim()).filter(Boolean),
        category: [categoryId],
        note: [{ authorRole: "myuser", author: "myuser", date: new Date().toISOString(), text: "from UI" }],
        relatedParty: [{ name: "myuser", role: "myuser", type: "Myuser", baseType: "DRMUser" }],
        resourceCharacteristic: [
          ...(msisdn
            ? [{ publicIdentifier: true, code: "MSISDN", name: "Mobile number", value: msisdn, valueType: "number" }]
            : []),
        ],
        resourceRelationship: [],
        bundledResources: [],
      };

      const res =
        resourceType === "logicalResource"
          ? await createLogicalResource(payload)
          : await createPhysicalResource(payload);

      setToast({ type: "success", message: `Resource created successfully (id: ${res?.id || "N/A"})` });
    } catch (e) {
      setToast({ type: "error", message: e.message || "Create failed" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Step 1: Select Resource Type *</div>
        <div className="subtitle" style={{ marginBottom: 12 }}>Choose the type of resource you want to create</div>

        <div className="pills">
          <button className={`pill ${resourceType === "logicalResource" ? "active" : ""}`} onClick={() => setResourceType("logicalResource")} type="button">
            Logical Resource
          </button>
          <button className={`pill ${resourceType === "physicalResource" ? "active" : ""}`} onClick={() => setResourceType("physicalResource")} type="button">
            Physical Resource
          </button>
        </div>

        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" onClick={onContinueToCategories} type="button">
            Continue to Category Selection
          </button>
        </div>
      </div>

      {step >= 2 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="section-title">Step 2: Select Category *</div>
          <div className="subtitle" style={{ marginBottom: 12 }}>
            Categories are filtered based on selected resource type ({resourceType})
          </div>

          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select a category</option>
            {filtered.map((c) => (
              <option key={c.id || c._id} value={c.id || c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <div style={{ marginTop: 14 }}>
            <button className="btn btn-primary" disabled={!categoryId} onClick={() => setStep(3)} type="button">
              Continue
            </button>
          </div>
        </div>
      )}

      {step >= 3 && (
        <div className="card">
          <div className="section-title">Base Information</div>

          <div className="row2">
            <div className="field">
              <div className="label">Name *</div>
              <input placeholder="Resource name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">Type *</div>
              <input placeholder="Resource type" value={type} onChange={(e) => setType(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <div className="label">Description</div>
            <textarea placeholder="Resource description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="row2">
            <div className="field">
              <div className="label">Value (Indexed) *</div>
              <input placeholder="Main indexed value (e.g., MSISDN)" value={value} onChange={(e) => setValue(e.target.value)} />
              <div className="help">This value is used for DB lookup and indexing</div>
            </div>
            <div className="field">
              <div className="label">Business Type</div>
              <input placeholder="Comma-separated (e.g., prepaid, postpaid)" value={businessType} onChange={(e) => setBusinessType(e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label className="help" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input type="checkbox" checked={isBundle} onChange={(e) => setIsBundle(e.target.checked)} style={{ width: 16, height: 16 }} />
              Is Bundle
            </label>
          </div>

          <div className="section-title" style={{ marginTop: 10 }}>Resource Characteristics</div>
          <div className="field">
            <div className="label">MSISDN</div>
            <input placeholder="MSISDN" value={msisdn} onChange={(e) => setMsisdn(e.target.value)} />
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)} type="button">Cancel</button>
            <button className="btn btn-primary" onClick={onCreate} disabled={saving || !name || !type || !value || !categoryId} type="button">
              {saving ? "Creating..." : "Create Resource"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* -------------------- SEARCH TAB -------------------- */

function SearchTab({ setToast }) {
  const [resourceType, setResourceType] = React.useState("logicalResource");

  const [activeMethod, setActiveMethod] = React.useState(null); // "id" | "value" | "regex" | "range"

  const [qId, setQId] = React.useState("");
  const [qValue, setQValue] = React.useState("");
  const [qRegex, setQRegex] = React.useState("");
  const [rangeFrom, setRangeFrom] = React.useState("");
  const [rangeTo, setRangeTo] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [results, setResults] = React.useState([]);

  function clearSearch() {
    setActiveMethod(null);
    setQId(""); setQValue(""); setQRegex(""); setRangeFrom(""); setRangeTo("");
    setResults([]);
  }

  async function doSearch(params) {
    setLoading(true);
    setToast(null);
    try {
      const res =
        resourceType === "logicalResource"
          ? await searchLogicalResources(params)
          : await searchPhysicalResources(params);

      // backend might return array, or {items:[...]}
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      setResults(items);

      setToast({ type: "success", message: `Found ${items.length} result(s)` });
    } catch (e) {
      setToast({ type: "error", message: e.message || "Search failed" });
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="section-title">Resource Type *</div>
        <div className="pills">
          <button className={`pill ${resourceType === "logicalResource" ? "active" : ""}`} onClick={() => { setResourceType("logicalResource"); clearSearch(); }} type="button">
            Logical Resource
          </button>
          <button className={`pill ${resourceType === "physicalResource" ? "active" : ""}`} onClick={() => { setResourceType("physicalResource"); clearSearch(); }} type="button">
            Physical Resource
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div className="section-title" style={{ margin: 0 }}>Select Search Method *</div>
          {activeMethod && (
            <button className="btn btn-secondary" onClick={clearSearch} type="button">
              Clear Search
            </button>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <MethodCard title="By ID" subtitle="Search by resource ID" active={activeMethod === "id"} onClick={() => setActiveMethod("id")} />
          <MethodCard title="By Value" subtitle="Search by indexed value" active={activeMethod === "value"} onClick={() => setActiveMethod("value")} />
          <MethodCard title="By Regex" subtitle="Pattern matching" active={activeMethod === "regex"} onClick={() => setActiveMethod("regex")} />
          <MethodCard title="By Range" subtitle="Numeric/date range" active={activeMethod === "range"} onClick={() => setActiveMethod("range")} />
        </div>
      </div>

      {activeMethod === "id" && (
        <SearchBox
          title="Search by Resource ID"
          placeholder="Enter resource ID"
          value={qId}
          onChange={setQId}
          onSearch={() => doSearch({ mode: "id", q: qId })}
          loading={loading}
          disabled={!qId}
          buttonText="Search"
        />
      )}

      {activeMethod === "value" && (
        <SearchBox
          title="Search by Indexed Value"
          placeholder="Enter indexed value (e.g., MSISDN, ICCID)"
          value={qValue}
          onChange={setQValue}
          onSearch={() => doSearch({ mode: "value", q: qValue })}
          loading={loading}
          disabled={!qValue}
          buttonText="Search"
        />
      )}

      {activeMethod === "regex" && (
        <SearchBox
          title="Search by Regex Pattern"
          placeholder="Enter regex pattern (e.g., ^[0-9]{10}$)"
          value={qRegex}
          onChange={setQRegex}
          onSearch={() => doSearch({ mode: "regex", q: qRegex })}
          loading={loading}
          disabled={!qRegex}
          buttonText="Search"
          help="Use regex to match patterns in resource values"
          monospace
        />
      )}

      {activeMethod === "range" && (
        <div className="card" style={{ border: "1px solid rgba(37,99,235,0.45)" }}>
          <div className="section-title">Search by Range</div>

          <div className="row2">
            <div className="field">
              <div className="label">From</div>
              <input placeholder="Start value" value={rangeFrom} onChange={(e) => setRangeFrom(e.target.value)} />
            </div>
            <div className="field">
              <div className="label">To</div>
              <input placeholder="End value" value={rangeTo} onChange={(e) => setRangeTo(e.target.value)} />
            </div>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center" }}
            onClick={() => doSearch({ mode: "range", from: rangeFrom, to: rangeTo })}
            disabled={loading || !rangeFrom || !rangeTo}
            type="button"
          >
            {loading ? "Searching..." : "Search Range"}
          </button>

          <div className="help" style={{ marginTop: 10 }}>
            Search for resources within a numeric or date range
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="section-title">Results</div>
          <div className="subtitle" style={{ marginBottom: 10 }}>Showing {results.length} item(s)</div>

          <div style={{ display: "grid", gap: 10 }}>
            {results.map((r) => (
              <div
                key={r.id || r._id}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 12,
                  background: "#fff",
                  display: "grid",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ fontWeight: 900 }}>{r.name || "Unnamed Resource"}</div>
                  <div className="help">id: {r.id || r._id}</div>
                </div>
                <div className="help">value: {r.value || "-"}</div>
                <div className="help">type: {r.type || "-"} | status: {r.resourceStatus || "-"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function MethodCard({ title, subtitle, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: "left",
        borderRadius: 12,
        padding: 14,
        border: active ? "1px solid rgba(37,99,235,0.75)" : "1px solid var(--border)",
        background: active ? "var(--primarySoft)" : "#fff",
        boxShadow: active ? "0 10px 24px rgba(37,99,235,0.12)" : "none",
        cursor: "pointer",
        opacity: !active ? 0.85 : 1,
      }}
    >
      <div style={{ fontWeight: 900 }}>{title}</div>
      <div className="help">{subtitle}</div>
    </button>
  );
}

function SearchBox({ title, placeholder, value, onChange, onSearch, loading, disabled, buttonText, help, monospace }) {
  return (
    <div className="card" style={{ border: "1px solid rgba(37,99,235,0.45)" }}>
      <div className="section-title">{title}</div>

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={monospace ? { fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" } : undefined}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled && !loading) onSearch();
          }}
        />
        <button className="btn btn-primary" onClick={onSearch} disabled={loading || disabled} type="button">
          {loading ? "Searching..." : buttonText}
        </button>
      </div>

      {help && <div className="help" style={{ marginTop: 10 }}>{help}</div>}
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        padding: "10px 2px",
        fontWeight: 900,
        cursor: "pointer",
        color: active ? "var(--primary)" : "var(--muted)",
        borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent",
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

function KpiCard({ title, value, tone }) {
  const border = tone === "purple" ? "rgba(168, 85, 247, 0.35)" : "rgba(37, 99, 235, 0.35)";
  const bg = tone === "purple" ? "rgba(168, 85, 247, 0.08)" : "rgba(37, 99, 235, 0.08)";
  const color = tone === "purple" ? "#7c3aed" : "#1d4ed8";

  return (
    <div
      style={{
        minWidth: 150,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 12, color }}>{title}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color }}>
        {value === null ? "—" : String(value)}
      </div>
    </div>
  );
}