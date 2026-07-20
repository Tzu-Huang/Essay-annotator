export default function UnsavedChangesModal({ onLeave, onStay }) {
  return (
    <div className="admin-modal-overlay" role="dialog" aria-modal="true">
      <div className="admin-modal">
        <h3>Unsaved changes</h3>
        <p>You have unsaved edits to this essay&apos;s content. If you leave now, these changes will be lost.</p>
        <div className="admin-modal-actions">
          <button type="button" onClick={onLeave}>
            Leave without saving
          </button>
          <button type="button" className="primary" onClick={onStay}>
            Stay &amp; keep editing
          </button>
        </div>
      </div>
    </div>
  );
}
