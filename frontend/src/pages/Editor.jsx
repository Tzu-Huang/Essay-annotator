import { useState } from "react";

function Editor() {

  const [topK, setTopK] = useState(3);
  const [results, setResults] = useState([]);

  // 存使用者輸入
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [essayType, setEssayType] = useState("all");

  const testEndpoints = async () => {
    try {

      const response = await fetch(
        `http://44.201.62.0:8000/search?topK=${topK}&essay_type=${essayType}&topic=${encodeURIComponent(topic)}&content=${encodeURIComponent(draft)}`,
        {
          method: "POST"
        }
      );

      const data = await response.json();

      console.log("BACKEND RESPONSE:", data);

      setResults(
        data.map(item => item.content_preview)
      );

    } catch (error) {

      console.error("ERROR:", error);
      setResults(["Error calling API"]);

    }
  };

  return (
    <div style={{ padding: "40px" }}>

      {/* Essay Type */}
      <div style={{ marginBottom: "20px" }}>
        <label>Essay type </label>

        <select
          value={essayType}
          onChange={(e) => setEssayType(e.target.value)}
        >
          <option>all</option>
          <option>CommonApp</option>
          <option>UC</option>
          <option>Supplemental</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: "40px" }}>

        {/* Input */}
        <div style={{ flex: 1 }}>
          <h3>Input</h3>

          <input
            type="text"
            placeholder="Topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "15px"
            }}
          />

          <textarea
            placeholder="Write your essay..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            style={{ width: "100%", height: "300px" }}
          />

          <button className="primary-btn" onClick={testEndpoints}>
            Generate
          </button>
        </div>

        {/* Output */}
        <div className="output-panel">

          {/* Top Results + Slider */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "20px",
              marginBottom: "20px"
            }}
          >
            <h3 style={{ margin: 0 }}>Top Results</h3>

            {/* Slider */}
            <div style={{ width: "200px" }}>

              <div style={{ marginBottom: "6px" }}>
                Top Query: {topK}
              </div>

              <input
                type="range"
                min="0"
                max="5"
                step="1"
                list="topk-ticks"
                value={topK}
                onChange={(e) => setTopK(Number(e.target.value))}
                style={{ width: "100%" }}
              />

              <datalist id="topk-ticks">
                <option value="0" label="0"></option>
                <option value="1" label="1"></option>
                <option value="2" label="2"></option>
                <option value="3" label="3"></option>
                <option value="4" label="4"></option>
                <option value="5" label="5"></option>
              </datalist>

            </div>
          </div>

          <div className="output-scroll">

            {Array.from({ length: topK }).map((_, i) => (
              <div className="result-box" key={i}>
                <h4>Top {i + 1} Similar Essay</h4>
                <pre>
                  {results[i] || "Result will appear here"}
                </pre>
              </div>
            ))}

            <div className="analysis-box">
              <h4>AI Analysis</h4>
              <p>Analysis will appear here</p>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Editor;