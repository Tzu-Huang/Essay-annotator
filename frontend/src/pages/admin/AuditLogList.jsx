import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { formatDate } from "../AdminConsole.logic.mjs";

const ACTION_TAG_CLASS = {
  create: "update",
  update: "update",
  soft_delete: "delete",
  hard_delete: "delete",
  restore: "restore",
  regenerate_embedding: "restore",
  regenerate_stale_embeddings: "restore",
  import_essays: "import",
};

export function AuditLogList({ audit, compact = false }) {
  if (!audit.length) {
    return <p className="admin-audit-empty">No audit entries.</p>;
  }
  return (
    <div className={`admin-audit-log${compact ? " compact" : ""}`}>
      {!compact && <div className="admin-audit-titlebar">Audit Trail</div>}
      {audit.map((row) => (
        <AuditLogRow key={row.id} row={row} compact={compact} />
      ))}
    </div>
  );
}

function AuditLogRow({ row, compact }) {
  const [expanded, setExpanded] = useState(false);
  const tagClass = ACTION_TAG_CLASS[row.action] || "update";
  const summaryContent = (
    <>
      <span className="admin-audit-time">{formatDate(row.created_at)}</span>
      <span className={`admin-audit-tag ${tagClass}`}>{row.action}</span>
      <span className="admin-audit-entity">
        {row.entity_type}:{row.entity_id || "—"}
      </span>
      <span className="admin-audit-actor">{row.actor_email}</span>
    </>
  );
  return (
    <div className="admin-audit-row">
      {compact ? (
        <div className="admin-audit-row-summary admin-audit-row-summary-static">{summaryContent}</div>
      ) : (
        <button type="button" className="admin-audit-row-summary" onClick={() => setExpanded((prev) => !prev)} aria-expanded={expanded}>
          <ChevronRight size={14} className={`admin-audit-chevron${expanded ? " expanded" : ""}`} />
          {summaryContent}
        </button>
      )}
      {!compact && expanded && (
        <div className="admin-audit-diff">
          <div>
            <h4>Before</h4>
            <pre>{JSON.stringify(row.before, null, 2)}</pre>
          </div>
          <div>
            <h4>After</h4>
            <pre>{JSON.stringify(row.after, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
