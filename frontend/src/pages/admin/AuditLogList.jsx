import { useState } from "react";
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
      {audit.map((row) => (
        <AuditLogRow key={row.id} row={row} />
      ))}
    </div>
  );
}

function AuditLogRow({ row }) {
  const [expanded, setExpanded] = useState(false);
  const tagClass = ACTION_TAG_CLASS[row.action] || "update";
  return (
    <div className="admin-audit-row">
      <button type="button" className="admin-audit-row-summary" onClick={() => setExpanded((prev) => !prev)}>
        <span className="admin-audit-time">{formatDate(row.created_at)}</span>
        <span className={`admin-audit-tag ${tagClass}`}>{row.action}</span>
        <span className="admin-audit-entity">
          {row.entity_type}:{row.entity_id || "—"}
        </span>
        <span className="admin-audit-actor">{row.actor_email}</span>
      </button>
      {expanded && (
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
