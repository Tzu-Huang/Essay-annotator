import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  ClipboardList,
  Cloud,
  Database,
  RefreshCw,
  Shield,
  Terminal,
  Wallet,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import AdminSidebar from "./admin/AdminSidebar.jsx";
import OverviewDashboard from "./admin/OverviewDashboard.jsx";
import EssaysTab from "./admin/EssaysTab.jsx";
import EssayEditorPage from "./admin/EssayEditorPage.jsx";
import UploadEssaysPage from "./admin/UploadEssaysPage.jsx";
import UnsavedChangesModal from "./admin/UnsavedChangesModal.jsx";
import { AuditLogList } from "./admin/AuditLogList.jsx";
import { readSidebarCollapsed, writeSidebarCollapsed } from "./AdminConsole.logic.mjs";
import {
  advanceDraftQueue,
  draftToEditorPayload,
  formatCurrency,
  formatNumber,
  isAdminEmailAllowed,
  isContentDirty,
  isEditorDirty,
  PROJECT_ADMIN_EMAILS,
  usageDashboard,
} from "./AdminConsole.logic.mjs";
import { formatDate } from "./AdminConsole.logic.mjs";
import { EmptyState, MetricCard, PanelHeader, StatusBadge } from "./admin/AdminPrimitives.jsx";
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
  const [essays, setEssays] = useState({ items: [], total: 0, page: 1, page_size: 15 });
  const [filters, setFilters] = useState({ search: "", school: "", embedding_status: "", include_deleted: false });
  const [essaySort, setEssaySort] = useState({ field: "updated_at", dir: "desc" });
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [editor, setEditor] = useState(emptyEssay());
  const [hardDeleteConfirmId, setHardDeleteConfirmId] = useState("");
  const [importRunning, setImportRunning] = useState(false);
  const [regeneratingStale, setRegeneratingStale] = useState(false);
  const [usage, setUsage] = useState(null);
  const [logs, setLogs] = useState({ items: [], error: "", configured: false });
  const [audit, setAudit] = useState([]);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState("success");

  function showMessage(text, tone = "success") {
    setMessage(text);
    setMessageTone(tone);
  }

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(""), 10000);
    return () => clearTimeout(timer);
  }, [message]);
  const [essayView, setEssayView] = useState("list"); // "list" | "editor"
  const [peekEssayId, setPeekEssayId] = useState(null);
  const [regeneratingEmbeddingId, setRegeneratingEmbeddingId] = useState(null);
  const [contentEditing, setContentEditing] = useState(false);
  const [contentDraft, setContentDraft] = useState("");
  const [savedEditorSnapshot, setSavedEditorSnapshot] = useState(null);
  const [pendingNav, setPendingNav] = useState(null);
  const [savingBeforeNav, setSavingBeforeNav] = useState(false);
  const [uploadDrafts, setUploadDrafts] = useState([]);
  const [uploadDraftIndex, setUploadDraftIndex] = useState(0);
  const [uploadFailed, setUploadFailed] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadCreatedCount, setUploadCreatedCount] = useState(0);
  const [uploadBatchComplete, setUploadBatchComplete] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    readSidebarCollapsed(typeof window !== "undefined" ? window.localStorage : undefined)
  );

  function toggleSidebarCollapsed() {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      writeSidebarCollapsed(typeof window !== "undefined" ? window.localStorage : undefined, next);
      return next;
    });
  }

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
    const [overviewData, usageData] = await Promise.all([
      api("/admin/overview"),
      api("/admin/openai/usage"),
    ]);
    setOverview(overviewData);
    setUsage(usageData);
  }

  async function loadEssays(page = 1) {
    const params = new URLSearchParams({
      page: String(page),
      page_size: String(essays.page_size || 15),
      sort: essaySort.field,
      sort_dir: essaySort.dir,
    });
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== false) params.set(key, String(value));
    });
    const data = await api(`/admin/essays?${params.toString()}`);
    setEssays(data);
  }

  function toggleEssaySort(field) {
    setEssaySort((current) =>
      current.field === field
        ? { field, dir: current.dir === "asc" ? "desc" : "asc" }
        : { field, dir: "asc" }
    );
  }

  async function loadEssayDetail(id) {
    const data = await api(`/admin/essays/${id}`);
    setSelectedEssay(data);
    const nextEditor = {
      topic: data.essay.topic || "",
      content: data.essay.content || "",
      type: data.essay.type || "",
      school: data.essay.school || "",
      public: Boolean(data.essay.public),
      source_file: data.essay.source_file || "",
      metadata: data.essay.metadata || null,
    };
    setEditor(nextEditor);
    setSavedEditorSnapshot(nextEditor);
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

  function requestNavigation(action) {
    const inEditor = essayView === "editor";
    const fieldsDirty = inEditor && isEditorDirty(savedEditorSnapshot, editor);
    const contentTextareaDirty = inEditor && contentEditing && isContentDirty(contentDraft, editor.content);
    if (fieldsDirty || contentTextareaDirty) {
      setPendingNav(() => action);
      return;
    }
    action();
  }

  function closeEditor() {
    setEssayView("list");
    setContentEditing(false);
    setContentDraft("");
    setUploadDrafts([]);
    setUploadDraftIndex(0);
  }

  function switchTab(id) {
    requestNavigation(() => {
      closeEditor();
      setTab(id);
    });
  }

  async function refreshCurrent() {
    setMessage("");
    try {
      if (tab === "overview") await loadOverview();
      if (tab === "essays") await loadEssays(essays.page || 1);
      if (tab === "usage") await loadUsage();
      if (tab === "logs") await loadLogs();
      if (tab === "audit") await loadAudit();
      showMessage("Updated");
    } catch (error) {
      showMessage(error.message, "error");
    }
  }

  async function saveEssay() {
    // Fold in an in-progress content-textarea draft even if its own "Done"
    // wasn't clicked -- the top-level Save should save what's on screen, not
    // silently drop unfinished typing in the content editor.
    const payload = contentEditing && isContentDirty(editor.content, contentDraft) ? { ...editor, content: contentDraft } : editor;
    const path = selectedEssay?.essay?.id ? `/admin/essays/${selectedEssay.essay.id}` : "/admin/essays";
    const method = selectedEssay?.essay?.id ? "PATCH" : "POST";
    const data = await api(path, { method, body: JSON.stringify(payload) });
    setSelectedEssay({ essay: data.essay, audit: selectedEssay?.audit || [] });
    setSavedEditorSnapshot(payload);
    setEditor(payload);
    setContentDraft(payload.content || "");
    setContentEditing(false);
    await loadEssays(essays.page || 1);
    await loadOverview();
    showMessage("Essay saved");
  }

  function loadDraftIntoEditor(draft) {
    setSelectedEssay(null);
    const payload = draftToEditorPayload(draft);
    setEditor(payload);
    setSavedEditorSnapshot(payload);
    setHardDeleteConfirmId("");
  }

  async function uploadEssayDrafts(files, fileMeta) {
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("file_meta", JSON.stringify(fileMeta));
      const response = await fetch(`${API_BASE}/admin/essays/upload-drafts`, {
        method: "POST",
        headers: { "X-Admin-Email": email || "" },
        body: formData,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.detail || "Upload failed");

      setUploadFailed(data.failed || []);
      setUploadCreatedCount(0);
      setUploadBatchComplete(false);

      if (data.drafts?.length) {
        setUploadDrafts(data.drafts);
        setUploadDraftIndex(0);
        loadDraftIntoEditor(data.drafts[0]);
        setEssayView("editor");
      } else if (data.failed?.length) {
        showMessage(`No files could be processed (${data.failed.length} failed).`, "error");
      } else {
        showMessage("No files selected.", "error");
      }
    } catch (error) {
      showMessage(error.message, "error");
    } finally {
      setUploading(false);
    }
  }

  function advanceOrFinishDraftQueue() {
    const result = advanceDraftQueue(uploadDraftIndex, uploadDrafts.length);
    if (result.done) {
      setUploadDrafts([]);
      setUploadDraftIndex(0);
      setUploadBatchComplete(true);
      setEssayView("upload");
    } else {
      setUploadDraftIndex(result.nextIndex);
      loadDraftIntoEditor(uploadDrafts[result.nextIndex]);
    }
  }

  async function saveUploadDraft() {
    await saveEssay();
    setUploadCreatedCount((count) => count + 1);
    advanceOrFinishDraftQueue();
  }

  function skipUploadDraft() {
    advanceOrFinishDraftQueue();
  }

  function startNewUpload() {
    setUploadFailed([]);
    setUploadCreatedCount(0);
    setUploadBatchComplete(false);
    setTab("essays");
    setEssayView("upload");
  }

  async function deleteEssay() {
    if (!selectedEssay?.essay?.id) return;
    const confirmed = window.confirm("Soft delete this essay?");
    if (!confirmed) return;
    const data = await api(`/admin/essays/${selectedEssay.essay.id}`, { method: "DELETE" });
    setSelectedEssay({ essay: data.essay, audit: selectedEssay.audit || [] });
    await loadEssays(essays.page || 1);
    await loadOverview();
    showMessage("Essay soft deleted");
  }

  async function restoreEssay() {
    if (!selectedEssay?.essay?.id) return;
    const data = await api(`/admin/essays/${selectedEssay.essay.id}/restore`, { method: "POST" });
    setSelectedEssay({ essay: data.essay, audit: selectedEssay.audit || [] });
    await loadEssays(essays.page || 1);
    showMessage("Essay restored");
  }

  async function hardDeleteEssay() {
    if (!selectedEssay?.essay?.id) return;
    await api(`/admin/essays/${selectedEssay.essay.id}/hard-delete`, { method: "POST" });
    setSelectedEssay(null);
    setHardDeleteConfirmId("");
    await loadEssays(essays.page || 1);
    showMessage("Essay permanently deleted");
  }

  async function handleRowClick(essay) {
    if (peekEssayId === essay.id) {
      setPeekEssayId(null);
      return;
    }
    setPeekEssayId(essay.id);
    await loadEssayDetail(essay.id);
  }

  async function regenerateEmbeddingFor(essayId) {
    setRegeneratingEmbeddingId(essayId);
    try {
      const data = await api(`/admin/essays/${essayId}/regenerate-embedding`, { method: "POST" });
      if (selectedEssay?.essay?.id === essayId) {
        setSelectedEssay({ essay: data.essay, audit: selectedEssay.audit || [] });
      }
      await loadEssays(essays.page || 1);
      await loadOverview();
      if (data.embedding_job?.status === "current") {
        showMessage("Embedding regenerated");
      } else {
        showMessage("Embedding regeneration failed to reach current status", "error");
      }
    } finally {
      setRegeneratingEmbeddingId(null);
    }
  }

  async function importNewEssays() {
    setImportRunning(true);
    try {
      const result = await api("/admin/import-new-essays", { method: "POST" });
      showMessage(
        `Imported ${result.created} new essays, ${result.skipped_duplicates} duplicates skipped, ${result.invalid} invalid — ${result.embedded} embedded and searchable.`
      );
      await loadEssays(essays.page || 1);
      await loadOverview();
    } finally {
      setImportRunning(false);
    }
  }

  async function regenerateAllStale() {
    setRegeneratingStale(true);
    try {
      const result = await api("/admin/essays/regenerate-stale-embeddings", { method: "POST" });
      showMessage(
        result.attempted === 0
          ? "No stale essays to regenerate."
          : `Regenerated ${result.succeeded} of ${result.attempted} stale essay(s)${result.failed ? ` (${result.failed} failed)` : ""}.`,
        result.failed ? "error" : "success"
      );
      await loadOverview();
    } finally {
      setRegeneratingStale(false);
    }
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
          const [overviewData, usageData, auditData] = await Promise.all([
            api("/admin/overview"),
            api("/admin/openai/usage"),
            api("/admin/audit?limit=50"),
          ]);
          if (!cancelled) {
            setOverview(overviewData);
            setUsage(usageData);
            setAudit(auditData.items || []);
          }
        }
        if (tab === "essays") {
          const data = await api(
            `/admin/essays?page=1&page_size=${essays.page_size || 15}&sort=${essaySort.field}&sort_dir=${essaySort.dir}`
          );
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
        if (!cancelled) showMessage(error.message, "error");
      }
    }

    loadTab();
    return () => {
      cancelled = true;
    };
  }, [adminState.profile, api, essays.page_size, essaySort, tab]);

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
    <main className={`admin-shell${sidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      <AdminSidebar
        navItems={NAV_ITEMS}
        activeTab={tab}
        onSelectTab={switchTab}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={toggleSidebarCollapsed}
        apiBase={API_BASE}
      />

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-kicker">Developer Operations</p>
            <h1>{NAV_ITEMS.find(([id]) => id === tab)?.[1] || "Admin Console"}</h1>
          </div>
          <button className="admin-icon-button" onClick={refreshCurrent} title="Refresh" aria-label="Refresh">
            <RefreshCw size={18} />
          </button>
        </header>

        {message && <div className={`admin-message admin-message-${messageTone}`}>{message}</div>}
        {tab === "overview" && (
          <OverviewDashboard
            overview={overview}
            usage={usage}
            audit={audit}
            user={adminState.profile ? user : null}
            onOpenLog={() => switchTab("audit")}
            onImport={startNewUpload}
            onRegenerateStale={regenerateAllStale}
            regeneratingStale={regeneratingStale}
          />
        )}
        {tab === "essays" && essayView === "list" && (
          <EssaysTab
            essays={essays}
            filters={filters}
            setFilters={setFilters}
            loadEssays={loadEssays}
            essaySort={essaySort}
            toggleEssaySort={toggleEssaySort}
            peekEssayId={peekEssayId}
            onRowClick={handleRowClick}
            peekEssay={peekEssayId === selectedEssay?.essay?.id ? selectedEssay?.essay : null}
            onCollapsePeek={() => setPeekEssayId(null)}
            onOpenEditor={() => setEssayView("editor")}
            onRegenerateEmbedding={regenerateEmbeddingFor}
            regeneratingEmbeddingId={regeneratingEmbeddingId}
            importNewEssays={importNewEssays}
            importRunning={importRunning}
            onOpenUpload={startNewUpload}
          />
        )}
        {tab === "essays" && essayView === "upload" && (
          <UploadEssaysPage
            onBack={() => requestNavigation(closeEditor)}
            onSubmit={uploadEssayDrafts}
            uploading={uploading}
            failed={uploadFailed}
            createdCount={uploadCreatedCount}
            batchComplete={uploadBatchComplete}
            onStartNew={startNewUpload}
          />
        )}
        {tab === "essays" && essayView === "editor" && (
          <EssayEditorPage
            key={editor.source_file}
            essay={selectedEssay?.essay || null}
            audit={selectedEssay?.audit || []}
            editor={editor}
            setEditor={setEditor}
            onBack={() => requestNavigation(closeEditor)}
            onSave={uploadDrafts.length > 0 ? saveUploadDraft : saveEssay}
            draftInfo={
              uploadDrafts.length > 0
                ? { current: uploadDraftIndex + 1, total: uploadDrafts.length, onSkip: skipUploadDraft }
                : null
            }
            extractionWarning={uploadDrafts.length > 0 ? uploadDrafts[uploadDraftIndex]?.extraction_warning : null}
            onSoftDelete={deleteEssay}
            onRestore={restoreEssay}
            onHardDelete={hardDeleteEssay}
            onRegenerateEmbedding={() => selectedEssay?.essay?.id && regenerateEmbeddingFor(selectedEssay.essay.id)}
            regeneratingEmbedding={Boolean(selectedEssay?.essay?.id) && regeneratingEmbeddingId === selectedEssay.essay.id}
            hardDeleteConfirmId={hardDeleteConfirmId}
            setHardDeleteConfirmId={setHardDeleteConfirmId}
            onContentEditingChange={setContentEditing}
            onContentDraftChange={setContentDraft}
          />
        )}
        {pendingNav && (
          <UnsavedChangesModal
            saving={savingBeforeNav}
            onLeave={() => {
              const action = pendingNav;
              setPendingNav(null);
              action();
            }}
            onStay={() => setPendingNav(null)}
            onSave={async () => {
              setSavingBeforeNav(true);
              try {
                await saveEssay();
                const action = pendingNav;
                setPendingNav(null);
                action();
              } catch (error) {
                showMessage(error.message, "error");
              } finally {
                setSavingBeforeNav(false);
              }
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
  return <AuditLogList audit={audit} />;
}
