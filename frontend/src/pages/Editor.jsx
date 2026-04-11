import { useState } from "react";
import "../styles/editor.css";

const ESSAY_TYPES = [
  { value: "all", label: "All", icon: "🌍", bg: "linear-gradient(135deg, #81d4fa, #4dd0c4)" },
  { value: "personal statement", label: "personal statement", icon: "🧠", bg: "linear-gradient(135deg, #d7b4f3, #f4a8c7)" },
  { value: "UC", label: "UC", icon: "🌴", bg: "linear-gradient(135deg, #b3d9f5, #a8d8ea)" },
  { value: "Supplemental", label: "Supplemental", icon: "🧩", bg: "linear-gradient(135deg, #c8e6c9, #a5d6a7)" },
];

const NON_ALL_TYPES = ["personal statement", "UC", "Supplemental"];

function Editor() {
  const [topK, setTopK] = useState(3);
  const [results, setResults] = useState([]);
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [essayTypes, setEssayTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const total = 5;

  const toggleEssayType = (value) => {
    setEssayTypes((prev) => {
      if (value === "all") {
        const allSelected = NON_ALL_TYPES.every((t) => prev.includes(t)) && prev.includes("all");
        return allSelected ? [] : ["all", ...NON_ALL_TYPES];
      } else {
        const next = prev.includes(value)
          ? prev.filter((t) => t !== value)
          : [...prev, value];

        const allNonAllSelected = NON_ALL_TYPES.every((t) => next.includes(t));

        if (allNonAllSelected && !next.includes("all")) return ["all", ...next];
        if (!allNonAllSelected && next.includes("all")) return next.filter((t) => t !== "all");

        return next;
      }
    });
  };

  const testEndpoints = async () => {
    setIsLoading(true);

    try {
      const response = await fetch("http://44.201.62.0:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topK: topK,
          essay_type: essayTypes.includes("all") ? ["all"] : essayTypes,
          topic: topic,
          content: draft,
        }),
      });

      const data = await response.json();
      setResults(data);

    } catch (error) {
      console.error("ERROR:", error);
      setResults([{ topic: "Error", content_preview: "Failed to fetch" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setTopic("");
    setDraft("");
    setEssayTypes([]);
    setTopK(3);
    setResults([]);
  };

  return (
    <>
      {modalMessage && (
        <div className="modal-overlay" onClick={() => setModalMessage("")}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">{modalMessage}</p>
            <button className="modal-button" onClick={() => setModalMessage("")}>
              我知道了
            </button>
          </div>
        </div>
      )}

      <div className="editor-container">
        <div className="editor-main">

          {/* Input */}
          <div className="input-panel">
            <h3>Draft Workspace</h3>

            <div className="essay-type-inline">
              <div className="essay-type-inline-label">Essay Type</div>

              <div className="essay-type-inline-grid">
                {ESSAY_TYPES.map((type) => {
                  const isSelected = essayTypes.includes(type.value);

                  return (
                    <button
                      key={type.value}
                      className={`essay-type-chip ${isSelected ? "chip-selected" : ""}`}
                      onClick={() => toggleEssayType(type.value)}
                    >
                      <div className="chip-icon" style={{ background: type.bg }}>
                        {type.icon}
                      </div>

                      <span className="chip-label">{type.label}</span>

                      {isSelected && <span className="chip-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              className="text-input"
              type="text"
              placeholder="Topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />

            <textarea
              className="text-area"
              placeholder="Write your essay..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />

            <div className="btn-row">
              <button
                className={`primary-btn ${isLoading ? "loading" : ""}`}
                onClick={testEndpoints}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="btn-loading">
                    <span className="spinner" />
                    Searching...
                  </span>
                ) : "Generate Matches"}
              </button>

              <button className="clear-btn" onClick={handleClear}>
                Clear
              </button>
            </div>
          </div>

          {/* Output */}
          <div className="output-panel">
            <div className="top-bar">
              <h3 className="top-title">Top Results</h3>

              <div className="slider-box">
                <div className="slider-header">
                  <span className="slider-label">Top K Results</span>
                  <span className="slider-value">{topK}</span>
                </div>

                <div className="slider-wrapper">
                  <input
                    className="slider"
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                  />

                  <div className="slider-ticks">
                    {[...Array(total)].map((_, i) => (
                      <span
                        key={i}
                        style={{ left: `${(i / (total - 1)) * 100}%` }}
                      >
                        {i + 1}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="output-scroll">
              {Array.from({ length: topK }).map((_, i) => (
              <div
                className="result-box result-clickable"
                key={i}
              >
                <div className="result-header">
                  <div className="result-header-left">
                    <span className={`rank-circle rank-${i + 1}`}>
                      {i + 1}
                    </span>

                    <div className="result-title-block">
                      {/* ✅ Topic（可點 + 可複製） */}
                      <h4
                        className="result-topic clickable-text"
                        onClick={() => {
                          const selection = window.getSelection().toString();
                          if (selection) return;

                          if (!results[i]) return;

                          localStorage.setItem("userDraft", draft);
                          localStorage.setItem("userTopic", topic);

                          window.open(
                            `${window.location.origin}/essay/${results[i].parent_id}`,
                            "_blank"
                          );
                        }}
                      >
                        {results[i]?.topic || "Topic"}
                      </h4>

                      {/* school + type */}
                      <div className="meta-badges">
                        {results[i]?.school && results[i].school !== "none" && (
                          <span className="meta-badge">
                            {results[i].school}
                          </span>
                        )}

                        {results[i]?.type && (
                          <span className="meta-badge">
                            {results[i].type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* score */}
                  <div className="school-badge">
                    {results[i]?.similarity ?? ""}
                  </div>
                </div>

                <div className="result-preview">
                  {results[i] ? (
                    <>
                      <pre>{results[i].content_preview}</pre>

                      {/* ✅ Read more */}
                      <span
                        className="read-more clickable-text"
                        onClick={() => {
                          const selection = window.getSelection().toString();
                          if (selection) return;

                          if (!results[i]) return;

                          localStorage.setItem("userDraft", draft);
                          localStorage.setItem("userTopic", topic);

                          window.open(
                            `${window.location.origin}/essay/${results[i].parent_id}`,
                            "_blank"
                          );
                        }}
                      >
                        Read more →
                      </span>
                    </>
                  ) : (
                    <span className="placeholder-text">
                      Result will appear here
                    </span>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Editor;