import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { formatDate, formatNumber } from "../AdminConsole.logic.mjs";

export function UsersView({ data, loading, error, search, setSearch, onSearch, onPage }) {
  const pages = Math.max(1, Math.ceil(data.total / data.page_size));
  return (
    <section className="admin-panel" aria-label="Users" aria-busy={loading}>
      <div className="admin-panel-header">
        <div><h2>Users</h2><span>{formatNumber(data.total)} users · Read only</span></div>
        <Users size={22} aria-hidden="true" />
      </div>
      <form className="admin-filters" onSubmit={onSearch}>
        <label className="admin-search-field">
          <Search size={15} aria-hidden="true" />
          <input aria-label="Search users by name or email" placeholder="Search name or email" value={search} onChange={(event) => setSearch(event.target.value)} maxLength={200} />
        </label>
        <button type="submit" disabled={loading}>Search</button>
      </form>
      {error && <p className="admin-warning" role="alert">{error}</p>}
      {loading && <p role="status" style={{ padding: "16px" }}>Loading users…</p>}
      {!loading && !error && <>
        <div style={{ overflowX: "auto" }}>
          <table className="admin-essay-table" style={{ minWidth: 780 }}>
            <thead><tr>{["Name", "Email", "Joined", "Logins", "Last login ↓"].map(label => <th key={label}>{label}</th>)}</tr></thead>
            <tbody>{data.items.map(row => <tr key={row.id}>
              <td><strong>{row.name || "—"}</strong></td><td>{row.email}</td>
              <td>{formatDate(row.created_at)}</td><td>{formatNumber(row.login_count || 0)}</td>
              <td>{row.last_login ? formatDate(row.last_login) : "Never"}</td>
            </tr>)}</tbody>
          </table>
        </div>
        {!data.items.length && <p role="status" style={{ padding: "24px" }}>{search ? "No users match your search." : "No users yet."}</p>}
        <div className="admin-essay-pager">
          <button aria-label="Previous page" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>←</button>
          <span>Page {data.page} of {pages} · {formatNumber(data.total)} users</span>
          <button aria-label="Next page" disabled={data.page >= pages} onClick={() => onPage(data.page + 1)}>→</button>
        </div>
      </>}
    </section>
  );
}

export default function UsersTab({ api }) {
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState({ search: "", page: 1 });
  const [data, setData] = useState({ items: [], total: 0, page: 1, page_size: 15 });
  const [completed, setCompleted] = useState(null);
  const loading = completed?.query !== query || completed?.api !== api;
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ search: query.search, page: String(query.page), page_size: "15" });
    api(`/admin/users?${params}`).then(result => {
      if (active) { setData(result); setError(""); }
    }).catch(reason => {
      if (active) setError(reason.message);
    }).finally(() => {
      if (active) setCompleted({ query, api });
    });
    return () => { active = false; };
  }, [api, query]);
  return <UsersView data={data} loading={loading} error={loading ? "" : error} search={search} setSearch={setSearch}
    onSearch={event => { event.preventDefault(); setQuery({ search: search.trim(), page: 1 }); }}
    onPage={page => setQuery(current => ({ ...current, page }))} />;
}
