import { useState } from "react";
import "../styles/editor.css";

const ESSAY_TYPES = [
  {
    value: "all",
    label: "All",
    shortLabel: "ALL",
    dotClass: "all",
  },
  {
    value: "Personal Statement",
    label: "Personal Statement",
    shortLabel: "PS",
    dotClass: "ps",
  },
  {
    value: "University of California",
    label: "UC",
    shortLabel: "UC",
    dotClass: "uc",
  },
  {
    value: "Supplemental",
    label: "Supplemental",
    shortLabel: "SU",
    dotClass: "su",
  },
];

const TYPE_STYLES = {
  "Personal Statement": {
    badgeBg: "#f4efff",
    badgeText: "#7c3aed",
    matchText: "#7c3aed",
  },
  "University of California": {
    badgeBg: "#edf3ff",
    badgeText: "#4f7cff",
    matchText: "#4f7cff",
  },
  Supplemental: {
    badgeBg: "#eefcf9",
    badgeText: "#14b8a6",
    matchText: "#14b8a6",
  },
};

const DEFAULT_RESULT_STYLE = {
  badgeBg: "#edf3ff",
  badgeText: "#4f7cff",
  matchText: "#4f7cff",
};

const NON_ALL_TYPES = [
  "Personal Statement",
  "University of California",
  "Supplemental",
];

function getSimilarityInfo(similarity) {
  if (similarity === null || similarity === undefined || similarity === "") {
    return {
      label: "",
      bg: "#edf3ff",
      text: "#4f7cff",
    };
  }

  const rawLabel = String(similarity).trim();
  const numeric = Number(rawLabel);

  if (Number.isNaN(numeric)) {
    return {
      label: rawLabel,
      bg: "#edf3ff",
      text: "#4f7cff",
    };
  }

  const label = `${rawLabel}% similar`;

  if (numeric >= 85) {
    return {
      label,
      bg: "#eefcf9",
      text: "#14b8a6",
    };
  }

  if (numeric >= 70) {
    return {
      label,
      bg: "#edf3ff",
      text: "#4f7cff",
    };
  }

  if (numeric >= 50) {
    return {
      label,
      bg: "#fff7ed",
      text: "#ea580c",
    };
  }

  return {
    label,
    bg: "#fef2f2",
    text: "#dc2626",
  };
}

function Editor() {
  const [topK, setTopK] = useState(3);
  const [results, setResults] = useState([]);
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [essayTypes, setEssayTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [emptyStateMessage, setEmptyStateMessage] = useState("");
  const total = 5;

  const toggleEssayType = (value) => {
    setEssayTypes((prev) => {
      if (value === "all") {
        const allSelected =
          NON_ALL_TYPES.every((t) => prev.includes(t)) && prev.includes("all");
        return allSelected ? [] : ["all", ...NON_ALL_TYPES];
      } else {
        const next = prev.includes(value)
          ? prev.filter((t) => t !== value)
          : [...prev, value];

        const allNonAllSelected = NON_ALL_TYPES.every((t) => next.includes(t));

        if (allNonAllSelected && !next.includes("all")) return ["all", ...next];
        if (!allNonAllSelected && next.includes("all")) {
          return next.filter((t) => t !== "all");
        }

        return next;
      }
    });
  };

  const testEndpoints = async () => {
    const trimmedTopic = topic.trim();
    const trimmedDraft = draft.trim();

    if (essayTypes.length === 0) {
      setModalMessage(
        "Please select at least one essay type before generating.",
      );
      return;
    }

    if (!trimmedTopic && !trimmedDraft) {
      setModalMessage(
        "Please enter either a topic or a draft before generating.",
      );
      return;
    }

    setIsLoading(true);
    setEmptyStateMessage("");

    try {
      console.log(
        "essay_types being sent:",
        essayTypes.includes("all") ? ["all"] : essayTypes,
      );

      const response = await fetch(`${import.meta.env.VITE_API_URL}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topK: topK,
          essay_types: essayTypes.includes("all") ? ["all"] : essayTypes,
          topic: trimmedTopic,
          content: trimmedDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || "Search failed");
      }

      // Search API returns { results: [...] } — unwrap before using
      const results = data.results ?? data;

      console.log("search response:", results);
      console.log(
        "types received:",
        Array.isArray(results) ? results.map((item) => item.type) : [],
      );

      if (!Array.isArray(results) || results.length === 0) {
        setResults([]);
        setEmptyStateMessage(
          "No matching essays found. Please try a different topic, add more draft details, or choose broader essay types.",
        );
        setModalMessage(
          "We couldn’t find a match for that input. Please try another topic or add a bit more detail to your draft.",
        );
        return;
      }

      setResults(results);
    } catch (error) {
      console.error("ERROR:", error);
      setResults([]);
      setEmptyStateMessage(
        "Search couldn’t be completed. Please revise your input and try again.",
      );
      setModalMessage(
        error.message || "Search failed. Please try another topic or draft.",
      );
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
    setEmptyStateMessage("");
  };

  const openResult = (result) => {
    const selection = window.getSelection().toString();
    if (selection || !result) return;

    localStorage.setItem("userDraft", draft);
    localStorage.setItem("userTopic", topic);

    window.open(`${window.location.origin}/essay/${result.parent_id}`, "_blank");
  };

  return (
    <>
      {modalMessage && (
        <div className="modal-overlay" onClick={() => setModalMessage("")}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">{modalMessage}</p>
            <button
              className="modal-button"
              onClick={() => setModalMessage("")}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <main className="editor-page">
        <section className="editor-hero">
          <div>
            <p className="editor-eyebrow">Writing Workspace</p>
            <h1 className="editor-hero-title">
              Find essays that match your idea.
            </h1>
            <p className="editor-hero-subtitle">
              Select your essay type, set how many matches you want, and compare
              your draft with similar essays from the database.
            </p>
          </div>

          <div className="editor-status-pill">Similarity Search Ready</div>
        </section>

        <section className="editor-app">
          {/* Left setup column */}
          <aside className="editor-setup-panel">
            <div className="editor-block">
              <div className="editor-section-label">
                Essay Type <span className="required">*</span>
              </div>

              <div className="essay-chip-list">
                {ESSAY_TYPES.map((type) => {
                  const isSelected = essayTypes.includes(type.value);

                  return (
                    <button
                      type="button"
                      key={type.value}
                      className={`essay-chip ${isSelected ? "selected" : ""}`}
                      onClick={() => toggleEssayType(type.value)}
                    >
                      <span className="essay-chip-left">
                        <span className={`essay-dot ${type.dotClass}`}>
                          {type.shortLabel}
                        </span>
                        <span className="essay-chip-name">{type.label}</span>
                      </span>

                      {isSelected && <span className="essay-chip-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="editor-block">
              <div className="editor-section-label">Top K Results</div>

              <div className="topk-card">
                <div className="topk-head">
                  <span className="topk-title">Show Matches</span>
                  <span className="topk-value">{topK}</span>
                </div>

                <input
                  className="topk-slider"
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                />

                <div className="topk-labels">
                  {[...Array(total)].map((_, i) => (
                    <span key={i}>{i + 1}</span>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Center writing column */}
          <section className="editor-draft-panel">
            <div className="editor-field">
              <label className="editor-field-label">Topic</label>
              <textarea
                className="topic-input"
                placeholder="Topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="editor-field editor-field-grow">
              <label className="editor-field-label">Draft Workspace</label>
              <textarea
                className="draft-input"
                placeholder="Write your essay..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
            </div>

            <div className="editor-action-bar">
              <p className="editor-action-note">
                Your topic and draft will be used to search for similar essays.
                Open a result to compare it with your writing.
              </p>

              <div className="editor-actions">
                <button className="secondary-btn" onClick={handleClear}>
                  Clear
                </button>

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
                  ) : (
                    "Generate Matches"
                  )}
                </button>
              </div>
            </div>
          </section>

          {/* Right results column */}
          <aside className="editor-results-panel">
            <div className="results-head">
              <div>
                <h2>Similar Essays</h2>
                <p>
                  {results.length > 0
                    ? `${Math.min(topK, results.length)} strong matches found`
                    : "Results will appear here"}
                </p>
              </div>

              <span className="live-pill">Live Preview</span>
            </div>

            <div className="results-list">
              {emptyStateMessage && (
                <div className="empty-state-box">
                  <p className="empty-state-title">No results yet</p>
                  <p className="empty-state-text">{emptyStateMessage}</p>
                </div>
              )}

              {Array.from({ length: topK }).map((_, i) => {
                const result = results[i];
                const resultType = result?.type;
                const typeStyle =
                  TYPE_STYLES[resultType] || DEFAULT_RESULT_STYLE;
                const similarityInfo = getSimilarityInfo(result?.similarity);

                return (
                  <article
                    className={`result-card ${result ? "result-clickable" : ""}`}
                    key={i}
                    onClick={() => openResult(result)}
                  >
                    <div
                      className="result-match"
                      style={{ color: typeStyle.matchText }}
                    >
                      {similarityInfo.label || `Match ${i + 1}`}
                    </div>

                    <h3 className="result-topic">
                      {result?.topic || "Result will appear here"}
                    </h3>

                    <div className="result-meta">
                      {result?.school &&
                        result.school.toLowerCase() !== "none" && (
                          <span
                            className="meta-chip"
                            style={{
                              background: typeStyle.badgeBg,
                              color: typeStyle.badgeText,
                            }}
                          >
                            {result.school}
                          </span>
                        )}

                      {result?.type && result.type.toLowerCase() !== "none" && (
                        <span
                          className="meta-chip"
                          style={{
                            background: typeStyle.badgeBg,
                            color: typeStyle.badgeText,
                          }}
                        >
                          {result.type}
                        </span>
                      )}
                    </div>

                    <div className="result-preview">
                      {result ? (
                        <p>{result.content_preview}</p>
                      ) : (
                        <p className="placeholder-text">
                          Generate matches to see a similar essay preview.
                        </p>
                      )}
                    </div>

                    {result && (
                      <button
                        type="button"
                        className="read-more"
                        onClick={(e) => {
                          e.stopPropagation();
                          openResult(result);
                        }}
                      >
                        Read Essay →
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </aside>
        </section>
      </main>
    </>
  );
}

export default Editor;
