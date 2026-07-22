import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { ESSAY_TYPES } from "../AdminConsole.logic.mjs";

export default function UploadEssaysPage({ onBack, onSubmit, uploading, failed, createdCount, batchComplete, onStartNew }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileMeta, setFileMeta] = useState({});

  function handleFileSelect(event) {
    const newFiles = Array.from(event.target.files || []);
    setSelectedFiles((prev) => {
      const existingNames = new Set(prev.map((file) => file.name));
      return [...prev, ...newFiles.filter((file) => !existingNames.has(file.name))];
    });
    setFileMeta((prev) => {
      const next = { ...prev };
      for (const file of newFiles) {
        if (!next[file.name]) next[file.name] = { type: "", school: "" };
      }
      return next;
    });
    event.target.value = ""; // allow re-selecting a removed file later
  }

  function removeFile(name) {
    setSelectedFiles((prev) => prev.filter((file) => file.name !== name));
    setFileMeta((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  function updateMeta(name, field, value) {
    setFileMeta((prev) => ({ ...prev, [name]: { ...prev[name], [field]: value } }));
  }

  function handleSubmit() {
    onSubmit(selectedFiles, fileMeta);
    setSelectedFiles([]);
    setFileMeta({});
  }

  if (batchComplete) {
    return (
      <div className="admin-editor-page">
        <div className="admin-back-row">
          <button type="button" className="admin-back-btn" onClick={onBack}>
            ← Back to essays
          </button>
        </div>
        <div className="admin-panel admin-editor-header">
          <h1>Upload complete</h1>
          <p className="admin-editor-desc">
            Created {createdCount} essay{createdCount === 1 ? "" : "s"}.
            {failed.length > 0 && ` ${failed.length} file${failed.length === 1 ? "" : "s"} couldn't be processed.`}
          </p>
          {failed.length > 0 && (
            <div className="admin-upload-failed-list">
              <strong>Files that need attention:</strong>
              <ul>
                {failed.map((item) => (
                  <li key={item.filename}>
                    <strong>{item.filename}</strong> — {item.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="admin-upload-actions">
            <button type="button" className="primary" onClick={onStartNew}>
              Upload more essays
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-editor-page">
      <div className="admin-back-row">
        <button type="button" className="admin-back-btn" onClick={onBack}>
          ← Back to essays
        </button>
      </div>

      <div className="admin-panel admin-editor-header">
        <h1>Upload essays</h1>
        <p className="admin-editor-desc">Select files, then set type/school for each before extracting.</p>
      </div>

      <div className="admin-panel">
        <p className="admin-field-hint">
          Make sure each file includes the essay's prompt/question — we'll try to detect it automatically.
        </p>

        <label className="admin-upload-dropzone">
          <UploadCloud size={20} />
          <span>Drop .txt / .docx / .pdf files here, or click to browse</span>
          <input type="file" multiple accept=".txt,.docx,.pdf" onChange={handleFileSelect} hidden />
        </label>

        {failed.length > 0 && (
          <div className="admin-upload-failed-list">
            <strong>
              {failed.length} file{failed.length === 1 ? "" : "s"} couldn't be processed last time:
            </strong>
            <ul>
              {failed.map((item) => (
                <li key={item.filename}>
                  <strong>{item.filename}</strong> — {item.error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {selectedFiles.map((file) => (
          <div key={file.name} className="admin-upload-card">
            <div className="admin-upload-card-head">
              <div>
                <div className="admin-upload-filename">{file.name}</div>
                <div className="admin-upload-filemeta">{Math.round(file.size / 1024)} KB</div>
              </div>
              <button
                type="button"
                className="admin-upload-remove"
                onClick={() => removeFile(file.name)}
                aria-label={`Remove ${file.name}`}
              >
                ×
              </button>
            </div>
            <div className="admin-form-grid">
              <label>
                <span className="admin-field-label">Type</span>
                <select
                  value={fileMeta[file.name]?.type || ""}
                  onChange={(e) => updateMeta(file.name, "type", e.target.value)}
                >
                  <option value="">Select a type…</option>
                  {ESSAY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="admin-field-label">School</span>
                <input
                  value={fileMeta[file.name]?.school || ""}
                  onChange={(e) => updateMeta(file.name, "school", e.target.value)}
                  placeholder="School"
                />
              </label>
            </div>
          </div>
        ))}

        {selectedFiles.length > 0 && (
          <div className="admin-upload-actions">
            <button type="button" className="primary" onClick={handleSubmit} disabled={uploading}>
              {uploading ? "Extracting…" : "Extract & review →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
