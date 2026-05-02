import { useState } from "react";
import "../styles/editor.css";
//import allIcon from "../assets/essayTypes/all.png";
import personalIcon from "../assets/essayTypes/personal-statement.png";
import ucIcon from "../assets/essayTypes/uc.png";
import supplementalIcon from "../assets/essayTypes/supplemental.png";

const ESSAY_TYPES = [
  {
    value: "all",
    label: "All",
    icon: "🌍",
    bg: "linear-gradient(135deg, #81d4fa, #4dd0c4)",
  },
  {
    value: "Personal Statement",
    label: "Personal Statement",
    icon: personalIcon,
    bg: "linear-gradient(135deg, #d7b4f3, #f4a8c7)",
  },
  {
    value: "University of California",
    label: "UC",
    icon: ucIcon,
    bg: "linear-gradient(135deg, #b3d9f5, #a8d8ea)",
  },
  {
    value: "Supplemental",
    label: "Supplemental",
    icon: supplementalIcon,
    bg: "linear-gradient(45deg, #eeeec4, #f3f040)",
  },
];

const TYPE_STYLES = {
  "Personal Statement": {
    //accentGradient: "linear-gradient(180deg, #efd6e9 0%, #f4a8c7 100%)",
    accentGradient: "linear-gradient(180deg, #6366f1 0%, #38bdf8 100%)",
    badgeBg: "#f8e4f3",
    badgeText: "#a8558f",
  },
  "University of California": {
    //accentGradient: "linear-gradient(180deg, #d1e5f3 0%, #8dcee5 100%)",
    accentGradient: "linear-gradient(180deg, #6366f1 0%, #38bdf8 100%)",
    badgeBg: "#e8f4fb",
    badgeText: "#4b8fb0",
  },
  Supplemental: {
    //accentGradient: "linear-gradient(180deg, #ffffd6 0%, #f3f040 100%)",
    accentGradient: "linear-gradient(180deg, #6366f1 0%, #38bdf8 100%)",
    badgeBg: "#f9f8cf",
    badgeText: "#8a8613",
  },
};

const DEFAULT_RESULT_STYLE = {
  accentGradient: "linear-gradient(180deg, #6366f1 0%, #a1d9f1 100%)",
  badgeBg: "#eef2ff",
  badgeText: "#4f46e5",
};

const RANK_STYLES = {
  1: { bg: "#fde68a", text: "#713f12" }, // deeper gold
  2: { bg: "#fed7aa", text: "#7c2d12" }, // deeper bronze
  3: { bg: "#fad1e8", text: "#701a75" }, // deeper pink
  4: { bg: "#d0d9fc", text: "#3730a3" }, // deeper violet
  5: { bg: "#e2dcfa", text: "#5b21b6" }, // deeper purple
};

const NON_ALL_TYPES = ["Personal Statement", "University of California", "Supplemental"];


function getSimilarityInfo(similarity) {
  if (similarity === null || similarity === undefined || similarity === "") {
    return {
      label: "",
      bg: "#eef2ff",
      text: "#4f46e5",
    };
  }

  const rawLabel = String(similarity).trim();
const numeric = Number(rawLabel);

if (Number.isNaN(numeric)) {
  return {
    label: rawLabel,
    bg: "#eef2ff",
    text: "#4f46e5",
  };
}

const label = `${rawLabel}% similar`;

if (numeric >= 85) {
  return {
    label,
    bg: "#dcfce7",
    text: "#15803d",
  };
}

if (numeric >= 70) {
  return {
    label,
    bg: "#dbeafe",
    text: "#1d4ed8",
  };
}

if (numeric >= 50) {
  return {
    label,
    bg: "#fef3c7",
    text: "#b45309",
  };
}

return {
  label,
  bg: "#fee2e2",
  text: "#b91c1c",
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
      setModalMessage("Please select at least one essay type before generating.");
      return;
    }

    if (!trimmedTopic && !trimmedDraft) {
      setModalMessage("Please enter either a topic or a draft before generating.");
      return;
    }

    setIsLoading(true);
    setEmptyStateMessage("");

    try {
      console.log(
        "essay_types being sent:",
        essayTypes.includes("all") ? ["all"] : essayTypes
      );

      const response = await fetch("http://44.201.62.0:8000/search", {
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

      console.log("search response:", data);
      console.log("types received:", Array.isArray(data) ? data.map((item) => item.type) : []);

      if (!Array.isArray(data) || data.length === 0) {
        setResults([]);
        setEmptyStateMessage(
          "No matching essays found. Please try a different topic, add more draft details, or choose broader essay types."
        );
        setModalMessage(
          "We couldn’t find a match for that input. Please try another topic or add a bit more detail to your draft."
        );
        return;
      }

      setResults(data);
    } catch (error) {
      console.error("ERROR:", error);
      setResults([]);
      setEmptyStateMessage(
        "Search couldn’t be completed. Please revise your input and try again."
      );
      setModalMessage(
        error.message || "Search failed. Please try another topic or draft."
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

  return (
    <>
      {modalMessage && (
        <div className="modal-overlay" onClick={() => setModalMessage("")}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <p className="modal-text">{modalMessage}</p>
            <button className="modal-button" onClick={() => setModalMessage("")}>
              Got it
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
              <div className="essay-type-inline-label">
                Essay Type <span className="required">*</span>
              </div>

              <div className="essay-type-inline-grid">
                {ESSAY_TYPES.map((type) => {
                  const isSelected = essayTypes.includes(type.value);

                  return (
                    <button
                      type="button"
                      key={type.value}
                      className={`essay-type-chip ${isSelected ? "chip-selected" : ""}`}
                      onClick={() => toggleEssayType(type.value)}
                    >
                      <div className="chip-icon" style={{ background: type.bg }}>
                        {typeof type.icon === "string" && !type.icon.includes("/") ? (
                          <span className="chip-emoji">{type.icon}</span>
                        ) : (
                          <img src={type.icon} alt={type.label} className="chip-icon-img" />
                        )}
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
              {emptyStateMessage && (
                <div className="empty-state-box">
                  <p className="empty-state-title">No results yet</p>
                  <p className="empty-state-text">{emptyStateMessage}</p>
                </div>
              )}

              {Array.from({ length: topK }).map((_, i) => {
                const resultType = results[i]?.type;
                const typeStyle = TYPE_STYLES[resultType] || DEFAULT_RESULT_STYLE;
                const rankStyle = RANK_STYLES[i + 1] || RANK_STYLES[5];
                const similarityInfo = getSimilarityInfo(results[i]?.similarity);

                return (
                  <div
                    className="result-box result-clickable"
                    key={i}
                    style={{
                      position: "relative",
                      overflow: "hidden",
                      borderLeft: "none",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        left: "0",
                        top: "0",
                        bottom: "0",
                        width: "6px",
                        borderRadius: "14px 0 0 14px",
                        background: typeStyle.accentGradient,
                      }}
                    />

                    <div className="result-header">
                      <div className="result-header-left">
                        <span
                          className="rank-circle"
                          style={{
                            background: rankStyle.bg,
                            color: rankStyle.text,
                          }}
                        >
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
                            {results[i]?.school &&
                              results[i].school.toLowerCase() !== "none" && (
                                <span
                                  className="meta-badge"
                                  style={{
                                    background: typeStyle.badgeBg,
                                    color: typeStyle.badgeText,
                                  }}
                                >
                                  {results[i].school}
                                </span>
                              )}

                            {results[i]?.type &&
                              results[i].type.toLowerCase() !== "none" && (
                                <span
                                  className="meta-badge"
                                  style={{
                                    background: typeStyle.badgeBg,
                                    color: typeStyle.badgeText,
                                  }}
                                >
                                  {results[i].type}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* score */}
                      <div
                        className="school-badge"
                        style={{
                          background: similarityInfo.bg,
                          color: similarityInfo.text,
                        }}
                      >
                        {similarityInfo.label}
                      </div>
                    </div>

                    <div className="result-preview">
                      {results[i] ? (
                        <>
                          <pre>{results[i].content_preview}</pre>

                          {/* ✅ Read more */}
                          <span
                            className="read-more clickable-text"
                            style={{ color: "#6b7280" }}
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
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Editor;
