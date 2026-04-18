import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import "../styles/compare.css";

function ComparePage() {
  const { id } = useParams();
  const [userDraft, setUserDraft] = useState("");
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  useEffect(() => {
    setUserDraft(localStorage.getItem("userDraft") || "");
  }, []);

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch essay: ${response.status}`)
        }

        const data = await response.json();
        // Store to state
        setEssay(data);

      } catch (error) {
        console.error("ERROR:", error);
        setError(error.message || "Failed to load essay.");
      } finally {
        setLoading(false);
      }
    };

    fetchEssay();
  }, [id]); // When the id changes, reload the essay

  const runCompare = async () => {
    if (!userDraft.trim()){
        setCompareError("Your draft is empty.");
        return;
    }

    try{
      setCompareLoading(true);
      setCompareError("");
      setCompareResult(null);
      setHoveredPoint(null);
      setSelectedPoint(null);
    
      const response = await fetch(`http://44.201.62.0:8000/compare/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: userDraft,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.detail === "string"
            ? data.detail
            : data?.detail?.error || "Compare failed"
        );
      }
      
      // Organize the data since backend might not return completely yet
      const normalized = {
        essay_id: data.essay_id,
        comparisons: (data.comparisons || []).map((item, index) => ({
          id: index + 1,
          highlighted_sentence: item.highlighted_sentence,

          comparison: item.comparison,

          suggestion: item.suggestion,
          
          // If matched_sentence haven't received yet
          matched_sentence: item.matched_sentence || item.highlighted_sentence,

          matched_paragraph: item.matched_paragraph || "",

          category: item.category || "Feedback",

          color: ["yellow", "green", "pink"][index % 3],
          
          // Highlighted part in user draft
          userParagraphIndex: item.user_paragraph_index ?? index,
          
          // Highlighted part in selected essay
          exampleParagraphIndex: item.example_paragraph_index ?? index,
        })),
      };

      setCompareResult(normalized);
    } catch (error) {
      console.error("COMPARE ERROR:", error);
      setCompareError(error.message || "Compare failed.");
    } finally {
      setCompareLoading(false);
    }
  };

  // activePoint = which part in the screen should be highlighted
  // Rules:
  // 1. if been clicked, selectedPoint first
  // 2. hover second
  const activePoint = selectedPoint || hoveredPoint;

  // Purpose: paragraph -> array
  // Triggered only when userDraft is different
  const userParagraphs = useMemo(() => {
    return userDraft
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [userDraft]);

  const exampleParagraphs = useMemo(() => {
    return (essay?.content || "")
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
  }, [essay]);

  // helper function for user paragraph
  // Find comparesult and feedback point
  const getPointForParagraph = (index) => {
    return compareResult?.comparisons?.find(
      (item) => item.userParagraphIndex === index
    );
  };
  
  // Deactivate hover / selected
  const resetView = () => {
    setHoveredPoint(null);
    setSelectedPoint(null);
  };

  return (
    <div className="compare-page">
      {/* Top area */}
      <div className="compare-header">
        <div>
          <p className="compare-label">Essay Comparison</p>
          <h1>Compare With This Essay</h1>
          <p className="compare-subtitle">Current essay ID: {id}</p>
        </div>

        {/* Right Corner */}
        <div className="header-actions">
          <button className="secondary-btn" onClick={resetView}>
            Reset View
          </button>

          <button
            className="primary-btn"
            onClick={runCompare}
            disabled={compareLoading}
          >
            {compareLoading ? "Comparing..." : "Run Compare"}
          </button>
        </div>
      </div>

      {/* Error detector */}
      {(error || compareError) && (
        <div className="message error-message">{error || compareError}</div>
      )}

      {/* Left and Right side */}
      <div className="compare-layout">
        {/* Left：User Draft */}
        <section className="doc-shell">
          <div className="doc-paper">
            <div className="panel-meta">
              <div>
                <h2>User Draft</h2>
                <p>Main editing target. Feedback points appear here.</p>
              </div>
              <div className="panel-state">Hover + click interaction</div>
            </div>

            <div className="doc-body">
              {userParagraphs.length ? (
                // 把 user draft 每一段渲染出來
                userParagraphs.map((paragraph, index) => {
                  // Find whether there is feedback in this paragraph
                  const point = getPointForParagraph(index);

                  // do regular expression if there is no point
                  if (!point) {
                    return (
                      <p key={index} className="para">
                        {paragraph}
                      </p>
                    );
                  }

                  // if feedback exists -> hover / click highlight
                  return (
                    <p key={index} className="para">
                      <span
                        className={`highlight ${point.color} ${
                          activePoint?.id === point.id ? "active" : ""
                        }`}
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => setSelectedPoint(point)}
                      >
                        {paragraph}
                      </span>

                      {/* 右側小圓點，顯示這是第幾個 feedback */}
                      <span className={`comment-tag ${point.color}`}>
                        {point.id}
                      </span>
                    </p>
                  );
                })
              ) : (
                <p>No user draft found.</p>
              )}
            </div>

            {/* Hint */}
            <div className="hintbar">
              {activePoint
                ? `Point ${activePoint.id} selected. Hover preview and detail popup are active.`
                : "Hover on a highlighted sentence to preview the matched paragraph on the right."}
            </div>
          </div>
        </section>

        {/* Right：Selected Essay Example */}
        <section className="doc-shell">
          <div className="doc-paper">
            <div className="panel-meta">
              <div>
                <h2>Selected Essay Example</h2>
                <p>This is the database essay used for comparison.</p>
              </div>

              {/* Right corner: compare essay_id */}
              <div className="panel-state">
                {compareResult?.essay_id
                  ? `essay_id: ${compareResult.essay_id}`
                  : "Reference essay"}
              </div>
            </div>

            <div className="doc-body">
              {loading ? (
                <p>Loading...</p>
              ) : exampleParagraphs.length ? (
                // 把右邊 essay 每一段渲染出來
                exampleParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`para example-paragraph ${
                      // 如果這一段剛好是 activePoint 對應的 example 段落，就加 active class
                      activePoint?.exampleParagraphIndex === index ? "active" : ""
                    } ${
                      // 同時也加上顏色 class
                      activePoint?.exampleParagraphIndex === index
                        ? activePoint.color
                        : ""
                    }`}
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p>No essay found.</p>
              )}
            </div>

            {/* Right buttom hint */}
            <div className="hintbar">
              {activePoint
                ? `This paragraph is linked to feedback point ${activePoint.id}.`
                : "No linked paragraph selected yet."}
            </div>
          </div>
        </section>
      </div>

      {/* popup: only when selectedPoint exists */}
      {selectedPoint && (
        // if click the background，close popup
        <div className="popup-backdrop" onClick={() => setSelectedPoint(null)}>
          {/* stopPropagation()：avoid clicking popup triggers onClick */}
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="popup-head">
              <div>
                <h3>{selectedPoint.category}</h3>
                <p>Sentence-level comparison against the selected essay.</p>
              </div>

              <button
                className="secondary-btn"
                onClick={() => setSelectedPoint(null)}
              >
                Close
              </button>
            </div>

            <div className="popup-body">
              <div className="detail-block">
                <div className="detail-label">User sentence</div>
                <div className="detail-content">
                  {selectedPoint.highlighted_sentence}
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-label">Matched database sentence</div>
                <div className="detail-quote">
                  {selectedPoint.matched_sentence || "No matched sentence yet."}
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-label">Comparison</div>
                <div className="detail-content">
                  {selectedPoint.comparison}
                </div>
              </div>

              <div className="detail-block">
                <div className="detail-label">Suggestion</div>
                <div className="detail-content">
                  {selectedPoint.suggestion?.replace(/^- /, "")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 下方 feedback cards 區：compare 成功後才顯示 */}
      {compareResult?.comparisons?.length > 0 && (
        <section className="result-section">
          <h2>Feedback Cards</h2>

          <div className="result-grid">
            {compareResult.comparisons.map((item) => (
              <div
                key={item.id}
                className={`result-card ${
                  selectedPoint?.id === item.id ? "selected" : ""
                }`}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => setSelectedPoint(item)}
              >
                <div className={`result-badge ${item.color}`}>
                  Point {item.id}
                </div>

                <h3>{item.category}</h3>
                <p>{item.highlighted_sentence}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default ComparePage;