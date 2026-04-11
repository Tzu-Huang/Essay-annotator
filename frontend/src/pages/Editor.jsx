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
    value: "personal statement",
    label: "personal statement",
    icon: personalIcon,
    bg: "linear-gradient(135deg, #d7b4f3, #f4a8c7)",
  },
  {
    value: "UC",
    label: "UC",
    icon: ucIcon,
    bg: "linear-gradient(135deg, #b3d9f5, #a8d8ea)",
  },
  {
    value: "Supplemental",
    label: "Supplemental",
    icon: supplementalIcon,
    bg: "linear-gradient(45deg, #f3f3ef, #f3f040)",
  },
];

const TYPE_STYLES = {
  "personal statement": {
    borderColor: "#facbf7",
    rankBg: "#f4a8c7",
    badgeBg: "#f8e4f3",
    badgeText: "#a8558f",
    readMore: "#c06bb2",
  },
  UC: {
    borderColor: "#b3d9f5",
    rankBg: "#a8d8ea",
    badgeBg: "#e8f4fb",
    badgeText: "#4b8fb0",
    readMore: "#5aa6c8",
  },
  Supplemental: {
    borderColor: "rgb(251, 245, 170)",
    rankBg: "#ebeb30",
    badgeBg: "#f9f8cf",
    badgeText: "#8a8613",
    readMore: "#a6a11d",
  },
};

const DEFAULT_RESULT_STYLE = {
  borderColor: "#6366f1",
  rankBg: "#f2cb76",
  badgeBg: "#eef2ff",
  badgeText: "#4f46e5",
  readMore: "#4f46e5",
};

const NON_ALL_TYPES = ["personal statement", "UC", "Supplemental"];

function normalizeResultType(result) {
  const rawType = result?.type?.toLowerCase?.().trim?.() || "";
  const rawSchool = result?.school?.toLowerCase?.().trim?.() || "";

  if (rawType === "personal statement") return "personal statement";
  if (rawType === "uc piq") return "UC";

  if (
    rawType === "supplementals" ||
    (rawSchool && rawSchool !== "none" && rawType !== "uc" && rawType !== "personal statement")
  ) {
    return "Supplemental";
  }

  return null;
}

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
        const allSelected =
          NON_ALL_TYPES.every((t) => prev.includes(t)) && prev.includes("all");
        return allSelected ? [] : ["all", ...NON_ALL_TYPES];
      } else {
        const next = prev.includes(value)
          ? prev.filter((t) => t !== value)
          : [...prev, value];

        const allNonAllSelected = NON_ALL_TYPES.every((t) => next.includes(t));

        if (allNonAllSelected && !next.includes("all")) return ["all", ...next];
        if (!allNonAllSelected && next.includes("all"))
          return next.filter((t) => t !== "all");

        return next;
      }
    });
  };

  const testEndpoints = async () => {
    const trimmedTopic = topic.trim();//trim() 是把字串前後的空白拿掉。
    const trimmedDraft = draft.trim();

    // 1. Essay Type 必選
    if (essayTypes.length === 0) {
      setModalMessage("Please select at least one essay type before generating.");
      return;
    }

    // 2. Topic / Draft 至少填一個
    if (!trimmedTopic && !trimmedDraft) {
      setModalMessage("Please enter either a topic or a draft before generating.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://44.201.62.0:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topK: topK,
          essay_type: essayTypes.includes("all") ? ["all"] : essayTypes,
          topic: trimmedTopic,
          content: trimmedDraft,
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
              <div className="essay-type-inline-label">Essay Type</div>

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
              {Array.from({ length: topK }).map((_, i) => {
                const normalizedType = normalizeResultType(results[i]);
                const typeStyle = TYPE_STYLES[normalizedType] || DEFAULT_RESULT_STYLE;

                return (
                  <div
                    className="result-box result-clickable"
                    key={i}
                    style={{ borderLeftColor: typeStyle.borderColor }}
                  >
                    <div className="result-header">
                      <div className="result-header-left">
                        <span
                          className="rank-circle"
                          style={{ background: typeStyle.rankBg }}
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
                            {results[i]?.school && results[i].school !== "none" && (
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

                            {results[i]?.type && (
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
                          background: typeStyle.badgeBg,
                          color: typeStyle.badgeText,
                        }}
                      >
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
                            style={{ color: typeStyle.readMore }}
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