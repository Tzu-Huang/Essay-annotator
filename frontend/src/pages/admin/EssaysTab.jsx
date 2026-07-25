import { RefreshCw, Search } from "lucide-react";
import { formatDate, formatNumber } from "../AdminConsole.logic.mjs";
import { StatusBadge } from "./AdminPrimitives.jsx";

const ESSAY_COLUMNS = [
  ["id", "ID"],
  ["topic", "Topic"],
  ["school", "School"],
  ["type", "Type"],
  ["public", "Public"],
  ["updated_at", "Updated at"],
  ["embedding_status", "Embedding status"],
];

export default function EssaysTab({
  essays,
  filters,
  setFilters,
  loadEssays,
  essaySort,
  toggleEssaySort,
  peekEssayId,
  onRowClick,
  peekEssay,
  onCollapsePeek,
  onOpenEditor,
  onRegenerateEmbedding,
  regeneratingEmbeddingId,
  onOpenUpload,
  importNewEssays,
  importRunning,
}) {
  const totalPages = Math.max(1, Math.ceil((essays.total || 0) / (essays.page_size || 15)));
  const currentPage = essays.page || 1;

  return (
    <div className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h2>Essays</h2>
          <span>{formatNumber(essays.total)} records</span>
        </div>
        <div className="admin-actions">
          <button onClick={importNewEssays} disabled={importRunning} className="admin-secondary-link" title="Import from the Google-Drive-synced folder (existing pipeline, unchanged)">
            <RefreshCw size={16} className={importRunning ? "spin" : ""} /> Sync from Drive folder
          </button>
          <button onClick={onOpenUpload} className="primary">
            Upload essays
          </button>
        </div>
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

      <table className="admin-essay-table">
        <thead>
          <tr>
            {ESSAY_COLUMNS.map(([field, label]) => (
              <th key={field}>
                {field === "public" ? (
                  <span className="admin-sort-header-static">{label}</span>
                ) : (
                  <button type="button" className="admin-sort-header" onClick={() => toggleEssaySort(field)}>
                    {label}
                    {essaySort.field === field && (essaySort.dir === "asc" ? " ▲" : " ▼")}
                  </button>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {essays.items.map((essay) => (
            <RowWithPeek
              key={essay.id}
              essay={essay}
              columnCount={ESSAY_COLUMNS.length}
              peekEssayId={peekEssayId}
              onRowClick={onRowClick}
              peekEssay={peekEssay}
              onCollapsePeek={onCollapsePeek}
              onOpenEditor={onOpenEditor}
              onRegenerateEmbedding={onRegenerateEmbedding}
              regeneratingEmbeddingId={regeneratingEmbeddingId}
            />
          ))}
        </tbody>
      </table>

      <div className="admin-essay-pager">
        <button type="button" onClick={() => loadEssays(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
          ←
        </button>
        <span>
          Page {currentPage} of {totalPages} · {formatNumber(essays.total)} essays
        </span>
        <button type="button" onClick={() => loadEssays(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
          →
        </button>
      </div>
    </div>
  );
}

function RowWithPeek({
  essay,
  columnCount,
  peekEssayId,
  onRowClick,
  peekEssay,
  onCollapsePeek,
  onOpenEditor,
  onRegenerateEmbedding,
  regeneratingEmbeddingId,
}) {
  const isPeeked = peekEssayId === essay.id;
  const rowClass = isPeeked ? "peeked" : peekEssayId ? "dimmed" : "";
  return (
    <>
      <tr className={rowClass} onClick={() => onRowClick(essay)} title={essay.topic || essay.id}>
        <td>
          <strong>{essay.id}</strong>
        </td>
        <td>{essay.topic || "none"}</td>
        <td>{essay.school || "none"}</td>
        <td>{essay.type || "none"}</td>
        <td className="admin-center">
          <span className={`admin-tiny-pill ${essay.public ? "public" : "private"}`}>
            {essay.public ? "Public" : "No"}
          </span>
        </td>
        <td className="admin-nowrap">{formatDate(essay.updated_at)}</td>
        <td className="admin-center">
          <StatusBadge value={essay.embedding_status || "unknown"} />
        </td>
      </tr>
      {isPeeked && !peekEssay && (
        <tr className="admin-peek-row">
          <td colSpan={columnCount}>
            <div className="admin-peek-loading">
              <RefreshCw size={14} className="spin" /> Loading…
            </div>
          </td>
        </tr>
      )}
      {isPeeked && peekEssay && (
        <tr className="admin-peek-row">
          <td colSpan={columnCount}>
            <div className="admin-peek-panel">
              <div className="admin-peek-content">{peekEssay.content || peekEssay.preview || "No content loaded."}</div>
              <div className="admin-peek-actions">
                <button type="button" className="primary" onClick={onOpenEditor}>
                  ↗ Open full editor
                </button>
                <button
                  type="button"
                  onClick={() => onRegenerateEmbedding(essay.id)}
                  disabled={regeneratingEmbeddingId === essay.id}
                >
                  <RefreshCw size={14} className={regeneratingEmbeddingId === essay.id ? "spin" : ""} /> Regenerate embedding
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PeekMetaItem({ label, value }) {
  return (
    <div className="admin-peek-meta-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
