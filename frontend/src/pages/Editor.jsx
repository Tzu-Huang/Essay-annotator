import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/editor.css";

const ESSAY_TYPES = [
  { value: "all",          label: "All",          icon: "🌍", bg: "linear-gradient(135deg, #81d4fa, #4dd0c4)" },
  { value: "CommonApp",    label: "Common App",   icon: "🧠", bg: "linear-gradient(135deg, #d7b4f3, #f4a8c7)" },
  { value: "UC",           label: "UC",           icon: "🌴", bg: "linear-gradient(135deg, #b3d9f5, #a8d8ea)" },
  { value: "Supplemental", label: "Supplemental", icon: "🧩", bg: "linear-gradient(135deg, #c8e6c9, #a5d6a7)" },
];

const RANK_LABELS = ["1st", "2nd", "3rd", "4th", "5th"];

function Editor() {
  const [topK, setTopK] = useState(0);
  const [results, setResults] = useState([]);
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [essayType, setEssayType] = useState("all");
  const [selectedEssay, setSelectedEssay] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const testEndpoints = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://44.201.62.0:8000/search?topK=${topK}&essay_type=${essayType}&topic=${encodeURIComponent(
          topic
        )}&content=${encodeURIComponent(draft)}`,
        { method: "POST" }
      );
      const data = await response.json();
      console.log("BACKEND RESPONSE:", data);
      setResults(data);
    } catch (error) {
      console.error("ERROR:", error);
      setResults(["Error calling API"]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="editor-container">
      {/* Essay Type 圖示卡片選擇器 */}
      <div className="essay-type-section">
        <div className="section-label">
          <span className="label-icon">📝</span>
          Essay Type
        </div>
        <div className="essay-type-grid">
          {ESSAY_TYPES.map((type) => (
            <button
              key={type.value}
              className={`essay-type-card ${essayType === type.value ? "selected" : ""}`}
              onClick={() => setEssayType(type.value)}
            >
              <div className="essay-type-icon" style={{ background: type.bg }}>
                {type.icon}
              </div>
              <span className="essay-type-label">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="editor-main">
        {/* Input */}
        <div className="input-panel">
          <h3>Input</h3>
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
              "Generate"
            )}
          </button>
        </div>

        {/* Output */}
        <div className="output-panel">
          <div className="top-bar">
            <h3 className="top-title">Top Results</h3>
            <div className="slider-box">
              <div className="slider-label">Top Query: {topK}</div>
              <input
                className="slider"
                type="range"
                min="0"
                max="5"
                step="1"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
              />
              <div className="slider-ticks">
                {[0, 1, 2, 3, 4, 5].map((n) => (
                  <span key={n} style={{ left: `${6+(n / 5) * 90}%` }}>{n}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="output-scroll">
            {Array.from({ length: topK }).map((_, i) => (
              <div
                className="result-box result-clickable"
                key={i}
                onClick={() => {
                  if (results[i]) {
                    // 先把使用者草稿存進 localStorage
                    localStorage.setItem("userDraft", draft);
                    localStorage.setItem("userTopic", topic);

                    const realId = results[i].id.split("_").slice(0, 2).join("_");
                    window.open(`/essay/${realId}`, "_blank");
                  }
                }}
              >
                <div className="result-header">
                  <span className="rank-badge">{RANK_LABELS[i]}</span>
                  <h4 className="result-topic">{results[i]?.topic || "Topic"}</h4>
                </div>
                <div className="result-preview">
                  {results[i] ? (
                    <pre>{results[i].content_preview}</pre>
                  ) : (
                    <span className="placeholder-text">Result will appear here</span>
                  )}
                </div>
              </div>
            ))}

            {selectedEssay && (
              <div className="result-box">
                <h4>Full Essay</h4>
                <h5>{selectedEssay.topic}</h5>
                <pre>{selectedEssay.content}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Editor;