import { useEffect, useRef, useState } from "react";
import { RefreshCw, Save, Trash2 } from "lucide-react";
import { ESSAY_TYPES, formatDate, formatNumber, isConfirmIdMatch, isContentDirty } from "../AdminConsole.logic.mjs";
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
  regeneratingEmbedding,
  hardDeleteConfirmId,
  setHardDeleteConfirmId,
  onContentEditingChange,
  onContentDraftChange,
}) {
  const isNew = !essay?.id;

  const [contentEditing, setContentEditing] = useState(false);
  const [contentDraft, setContentDraft] = useState(editor.content || "");
  const [contentAreaHeight, setContentAreaHeight] = useState(null);
  const contentBoxRef = useRef(null);

  function startEditingContent() {
    if (contentBoxRef.current) {
      setContentAreaHeight(contentBoxRef.current.offsetHeight);
    }
    setContentEditing(true);
  }

  // New essays start with the details form already open -- there's nothing
  // saved yet to protect behind an Edit gate. Existing essays start locked,
  // matching the content section's edit-to-unlock pattern.
  const [detailsEditing, setDetailsEditing] = useState(isNew);
  const [detailsDraft, setDetailsDraft] = useState({
    topic: editor.topic || "",
    type: editor.type || "",
    school: editor.school || "",
    public: Boolean(editor.public),
    generatedTitle: editor.metadata?.generated_title || "",
  });

  // Resync local drafts when `editor.content` changes out from under us (essay
  // switch). Adjusted during render rather than in a useEffect, per
  // https://react.dev/learn/you-might-not-need-an-effect ("Adjusting some
  // state when a prop changes") — avoids an extra render pass and the
  // react-hooks/set-state-in-effect lint rule.
  const [syncedContent, setSyncedContent] = useState(editor.content);
  if (editor.content !== syncedContent) {
    setSyncedContent(editor.content);
    setContentDraft(editor.content || "");
  }

  const isDeleted = Boolean(essay?.deleted_at);

  useEffect(() => {
    onContentEditingChange?.(contentEditing);
  }, [contentEditing, onContentEditingChange]);

  useEffect(() => {
    onContentDraftChange?.(contentDraft);
  }, [contentDraft, onContentDraftChange]);

  function startEditingDetails() {
    setDetailsDraft({
      topic: editor.topic || "",
      type: editor.type || "",
      school: editor.school || "",
      public: Boolean(editor.public),
      generatedTitle: editor.metadata?.generated_title || "",
    });
    setDetailsEditing(true);
  }

  function cancelEditingDetails() {
    setDetailsEditing(false);
  }

  function commitEditingDetails() {
    const trimmedTitle = detailsDraft.generatedTitle.trim();
    const nextMetadata = { ...(editor.metadata || {}) };
    if (trimmedTitle) {
      nextMetadata.generated_title = trimmedTitle;
    } else {
      delete nextMetadata.generated_title;
    }
    setEditor({
      ...editor,
      topic: detailsDraft.topic,
      type: detailsDraft.type,
      school: detailsDraft.school,
      public: detailsDraft.public,
      metadata: nextMetadata,
    });
    setDetailsEditing(false);
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
              <button onClick={onSave}>
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
      </div>

      <div className="admin-editor-body">
        <div className="admin-editor-main">
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
                  <button type="button" className="admin-icon-button" onClick={startEditingContent}>
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
                      ✓ Done
                    </button>
                  </div>
                )}
              </div>
              {contentEditing && (
                <p className="admin-field-hint">
                  This only updates the draft below — click the page's top-level <strong>Save</strong> to actually persist it.
                </p>
              )}
              {!contentEditing ? (
                <div ref={contentBoxRef} className="admin-content-box">
                  {essay?.content || editor.content || "No content loaded."}
                </div>
              ) : (
                <textarea
                  className="admin-content-textarea"
                  style={contentAreaHeight ? { height: contentAreaHeight } : undefined}
                  value={contentDraft}
                  onChange={(e) => setContentDraft(e.target.value)}
                />
              )}
            </div>
          )}
        </div>

        <div className="admin-editor-side">
          {!isDeleted && (
            <div className="admin-panel">
              <div className="admin-panel-head-row">
                <h3>Details &amp; metadata</h3>
                {!detailsEditing ? (
                  <button type="button" className="admin-icon-button" onClick={startEditingDetails}>
                    ✎ Edit
                  </button>
                ) : (
                  <div className="admin-actions">
                    <button type="button" onClick={cancelEditingDetails}>
                      Cancel
                    </button>
                    <button type="button" className="primary" onClick={commitEditingDetails}>
                      ✓ Done
                    </button>
                  </div>
                )}
              </div>
              {detailsEditing && (
                <p className="admin-field-hint">
                  This only updates the draft below — click the page's top-level <strong>Save</strong> to actually persist it.
                </p>
              )}

              <div className="admin-form-grid">
                <label className="admin-form-grid-full">
                  <span className="admin-field-label">Topic</span>
                  {detailsEditing ? (
                    <textarea
                      className="admin-topic-textarea"
                      value={detailsDraft.topic}
                      onChange={(e) => setDetailsDraft({ ...detailsDraft, topic: e.target.value })}
                    />
                  ) : (
                    <p className="admin-readonly-value admin-readonly-wrap">{editor.topic || "none"}</p>
                  )}
                </label>
                <label>
                  <span className="admin-field-label">Type</span>
                  {detailsEditing ? (
                    <select
                      value={detailsDraft.type}
                      onChange={(e) => setDetailsDraft({ ...detailsDraft, type: e.target.value })}
                    >
                      <option value="">Select a type…</option>
                      {ESSAY_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="admin-readonly-value">{editor.type || "none"}</span>
                  )}
                </label>
                <label>
                  <span className="admin-field-label">School</span>
                  {detailsEditing ? (
                    <input
                      value={detailsDraft.school}
                      onChange={(e) => setDetailsDraft({ ...detailsDraft, school: e.target.value })}
                    />
                  ) : (
                    <span className="admin-readonly-value">{editor.school || "none"}</span>
                  )}
                </label>
                <label>
                  <span className="admin-field-label">Source</span>
                  <span className="admin-readonly-value" title="Source file is set on import and can't be edited">
                    {editor.source_file || "none"}
                  </span>
                </label>
                <label className="admin-form-grid-full">
                  <span className="admin-field-label">Generated title</span>
                  {detailsEditing ? (
                    <input
                      value={detailsDraft.generatedTitle}
                      onChange={(e) => setDetailsDraft({ ...detailsDraft, generatedTitle: e.target.value })}
                      placeholder="Short display title (optional)"
                    />
                  ) : (
                    <span className="admin-readonly-value">{editor.metadata?.generated_title || "none"}</span>
                  )}
                </label>
              </div>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={detailsEditing ? detailsDraft.public : Boolean(editor.public)}
                  disabled={!detailsEditing}
                  onChange={(e) => setDetailsDraft({ ...detailsDraft, public: e.target.checked })}
                />
                Public
              </label>
            </div>
          )}

          {isDeleted ? (
            <div className="admin-panel">
              <h3>Deleted essay</h3>
              <div className="admin-actions">
                <button onClick={onRestore}>Restore</button>
              </div>
              <input
                value={hardDeleteConfirmId}
                onChange={(e) => setHardDeleteConfirmId(e.target.value)}
                placeholder="Type essay ID to confirm"
              />
              <button className="danger" disabled={!isConfirmIdMatch(hardDeleteConfirmId, essay.id)} onClick={onHardDelete}>
                Hard Delete
              </button>
            </div>
          ) : isNew ? (
            <div className="admin-panel admin-editor-side-empty">
              <h3>Overview</h3>
              <p className="admin-panel-sub">
                Embedding status, word count, and audit history will show up here once this essay is saved.
              </p>
            </div>
          ) : (
            <div className="admin-panel">
              <h3>Overview</h3>
              <div className="admin-meta-grid admin-meta-grid-readonly">
                <MetaItem label="Words" value={formatNumber(essay.word_count)} />
                <MetaItem label="Embedding" value={essay.embedding_status || "unknown"} />
                <MetaItem label="Updated" value={formatDate(essay.updated_at)} />
              </div>
              <div className="admin-actions admin-editor-side-actions">
                <button type="button" onClick={onRegenerateEmbedding} disabled={regeneratingEmbedding}>
                  <RefreshCw size={16} className={regeneratingEmbedding ? "spin" : ""} /> Regenerate Embedding
                </button>
              </div>
            </div>
          )}

          {!isNew && (
            <div className="admin-panel">
              <h3>Recent audit</h3>
              <p className="admin-panel-sub">Change history for this essay only — create/edit/delete/embedding events, most recent first.</p>
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
      </div>
    </div>
  );
}
