import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Cloud,
  Database,
  RefreshCw,
  Save,
  Search,
  Shield,
  Terminal,
  Trash2,
  Wallet,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import {
  formatCurrency,
  formatNumber,
  isAdminEmailAllowed,
  PROJECT_ADMIN_EMAILS,
  usageDashboard,
} from "./AdminConsole.logic.mjs";
import "../styles/admin.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://44.201.62.0:8000";
const FALLBACK_ADMIN_EMAILS = PROJECT_ADMIN_EMAILS.join(",");

function adminEmails() {
  return (import.meta.env.VITE_ADMIN_EMAILS || FALLBACK_ADMIN_EMAILS)
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function emptyEssay() {
  return {
    topic: "",
    content: "",
    type: "Personal Statement",
    school: "none",
    public: false,
    source_file: "",
    metadata: null,
  };
}

const NAV_ITEMS = [
  ["overview", "Overview", Activity],
  ["essays", "Essays", BookOpen],
  ["usage", "Usage", BarChart3],
  ["logs", "Logs", Cloud],
  ["audit", "Audit", ClipboardList],
];

export default function AdminConsole() {
  const { user } = useAuth();
  const googleSignIn = useGoogleSignIn();
  const [tab, setTab] = useState("overview");
  const [adminState, setAdminState] = useState({ loading: true, error: "", profile: null });
  const [overview, setOverview] = useState(null);
  const [essays, setEssays] = useState({ items: [], total: 0, page: 1, page_size: 50 });
  const [filters, setFilters] = useState({ search: "", school: "", embedding_status: "", include_deleted: false });
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [editor, setEditor] = useState(emptyEssay());
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState({ items: [], error: "", configured: false });
  const [audit, setAudit] = useState([]);
  const [message, setMessage] = useState("");

  const email = user?.email?.toLowerCase();
  const configuredEmails = adminEmails();
  const locallyAllowed = isAdminEmailAllowed(email, configuredEmails);

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      "X-Admin-Email": email || "",
    }),
    [email]
  );

  const api = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 404 && path.startsWith("/admin")) {
        throw new Error("Admin API is not deployed on the AWS backend yet.");
      }
      throw new Error(data.detail || "Admin request failed");
    }
    return data;
  }, [headers]);

  async function loadOverview() {
    setOverview(await api("/admin/overview"));
  }

  async function loadEssays(page = 1) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(essays.page_size || 50),
    });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== false) params.set(key, String(value));
    });
    const data = await api(`/admin/essays?${params.toString()}`);
    setEssays(data);
  }

  async function loadEssayDetail(id) {
    const data = await api(`/admin/essays/${id}`);
    setSelectedEssay(data);
    setEditor({
      topic: data.essay.topic || "",
      content: data.essay.content || "",
      type: data.essay.type || "",
      school: data.essay.school || "",
      public: Boolean(data.essay.public),
      source_file: data.essay.source_file || "",
      metadata: data.essay.metadata || null,
    });
  }

  async function loadUsage() {
    setUsage(await api("/admin/openai/usage"));
  }

  async function loadLogs() {
    const data = await api("/admin/logs?start_minutes_ago=240&limit=100");
    setLogs({ items: data.items || [], error: data.error || "", configured: Boolean(data.configured) });
  }

  async function loadAudit() {
    const data = await api("/admin/audit?limit=50");
    setAudit(data.items || []);
  }

  async function refreshCurrent() {
    setMessage("");
    try {
      if (tab === "overview") await loadOverview();
      if (tab === "essays") await loadEssays(essays.page || 1);
      if (tab === "usage") await loadUsage();
      if (tab === "logs") await loadLogs();
      if (tab === "audit") await loadAudit();
      setMessage("Updated");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function saveEssay() {
    const path = selectedEssay?.essay?.id ? `/admin/essays/${selectedEssay.essay.id}` : "/admin/essays";
    const method = selectedEssay?.essay?.id ? "PATCH" : "POST";
    const data = await api(path, { method, body: JSON.stringify(editor) });
    setSelectedEssay({ essay: data.essay, audit: selectedEssay?.audit || [] });
    await loadEssays(essays.page || 1);
    await loadOverview();
    setMessage("Essay saved");
  }

  async function deleteEssay() {
    if (!selectedEssay?.essay?.id) return;
    const confirmed = window.confirm("Soft delete this essay?");
    if (!confirmed) return;
    const data = await api(`/admin/essays/${selectedEssay.essay.id}`, { method: "DELETE" });
    setSelectedEssay({ essay: data.essay, audit: selectedEssay.audit || [] });
    await loadEssays(essays.page || 1);
    await loadOverview();
    setMessage("Essay soft deleted");
  }

  async function queueEmbedding() {
    if (!selectedEssay?.essay?.id) return;
    const data = await api(`/admin/essays/${selectedEssay.essay.id}/regenerate-embedding`, { method: "POST" });
    setSelectedEssay({ essay: data.essay, audit: selectedEssay.audit || [] });
    await loadEssays(essays.page || 1);
    await loadOverview();
    setMessage("Embedding regeneration queued");
  }

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      await Promise.resolve();
      if (cancelled) return;
      if (!email) {
        setAdminState({ loading: false, error: "Sign in with an allowlisted developer account.", profile: null });
        return;
      }
      if (!locallyAllowed) {
        setAdminState({ loading: false, error: "This Google account is not in VITE_ADMIN_EMAILS.", profile: null });
        return;
      }
      try {
        const profile = await api("/admin/me");
        if (!cancelled) setAdminState({ loading: false, error: "", profile });
      } catch (error) {
        if (!cancelled) setAdminState({ loading: false, error: error.message, profile: null });
      }
    }

    checkAccess();
    return () => {
      cancelled = true;
    };
  }, [api, email, locallyAllowed]);

  useEffect(() => {
    if (!adminState.profile) return;
    let cancelled = false;

    async function loadTab() {
      try {
        if (tab === "overview") {
          const data = await api("/admin/overview");
          if (!cancelled) setOverview(data);
        }
        if (tab === "essays") {
          const data = await api(`/admin/essays?page=1&page_size=${essays.page_size || 50}`);
          if (!cancelled) setEssays(data);
        }
        if (tab === "usage") {
          const data = await api("/admin/openai/usage");
          if (!cancelled) setUsage(data);
        }
        if (tab === "logs") {
          const data = await api("/admin/logs?start_minutes_ago=240&limit=100");
          if (!cancelled) setLogs({ items: data.items || [], error: data.error || "", configured: Boolean(data.configured) });
        }
        if (tab === "audit") {
          const data = await api("/admin/audit?limit=50");
          if (!cancelled) setAudit(data.items || []);
        }
      } catch (error) {
        if (!cancelled) setMessage(error.message);
      }
    }

    loadTab();
    return () => {
      cancelled = true;
    };
  }, [adminState.profile, api, essays.page_size, tab]);

  if (adminState.loading) {
    return <main className="admin-shell admin-loading">Loading admin access...</main>;
  }

  if (adminState.error) {
    return (
      <main className="admin-shell admin-denied">
        <Shield size={36} />
        <h1>Admin access required</h1>
        <p>{adminState.error}</p>
        {!email && (
          <button className="admin-icon-button" onClick={googleSignIn}>
            Sign in with Google
          </button>
        )}
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">EA</div>
          <div>
            <strong>Essay Ops</strong>
            <span>Developer console</span>
          </div>
        </div>
        <nav className="admin-nav" aria-label="Admin sections">
          {NAV_ITEMS.map(([id, label, Icon]) => (
            <button key={id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}>
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <span>API</span>
          <strong>{API_BASE.replace(/^https?:\/\//, "")}</strong>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Developer Operations</p>
            <h1>{NAV_ITEMS.find(([id]) => id === tab)?.[1] || "Admin Console"}</h1>
            <span>{adminState.profile.email}</span>
          </div>
          <button className="admin-icon-button" onClick={refreshCurrent} title="Refresh" aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
        </header>

        {message && <div className="admin-message">{message}</div>}
        {tab === "overview" && <Overview overview={overview} />}
        {tab === "essays" && (
          <Essays
            essays={essays}
            filters={filters}
            setFilters={setFilters}
            loadEssays={loadEssays}
            selectedEssay={selectedEssay}
            loadEssayDetail={loadEssayDetail}
            editor={editor}
            setEditor={setEditor}
            saveEssay={saveEssay}
            deleteEssay={deleteEssay}
            queueEmbedding={queueEmbedding}
            newEssay={() => {
              setSelectedEssay(null);
              setEditor(emptyEssay());
            }}
          />
        )}
        {tab === "usage" && <Usage usage={usage} />}
        {tab === "logs" && <Logs logs={logs} />}
        {tab === "audit" && <Audit audit={audit} />}
      </section>
    </main>
  );
}

function Overview({ overview }) {
  if (!overview) return null;
  const cards = [
    ["Essays", overview.counts.essays, BookOpen],
    ["Deleted", overview.counts.deleted_essays, Trash2],
    ["Users", overview.counts.users, Shield],
    ["Stale embeddings", overview.counts.stale_embeddings, Database],
  ];
  return (
    <section className="admin-grid">
      {cards.map(([label, value, Icon]) => (
        <MetricCard key={label} label={label} value={formatNumber(value)} icon={Icon} />
      ))}
      <div className="admin-panel wide">
        <PanelHeader title="Integrations" />
        <div className="admin-integration-grid">
          {Object.entries(overview.integrations || {}).map(([name, detail]) => (
            <IntegrationCard key={name} name={name} detail={detail} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Essays(props) {
  const {
    essays,
    filters,
    setFilters,
    loadEssays,
    selectedEssay,
    loadEssayDetail,
    editor,
    setEditor,
    saveEssay,
    deleteEssay,
    queueEmbedding,
    newEssay,
  } = props;

  return (
    <section className="admin-essay-layout">
      <div className="admin-panel admin-essay-list-panel">
        <div className="admin-panel-header">
          <div>
            <h2>Essays</h2>
            <span>{formatNumber(essays.total)} records</span>
          </div>
          <button onClick={newEssay}>New</button>
        </div>
        <div className="admin-filters">
          <label className="admin-search-field">
            <Search size={15} />
            <input
              placeholder="Search"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </label>
          <input
            placeholder="School"
            value={filters.school}
            onChange={(e) => setFilters({ ...filters, school: e.target.value })}
          />
          <select
            value={filters.embedding_status}
            onChange={(e) => setFilters({ ...filters, embedding_status: e.target.value })}
          >
            <option value="">All embeddings</option>
            <option value="current">Current</option>
            <option value="stale">Stale</option>
            <option value="queued">Queued</option>
          </select>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={filters.include_deleted}
              onChange={(e) => setFilters({ ...filters, include_deleted: e.target.checked })}
            />
            Deleted
          </label>
          <button onClick={() => loadEssays(1)}>Apply</button>
        </div>
        <div className="admin-id-list">
          {essays.items.map((essay) => (
            <button
              key={essay.id}
              className={selectedEssay?.essay?.id === essay.id ? "active" : ""}
              onClick={() => loadEssayDetail(essay.id)}
              title={essay.topic || essay.id}
            >
              <strong>{essay.id}</strong>
              <StatusBadge value={essay.embedding_status || "unknown"} />
              {essay.public && <span className="admin-tiny-pill">Public</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-panel admin-detail-panel">
        <div className="admin-panel-header">
          <div>
            <h2>{selectedEssay?.essay?.id || "New Essay"}</h2>
            <span>{selectedEssay?.essay?.topic || "Create or select an essay"}</span>
          </div>
          <div className="admin-actions">
            {selectedEssay?.essay?.id && <button onClick={queueEmbedding}>Queue Embedding</button>}
            {selectedEssay?.essay?.id && (
              <button className="danger" onClick={deleteEssay} title="Soft delete" aria-label="Soft delete">
                <Trash2 size={16} />
              </button>
            )}
            <button onClick={saveEssay}>
              <Save size={16} /> Save
            </button>
          </div>
        </div>
        {selectedEssay?.essay && <EssayReadPanel essay={selectedEssay.essay} audit={selectedEssay.audit || []} />}
        <EssayEditor editor={editor} setEditor={setEditor} />
      </div>
    </section>
  );
}

function EssayReadPanel({ essay, audit }) {
  return (
    <div className="admin-read-panel">
      <div className="admin-meta-grid">
        <MetaItem label="Public" value={essay.public ? "Yes" : "No"} />
        <MetaItem label="Type" value={essay.type || "none"} />
        <MetaItem label="School" value={essay.school || "none"} />
        <MetaItem label="Words" value={formatNumber(essay.word_count)} />
        <MetaItem label="Embedding" value={essay.embedding_status || "unknown"} />
        <MetaItem label="Updated" value={formatDate(essay.updated_at)} />
      </div>
      <article className="admin-essay-content">{essay.content || "No content loaded."}</article>
      <div className="admin-two-column">
        <div>
          <h3>Metadata</h3>
          <pre>{JSON.stringify(essay.metadata || {}, null, 2)}</pre>
        </div>
        <div>
          <h3>Recent audit</h3>
          <div className="admin-audit-mini">
            {audit.length ? audit.map((row) => (
              <p key={row.id}>{formatDate(row.created_at)} | {row.actor_email} | {row.action}</p>
            )) : <p>No audit entries.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EssayEditor({ editor, setEditor }) {
  function update(field, value) {
    setEditor({ ...editor, [field]: value });
  }
  return (
    <div className="admin-form">
      <label>Topic<input value={editor.topic} onChange={(e) => update("topic", e.target.value)} /></label>
      <label>Type<input value={editor.type || ""} onChange={(e) => update("type", e.target.value)} /></label>
      <label>School<input value={editor.school || ""} onChange={(e) => update("school", e.target.value)} /></label>
      <label>Source<input value={editor.source_file || ""} onChange={(e) => update("source_file", e.target.value)} /></label>
      <label className="checkbox-row">
        <input type="checkbox" checked={Boolean(editor.public)} onChange={(e) => update("public", e.target.checked)} />
        Public
      </label>
      <label className="wide">Content<textarea value={editor.content} onChange={(e) => update("content", e.target.value)} /></label>
    </div>
  );
}

function Usage({ usage }) {
  if (!usage) return null;
  const dashboard = usageDashboard(usage);
  const totalTokens = dashboard.local.inputTokens + dashboard.local.outputTokens;

  return (
    <section className="admin-stack">
      <div className="admin-grid usage-grid">
        <MetricCard label="Current spend" value={formatCurrency(dashboard.currentSpend, dashboard.currency)} icon={Wallet} />
        <MetricCard label="Requests" value={formatNumber(dashboard.local.requests)} icon={Activity} />
        <MetricCard label="Tokens" value={formatNumber(totalTokens)} icon={BarChart3} />
        <MetricCard label="Local estimate" value={formatCurrency(dashboard.local.estimatedCost)} icon={Database} />
      </div>
      <div className="admin-panel">
        <PanelHeader title="Daily Cost" aside={dashboard.hasOfficialCost ? "official OpenAI costs" : "local fallback"} />
        {dashboard.officialBuckets.length ? (
          <BarGraph buckets={dashboard.officialBuckets} currency={dashboard.currency} />
        ) : (
          <EmptyState
            icon={AlertCircle}
            title={dashboard.officialConfigured ? "No daily cost buckets returned" : "Official cost data is not configured"}
            detail={dashboard.officialError || "Set OPENAI_ADMIN_API_KEY on the backend to enable official billing data."}
          />
        )}
      </div>
      <div className="admin-panel">
        <PanelHeader title="Feature Attribution" aside="local app events" />
        <div className="admin-usage-table">
          <div className="admin-usage-row heading">
            <span>Feature</span>
            <span>Model</span>
            <span>Requests</span>
            <span>Tokens</span>
            <span>Cost</span>
            <span>Status</span>
          </div>
          {(usage.local || []).map((row, index) => (
            <div className="admin-usage-row" key={`${row.feature}-${row.model}-${row.status}-${index}`}>
              <strong>{row.feature}</strong>
              <span>{row.model || "unknown"}</span>
              <span>{formatNumber(row.requests)}</span>
              <span>{formatNumber((row.input_tokens || 0) + (row.output_tokens || 0))}</span>
              <span>{formatCurrency(row.estimated_cost || 0)}</span>
              <StatusBadge value={row.status || "unknown"} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function BarGraph({ buckets, currency }) {
  const max = Math.max(...buckets.map((bucket) => bucket.cost), 1);
  return (
    <div className="admin-bar-graph">
      {buckets.map((bucket) => {
        const height = Math.max((bucket.cost / max) * 100, bucket.cost > 0 ? 6 : 2);
        return (
          <div className="admin-bar-cell" key={bucket.date}>
            <div className="admin-bar-track">
              <span className="admin-bar" style={{ "--bar-height": `${height}%` }} title={formatCurrency(bucket.cost, currency)} />
            </div>
            <small>{bucket.date.slice(5)}</small>
          </div>
        );
      })}
    </div>
  );
}

function Logs({ logs }) {
  const notConfigured = logs.error && !logs.configured;
  return (
    <section className="admin-panel">
      <PanelHeader title="CloudWatch Logs" aside={logs.configured ? "configured" : "not configured"} />
      {notConfigured && (
        <EmptyState
          icon={Terminal}
          title="CloudWatch log ingestion is not configured"
          detail="Create a log group, ship the EC2 essay-api logs into it, then set AWS_REGION and AWS_CLOUDWATCH_LOG_GROUP on the backend."
        />
      )}
      {!notConfigured && logs.error && <p className="admin-warning">{logs.error}</p>}
      <div className="admin-log-list">
        {logs.items.map((row) => (
          <div key={row.event_id || `${row.timestamp}-${row.message}`}>
            <span>{formatDate(row.timestamp)} | {row.severity} | {row.log_stream || "stream"}</span>
            <pre>{row.message}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}

function Audit({ audit }) {
  return (
    <section className="admin-panel">
      <PanelHeader title="Audit" aside={`${formatNumber(audit.length)} recent entries`} />
      <div className="admin-table">
        {audit.map((row) => (
          <button key={row.id}>
            <span>{formatDate(row.created_at)}</span>
            <strong>{row.action}</strong>
            <em>{row.actor_email} | {row.entity_type}:{row.entity_id}</em>
          </button>
        ))}
      </div>
    </section>
  );
}

function MetricCard({ label, value, icon: Icon }) {
  return (
    <div className="admin-stat">
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <Icon size={18} />
    </div>
  );
}

function IntegrationCard({ name, detail }) {
  const configured = Boolean(detail?.configured);
  return (
    <div className="admin-integration-card">
      {configured ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
      <div>
        <strong>{name.replaceAll("_", " ")}</strong>
        <span>{configured ? "Configured" : "Needs setup"}</span>
      </div>
    </div>
  );
}

function PanelHeader({ title, aside }) {
  return (
    <div className="admin-panel-header">
      <h2>{title}</h2>
      {aside && <span>{aside}</span>}
    </div>
  );
}

function StatusBadge({ value }) {
  const normalized = String(value || "unknown").toLowerCase();
  return <span className={`admin-status admin-status-${normalized}`}>{value}</span>;
}

function MetaItem({ label, value }) {
  return (
    <div className="admin-meta-item">
      <span>{label}</span>
      <strong>{value || "none"}</strong>
    </div>
  );
}

function EmptyState({ icon: Icon, title, detail }) {
  return (
    <div className="admin-empty">
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "none";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}
