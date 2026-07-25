import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function AdminSidebar({ navItems, activeTab, onSelectTab, collapsed, onToggleCollapsed, apiBase }) {
  // Separate from `collapsed` (the desktop icon-only mode, persisted via
  // localStorage): below the phone breakpoint the whole nav list hides by
  // default and expands inline when toggled, rather than staying an
  // always-visible stack of 5 full-width buttons above the page content.
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  function selectTab(id) {
    setMobileNavOpen(false);
    onSelectTab(id);
  }

  return (
    <aside className={`admin-sidebar${collapsed ? " collapsed" : ""}${mobileNavOpen ? " mobile-open" : ""}`}>
      <div className="admin-brand">
        <div className="admin-brand-mark">EA</div>
        {!collapsed && (
          <div className="admin-brand-text">
            <strong>Developer console</strong>
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
        <button
          type="button"
          className="admin-mobile-nav-toggle"
          onClick={() => setMobileNavOpen((open) => !open)}
          aria-label={mobileNavOpen ? "Hide navigation" : "Show navigation"}
          aria-expanded={mobileNavOpen}
        >
          {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      <nav className="admin-nav" aria-label="Admin sections">
        {navItems.map(([id, label, Icon]) => (
          <button key={id} className={activeTab === id ? "active" : ""} onClick={() => selectTab(id)} title={label}>
            <Icon size={18} />
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
