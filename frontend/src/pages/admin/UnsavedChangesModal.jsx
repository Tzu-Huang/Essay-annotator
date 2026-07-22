export default function UnsavedChangesModal({ onSave, onLeave, onStay, saving }) {
  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <h3>Unsaved changes</h3>
        <p>You have unsaved edits to this essay. Save them before leaving, or they&apos;ll be lost.</p>
        <div className="admin-modal-actions">
          <button type="button" className="primary admin-modal-primary" onClick={onSave} disabled={saving}>
            {saving ? "Saving…" : "Save & leave"}
          </button>
          <div className="admin-modal-actions-secondary">
            <button type="button" onClick={onStay} disabled={saving}>
              Stay &amp; keep editing
            </button>
            <button type="button" className="danger" onClick={onLeave} disabled={saving}>
              Leave without saving
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
