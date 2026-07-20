import { Menu } from "lucide-react";

export default function AdminSidebar({ navItems, activeTab, onSelectTab, collapsed, onToggleCollapsed, apiBase }) {
  return (
    <aside className={`admin-sidebar${collapsed ? " collapsed" : ""}`}>
      <div className="admin-brand">
        <div className="admin-brand-mark">EA</div>
        {!collapsed && (
          <div>
            <strong>Essay Ops</strong>
            <span>Developer console</span>
          </div>
        )}
        <button
          type="button"
          className="admin-sidebar-toggle"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Menu size={16} />
        </button>
      </div>
      <nav className="admin-nav" aria-label="Admin sections">
        {navItems.map(([id, label, Icon]) => (
          <button key={id} className={activeTab === id ? "active" : ""} onClick={() => onSelectTab(id)} title={label}>
            <Icon size={17} />
            {!collapsed && <span>{label}</span>}
          </button>
        ))}
      </nav>
      {!collapsed && (
        <div className="admin-sidebar-footer">
          <span>API</span>
          <strong>{apiBase.replace(/^https?:\/\//, "")}</strong>
        </div>
      )}
    </aside>
  );
}
