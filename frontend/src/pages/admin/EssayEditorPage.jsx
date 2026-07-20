import { useEffect, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { formatDate, formatNumber, isConfirmIdMatch, isContentDirty, parseMetadataDraft } from "../AdminConsole.logic.mjs";
import { MetaItem } from "./AdminPrimitives.jsx";

export default function EssayEditorPage({
  essay,
  audit,
  editor,
  setEditor,
  onBack,
  onSave,
  onSoftDelete,
  onRestore,
  onHardDelete,
  onRegenerateEmbedding,
  hardDeleteConfirmId,
  setHardDeleteConfirmId,
  onContentEditingChange,
  onContentDraftChange,
  onMetadataErrorChange,
  saveDisabled,
}) {
  const [contentEditing, setContentEditing] = useState(false);
  const [contentDraft, setContentDraft] = useState(editor.content || "");
  const [metadataDraft, setMetadataDraft] = useState(() => JSON.stringify(editor.metadata || {}, null, 2));
  const [metadataError, setMetadataError] = useState("");

  // Resync local drafts when `editor.content`/`editor.metadata` change out from under us
  // (essay switch, or a metadata commit reformatting the JSON). Adjusted during render
  // rather than in a useEffect, per https://react.dev/learn/you-might-not-need-an-effect
  // ("Adjusting some state when a prop changes") — avoids an extra render pass and the
  // react-hooks/set-state-in-effect lint rule.
  const [syncedContent, setSyncedContent] = useState(editor.content);
  if (editor.content !== syncedContent) {
    setSyncedContent(editor.content);
    setContentDraft(editor.content || "");
  }

  const [syncedMetadata, setSyncedMetadata] = useState(editor.metadata);
  if (editor.metadata !== syncedMetadata) {
    setSyncedMetadata(editor.metadata);
    setMetadataDraft(JSON.stringify(editor.metadata || {}, null, 2));
    setMetadataError("");
  }

  const isDeleted = Boolean(essay?.deleted_at);
  const isNew = !essay?.id;

  useEffect(() => {
    onContentEditingChange?.(contentEditing);
  }, [contentEditing, onContentEditingChange]);

  useEffect(() => {
    onContentDraftChange?.(contentDraft);
  }, [contentDraft, onContentDraftChange]);

  useEffect(() => {
    onMetadataErrorChange?.(metadataError);
  }, [metadataError, onMetadataErrorChange]);

  function commitMetadataDraft() {
    const result = parseMetadataDraft(metadataDraft);
    if (!result.ok) {
      setMetadataError(result.error);
      return;
    }
    setMetadataError("");
    setEditor({ ...editor, metadata: result.value });
  }

  return (
    <div className="admin-editor-page">
      <div className="admin-back-row">
        <button type="button" className="admin-back-btn" onClick={onBack}>
          ← Back to essays
        </button>
      </div>

      <div className="admin-panel admin-editor-header">
        <div className="admin-editor-header-top">
          <div>
            <h1>{essay?.id || "New Essay"}</h1>
            <p className="admin-editor-desc">{essay?.topic || "Create or select an essay"}</p>
          </div>
          {!isDeleted && (
            <div className="admin-actions">
              <button onClick={onSave} disabled={saveDisabled} title={saveDisabled ? "Fix the invalid metadata JSON below before saving" : undefined}>
                <Save size={16} /> Save
              </button>
              {essay?.id && (
                <button className="danger" onClick={onSoftDelete}>
                  <Trash2 size={16} /> Soft Delete
                </button>
              )}
            </div>
          )}
        </div>
        {saveDisabled && (
          <p className="admin-field-error">Save is disabled: the metadata field below has invalid JSON.</p>
        )}

        {isDeleted ? (
          <div className="admin-actions">
            <button onClick={onRestore}>Restore</button>
            <input
              value={hardDeleteConfirmId}
              onChange={(e) => setHardDeleteConfirmId(e.target.value)}
              placeholder="Type essay ID to confirm"
            />
            <button className="danger" disabled={!isConfirmIdMatch(hardDeleteConfirmId, essay.id)} onClick={onHardDelete}>
              Hard Delete
            </button>
          </div>
        ) : (
          essay?.id && (
            <button type="button" onClick={onRegenerateEmbedding}>
              <RefreshCw size={16} /> Regenerate Embedding
            </button>
          )
        )}

        {!isNew && (
          <div className="admin-meta-grid admin-meta-grid-readonly">
            <MetaItem label="Words" value={formatNumber(essay.word_count)} />
            <MetaItem label="Embedding" value={essay.embedding_status || "unknown"} />
            <MetaItem label="Updated" value={formatDate(essay.updated_at)} />
          </div>
        )}
      </div>

      {!isDeleted && (
        <div className="admin-panel">
          <div className="admin-panel-head-row">
            <h3>
              Essay content
              {contentEditing && isContentDirty(editor.content, contentDraft) && (
                <span className="admin-dirty-badge">Unsaved changes</span>
              )}
            </h3>
            {!contentEditing ? (
              <button type="button" onClick={() => setContentEditing(true)}>
                ✎ Edit
              </button>
            ) : (
              <div className="admin-actions">
                <button
                  type="button"
                  onClick={() => {
                    setContentDraft(editor.content || "");
                    setContentEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="primary"
                  onClick={() => {
                    setEditor({ ...editor, content: contentDraft });
                    setContentEditing(false);
                  }}
                >
                  ✓ Save
                </button>
              </div>
            )}
          </div>
          {!contentEditing ? (
            <div className="admin-content-box">{essay?.content || editor.content || "No content loaded."}</div>
          ) : (
            <textarea
              className="admin-content-textarea"
              value={contentDraft}
              onChange={(e) => setContentDraft(e.target.value)}
            />
          )}
        </div>
      )}

      {!isDeleted && (
        <div className="admin-panel">
          <h3>Details &amp; metadata</h3>
          <div className="admin-form-grid">
            <label>
              Topic
              <input value={editor.topic} onChange={(e) => setEditor({ ...editor, topic: e.target.value })} />
            </label>
            <label>
              Type
              <input value={editor.type || ""} onChange={(e) => setEditor({ ...editor, type: e.target.value })} />
            </label>
            <label>
              School
              <input value={editor.school || ""} onChange={(e) => setEditor({ ...editor, school: e.target.value })} />
            </label>
            <label>
              Source
              <input
                value={editor.source_file || ""}
                onChange={(e) => setEditor({ ...editor, source_file: e.target.value })}
              />
            </label>
            <label className="admin-form-grid-full">
              Metadata (JSON)
              <textarea
                className="admin-metadata-textarea"
                value={metadataDraft}
                onChange={(e) => setMetadataDraft(e.target.value)}
                onBlur={commitMetadataDraft}
              />
              {metadataError && <span className="admin-field-error">{metadataError}</span>}
            </label>
          </div>
          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={Boolean(editor.public)}
              onChange={(e) => setEditor({ ...editor, public: e.target.checked })}
            />
            Public
          </label>
        </div>
      )}

      {!isNew && (
        <div className="admin-panel">
          <h3>Recent audit</h3>
          <div className="admin-audit-mini">
            {audit.length ? (
              audit.map((row) => (
                <p key={row.id}>
                  {formatDate(row.created_at)} | {row.actor_email} | {row.action}
                </p>
              ))
            ) : (
              <p>No audit entries.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
