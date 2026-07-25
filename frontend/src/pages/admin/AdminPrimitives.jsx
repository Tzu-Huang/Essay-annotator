export function MetricCard({ label, value, icon: Icon }) {
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

export function PanelHeader({ title, aside }) {
  return (
    <div className="admin-panel-header">
      <h2>{title}</h2>
      {aside && <span>{aside}</span>}
    </div>
  );
}

export function StatusBadge({ value }) {
  const normalized = String(value || "unknown").toLowerCase();
  return <span className={`admin-status admin-status-${normalized}`}>{value}</span>;
}

export function MetaItem({ label, value }) {
  return (
    <div className="admin-meta-item">
      <span>{label}</span>
      <strong>{value || "none"}</strong>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, detail }) {
  return (
    <div className="admin-empty">
      <Icon size={22} />
      <strong>{title}</strong>
      <span>{detail}</span>
    </div>
  );
}
