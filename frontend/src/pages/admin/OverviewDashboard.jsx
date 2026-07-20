import { AlertCircle, BookOpen, Database, Shield, Trash2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  buildDailyRequestSeries,
  embeddingCoveragePercent,
  extractOfficialCostBuckets,
  formatCurrency,
  formatNumber,
  initialFromName,
} from "../AdminConsole.logic.mjs";
import { EmptyState } from "./AdminPrimitives.jsx";
import { AuditLogList } from "./AuditLogList.jsx";

const METRIC_TINTS = ["tint-a", "tint-b", "tint-c", "tint-d"];

export default function OverviewDashboard({
  overview,
  usage,
  audit,
  user,
  onOpenLog,
  onImport,
  importRunning,
  onRegenerateStale,
  regeneratingStale,
}) {
  if (!overview) return null;

  const counts = overview.counts;
  const cards = [
    ["Essays", counts.essays, BookOpen],
    ["Deleted", counts.deleted_essays, Trash2],
    ["Users", counts.users, Shield],
    ["Stale embeddings", counts.stale_embeddings, Database],
  ];
  const requestSeries = buildDailyRequestSeries(usage?.local_daily || []);
  const costBuckets = usage ? extractOfficialCostBuckets(usage.official) : [];
  const coveragePercent = embeddingCoveragePercent(counts);

  return (
    <section className="admin-overview">
      <GreetingHeader user={user} />

      <div className="admin-overview-metrics">
        {cards.map(([label, value, Icon], index) => (
          <div className={`admin-overview-metric ${METRIC_TINTS[index]}`} key={label}>
            <Icon size={16} />
            <div className="admin-overview-metric-value">{formatNumber(value)}</div>
            <div className="admin-overview-metric-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="admin-overview-row">
        <div className="admin-panel admin-overview-chart-panel">
          <h3>Daily requests (30d)</h3>
          {requestSeries.length ? (
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={requestSeries}>
                <defs>
                  <linearGradient id="dailyRequestsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5c6bb0" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#5c6bb0" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis hide />
                <Tooltip />
                <Area type="monotone" dataKey="requests" stroke="#5c6bb0" strokeWidth={2} fill="url(#dailyRequestsFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState icon={AlertCircle} title="No request data yet" detail="Daily volume appears once usage events are recorded." />
          )}
        </div>
        <div className="admin-panel admin-overview-chart-panel">
          <h3>Daily cost (30d)</h3>
          {costBuckets.length ? (
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={costBuckets}>
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} />
                <YAxis hide />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="cost" fill="#3fb950" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={AlertCircle}
              title={usage?.official?.configured ? "No daily cost buckets returned" : "Official cost data is not configured"}
              detail={usage?.official?.error || "Set OPENAI_ADMIN_API_KEY on the backend to enable official billing data."}
            />
          )}
        </div>
        <div className="admin-panel admin-overview-donut-panel">
          <h3>Embedding coverage</h3>
          <EmbeddingCoverageDonut percent={coveragePercent} />
          <div className="admin-donut-caption">
            {formatNumber(counts.essays - counts.stale_embeddings)} / {formatNumber(counts.essays)} current
          </div>
        </div>
      </div>

      <div className="admin-overview-row">
        <div className="admin-panel admin-activity-panel">
          <div className="admin-panel-head-row">
            <h3>Recent activity</h3>
            <button type="button" className="admin-open-log-btn" onClick={onOpenLog}>
              &gt;_ Open log
            </button>
          </div>
          <AuditLogList audit={audit.slice(0, 5)} compact />
        </div>
        <div className="admin-panel admin-integrations-panel">
          <h3>Integrations</h3>
          <div className="admin-integ-list">
            {Object.entries(overview.integrations || {}).map(([name, detail]) => (
              <IntegrationRow key={name} name={name} configured={Boolean(detail?.configured)} />
            ))}
          </div>
        </div>
      </div>

      <div className="admin-quick-actions">
        <button type="button" className="admin-quick-action" onClick={onImport} disabled={importRunning}>
          <span className="admin-quick-action-icon">+</span>
          <span>
            <span className="admin-quick-action-title">Import essays</span>
            <span className="admin-quick-action-sub">Pull new essays and embed them</span>
          </span>
        </button>
        <button
          type="button"
          className="admin-quick-action secondary"
          onClick={onRegenerateStale}
          disabled={regeneratingStale}
        >
          <span className="admin-quick-action-icon">↻</span>
          <span>
            <span className="admin-quick-action-title">Regenerate stale</span>
            <span className="admin-quick-action-sub">Re-embed any out-of-date essays</span>
          </span>
        </button>
      </div>
    </section>
  );
}

function GreetingHeader({ user }) {
  return (
    <div className="admin-overview-greeting">
      <div className="admin-overview-avatar">{initialFromName(user?.name)}</div>
      <div>
        <div className="admin-overview-greeting-title">
          Welcome back, <span>{user?.name || "there"}</span>
        </div>
        <div className="admin-overview-greeting-sub">
          {user?.email} · Admin
        </div>
      </div>
    </div>
  );
}

function EmbeddingCoverageDonut({ percent }) {
  const data = [
    { name: "current", value: percent },
    { name: "remaining", value: Math.max(0, 100 - percent) },
  ];
  return (
    <div className="admin-donut-wrap">
      <PieChart width={120} height={120}>
        <Pie data={data} dataKey="value" innerRadius={42} outerRadius={54} startAngle={90} endAngle={-270}>
          <Cell fill="#5c6bb0" />
          <Cell fill="#e2e8f0" />
        </Pie>
      </PieChart>
      <div className="admin-donut-label">{percent}%</div>
    </div>
  );
}

function IntegrationRow({ name, configured }) {
  return (
    <div className={`admin-integ-row${configured ? "" : " has-warn"}`}>
      <span className={`admin-integ-dot ${configured ? "ok" : "warn"}`} />
      <span className="admin-integ-name">{name.replaceAll("_", " ")}</span>
      <span className={`admin-integ-status ${configured ? "ok" : "warn"}`}>{configured ? "Configured" : "Needs setup"}</span>
    </div>
  );
}
