import React from "react";
import { useNavigate } from "react-router-dom";
import { listCategories } from "../api/categories";
import { getResourceKpis } from "../api/resources";
import { bulkCreate, bulkUpdate, downloadBulkReport, getBulkRequest, exportResources } from "../api/bulk";

const REFRESH_MS = 60_000;

//resourceStatus, status, lifecycleStatus
function getStatus(r) {
  return (r.resourceStatus || r.status || r.lifecycleStatus || "").toString().toLowerCase();
}

function computeKpis(logicalItems, physicalItems) {
  const all = [...logicalItems, ...physicalItems];
  const generated = all.length;

  const available = all.filter((r) => ["available", "free"].includes(getStatus(r))).length;
  const reserved = all.filter((r) => ["reserved", "hold"].includes(getStatus(r))).length;
  const retired = all.filter((r) => ["retired", "terminated", "inactive"].includes(getStatus(r))).length;

  return { generated, available, reserved, retired };
}

export default function BulkOperationsPage() {
  const nav = useNavigate();

  // KPI
  const [kpi, setKpi] = React.useState({ generated: null, available: null, reserved: null, retired: null });
  const [kpiUpdatedAt, setKpiUpdatedAt] = React.useState(null);

  // Categories (for selecting categoryId + showing category name in history)
  const [categories, setCategories] = React.useState([]);

  // Toast
  const [toast, setToast] = React.useState(null); // {type,message}
  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  // History (UI-only memory history)
  // Because your bulk-service code snippet doesn’t show an endpoint like GET /bulk_requests (list).
  // If you add it later, we can replace this with real server history.
  const [history, setHistory] = React.useState(() => {
    try {
      const raw = localStorage.getItem("bulk_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  React.useEffect(() => {
    localStorage.setItem("bulk_history", JSON.stringify(history));
  }, [history]);

  async function loadCategories() {
    try {
      const res = await listCategories();
      const items = Array.isArray(res) ? res : (res?.items ?? []);
      setCategories(items);
    } catch {
      setCategories([]);
    }
  }

async function loadKpis() {
  try {
    const k = await getResourceKpis();

    // If your backend returns {generated:{total}, available:{total}, ...}
    setKpi({
      generated: k?.generated?.total ?? null,
      available: k?.available?.total ?? null,
      reserved: k?.reserved?.total ?? null,
      retired: k?.retired?.total ?? null,
    });

    setKpiUpdatedAt(k?.updatedAt ? new Date(k.updatedAt) : new Date());
  } catch {
    setKpi({ generated: null, available: null, reserved: null, retired: null });
    setKpiUpdatedAt(null);
  }
}

  React.useEffect(() => {
    loadCategories();
    loadKpis();
    const id = setInterval(loadKpis, REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // Poll request statuses for any "pending"/"processing" in local history
  React.useEffect(() => {
    const hasInProgress = history.some((h) => ["pending", "processing"].includes((h.status || "").toLowerCase()));
    if (!hasInProgress) return;

    const id = setInterval(async () => {
      try {
        const updated = await Promise.all(
          history.map(async (h) => {
            const s = (h.status || "").toLowerCase();
            if (!h.requestId || !["pending", "processing"].includes(s)) return h;

            try {
              const data = await getBulkRequest(h.requestId);
              const req = data?.request;
              if (!req) return h;

              return {
                ...h,
                status: req.status,
                progressPercent: req.progressPercent ?? h.progressPercent,
                totalCount: req.totalCount ?? h.totalCount,
                successCount: req.successCount ?? h.successCount,
                failureCount: req.failureCount ?? h.failureCount,
                updatedAt: req.updatedAt || h.updatedAt,
                createdAt: req.createdAt || h.createdAt,
              };
            } catch {
              return h;
            }
          })
        );
        setHistory(updated);
      } catch {
      
      }
    }, 4000);

    return () => clearInterval(id);
  }, [history]);

  function catLabelById(id) {
    const c = categories.find((x) => (x.id || x._id) === id);
    return c?.name || (id ? `Category ${String(id).slice(0, 6)}...` : "-");
  }

  async function onDownloadReport(requestId) {
    try {
      const blob = await downloadBulkReport(requestId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bulk_report_${requestId}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setToast({ type: "success", message: "Report download started" });
    } catch (e) {
      setToast({ type: "error", message: e.message || "Report not ready" });
    }
  }

  return (
    <div className="container">
      <h1>Dashboard Overview</h1>
      <div className="subtitle">Digital Resource Manager (DRM) Admin Portal</div>

      {toast && (
        <div className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"}`}>
          <div>{toast.message}</div>
          <button className="btn btn-secondary" onClick={() => setToast(null)} type="button">Dismiss</button>
        </div>
      )}

      <div style={{ height: 14 }} />

      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatusCard
          title="Resources Generated"
          value={kpi.generated}
          tone="blue"
          updatedAt={kpiUpdatedAt}
          onRefresh={loadKpis}
        />
        <StatusCard
          title="Resources Available"
          value={kpi.available}
          tone="green"
          updatedAt={kpiUpdatedAt}
          onRefresh={loadKpis}
        />
        <StatusCard
          title="Resources Reserved"
          value={kpi.reserved}
          tone="orange"
          updatedAt={kpiUpdatedAt}
          onRefresh={loadKpis}
        />
        <StatusCard
          title="Resources Retired"
          value={kpi.retired}
          tone="gray"
          updatedAt={kpiUpdatedAt}
          onRefresh={loadKpis}
        />
      </div>

      <div style={{ height: 22 }} />

      {/* Bulk operation buttons */}
      <div className="section-title">Bulk Operations</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <BulkActionCard
          title="Bulk Create"
          subtitle="Create new resources in bulk"
          tone="blue"
          onClick={() => nav("/bulk/create")}
        />
        <BulkActionCard
          title="Bulk Update"
          subtitle="Update existing resources"
          tone="green"
          onClick={() => nav("/bulk/update")}
        />
        <BulkActionCard
          title="Bulk Report"
          subtitle="Generate/export bulk reports"
          tone="purple"
          onClick={() => nav("/bulk/report")}
        />
      </div>

      <div style={{ height: 22 }} />

      <div className="section-title">Bulk Operation History</div>
      <div className="card">
        <div className="subtitle" style={{ marginTop: 0 }}>
          History is currently stored in this browser (localStorage). If you add a backend “list bulk requests” endpoint,
          we’ll switch it to real server history.
        </div>

        <div style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: "14%" }}>Action Type</th>
                <th style={{ width: "18%" }}>Category</th>
                <th style={{ width: "16%" }}>Status</th>
                <th style={{ width: "18%" }}>Date</th>
                <th style={{ width: "10%" }}>Total</th>
                <th style={{ width: "10%" }}>Successful</th>
                <th style={{ width: "8%" }}>Failed</th>
                <th style={{ width: "6%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.requestId}>
                  <td>{h.action}</td>
                  <td>
                    <span className="badge badge-blue">{catLabelById(h.categoryId)}</span>
                  </td>
                  <td>
                    <StatusBadge status={h.status} progress={h.progressPercent} />
                  </td>
                  <td className="help">{formatDateTime(h.createdAt || h.date)}</td>
                  <td style={{ fontWeight: 900 }}>{formatNum(h.totalCount)}</td>
                  <td style={{ color: "#16a34a", fontWeight: 900 }}>{formatNum(h.successCount)}</td>
                  <td style={{ color: "#dc2626", fontWeight: 900 }}>{formatNum(h.failureCount)}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button className="iconBtn" title="Download report" type="button" onClick={() => onDownloadReport(h.requestId)}>
                        ⬇
                      </button>
                      <button className="iconBtn" title="View details" type="button" onClick={() => nav(`/bulk/${h.requestId}`)}>
                        👁
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {history.length === 0 && (
                <tr>
                  <td colSpan={8} className="help" style={{ padding: 16 }}>
                    No bulk history yet. Run Bulk Create / Update / Report to see entries here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {history.length > 0 && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  if (!confirm("Clear bulk history stored in this browser?")) return;
                  setHistory([]);
                }}
              >
                Clear History
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------ small components ------------------ */

function StatusCard({ title, value, tone, updatedAt, onRefresh }) {
  const theme = {
    blue: { color: "#1d4ed8", border: "rgba(37,99,235,0.35)", bg: "rgba(37,99,235,0.08)" },
    green: { color: "#16a34a", border: "rgba(22,163,74,0.35)", bg: "rgba(22,163,74,0.08)" },
    orange: { color: "#ea580c", border: "rgba(234,88,12,0.35)", bg: "rgba(234,88,12,0.08)" },
    gray: { color: "#334155", border: "rgba(51,65,85,0.25)", bg: "rgba(148,163,184,0.10)" },
  }[tone];

  return (
    <div className="card" style={{ boxShadow: "none", borderColor: theme.border, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 13, color: "var(--muted)", fontWeight: 900 }}>{title}</div>
        <button className="iconBtn" title="Refresh" type="button" onClick={onRefresh}>⟳</button>
      </div>

      <div style={{ fontSize: 32, fontWeight: 900, color: theme.color, marginTop: 10 }}>
        {value === null ? "—" : formatNum(value)}
      </div>

      <div className="help" style={{ marginTop: 6 }}>
        Last updated: {updatedAt ? updatedAt.toLocaleTimeString() : "—"}
      </div>
    </div>
  );
}

function BulkActionCard({ title, subtitle, tone, onClick }) {
  const styles = {
    blue: { bg: "#1d4ed8" },
    green: { bg: "#16a34a" },
    purple: { bg: "#7c3aed" },
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: 14,
        padding: 18,
        color: "#fff",
        background: styles.bg,
        cursor: "pointer",
        textAlign: "center",
        minHeight: 86,
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontWeight: 900, fontSize: 16 }}>{title}</div>
      <div style={{ opacity: 0.9, fontSize: 12 }}>{subtitle}</div>
    </button>
  );
}

function StatusBadge({ status, progress }) {
  const s = (status || "").toLowerCase();
  if (s === "completed") return <span className="badge badge-green">Completed</span>;
  if (s === "failed") return <span className="badge badge-gray" style={{ borderColor: "#fecaca", background: "#fef2f2", color: "#991b1b" }}>Failed</span>;
  if (s === "processing" || s === "pending") {
    const pct = typeof progress === "number" ? progress : null;
    return (
      <span className="badge badge-blue">
        In Progress{pct !== null ? ` (${pct}%)` : ""}
      </span>
    );
  }
  return <span className="badge badge-gray">{status || "—"}</span>;
}

function formatNum(n) {
  if (n === null || n === undefined) return "—";
  try {
    return Number(n).toLocaleString();
  } catch {
    return String(n);
  }
}

function formatDateTime(d) {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return dt.toLocaleString();
}