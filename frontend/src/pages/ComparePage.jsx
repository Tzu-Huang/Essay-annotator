import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import "../styles/compare.css";

function ComparePage() {
  const { id } = useParams();

  // =========================
  // Core state
  // =========================
  const [userDraft, setUserDraft] = useState("");
  const [essay, setEssay] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // Compare state
  // =========================
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  // =========================
  // Interaction state (UI highlight logic)
  // =========================
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [selectedPoint, setSelectedPoint] = useState(null);

  // =========================
  // Load user draft from localStorage
  // =========================
  useEffect(() => {
    setUserDraft(localStorage.getItem("userDraft") || "");
  }, []);

  // =========================
  // Check if value is valid (should display)
  // =========================
  const isValid = (value) => {
    if (!value) return false;

    const v = value.toString().toLowerCase().trim();

    return v !== "none" && v !== "unknown" && v !== "";
  };
  // =========================
  // Fetch selected essay from backend
  // =========================
  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch essay: ${response.status}`);
        }

        const data = await response.json();

        // Store essay into state
        setEssay(data);
      } catch (error) {
        console.error("ERROR:", error);
        setError(error.message || "Failed to load essay.");
      } finally {
        setLoading(false);
      }
    };

    fetchEssay();
  }, [id]); // re-fetch when id changes

  // =========================
  // Call compare API
  // =========================
  const runCompare = async () => {
    // Prevent empty draft submission
    if (!userDraft.trim()) {
      setCompareError("Your draft is empty.");
      return;
    }

    try {
      setCompareLoading(true);
      setCompareError("");

      // Reset previous compare interaction state
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

      // Normalize backend response (important: backend not stable yet)
      const normalized = {
        essay_id: data.essay_id,

        // similarity may be 0.87 or 87
        similarity: data.similarity ?? data.similarity_percentage ?? null,

        comparisons: (data.comparisons || []).map((item, index) => ({
          id: index + 1,
          highlighted_sentence: item.highlighted_sentence,
          comparison: item.comparison,
          suggestion: item.suggestion,

          // fallback if backend missing field
          matched_sentence: item.matched_sentence || item.highlighted_sentence,
          matched_paragraph: item.matched_paragraph || "",

          category: item.category || "Feedback",

          // cycle through colors
          color: ["yellow", "green", "pink"][index % 3],

          // paragraph mapping
          userParagraphIndex: item.user_paragraph_index ?? index,
          exampleParagraphIndex: item.example_paragraph_index ?? index,
        })),
      };

      setCompareResult(normalized);

      // Scroll back to top after running compare
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("COMPARE ERROR:", error);
      setCompareError(error.message || "Compare failed.");
    } finally {
      setCompareLoading(false);
    }
  };

  // =========================
  // Active highlight logic
  // Priority:
  // 1. selected
  // 2. hover
  // =========================
  const activePoint = selectedPoint || hoveredPoint;

  // =========================
  // Convert text → paragraph array
  // =========================
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

  // =========================
  // Find feedback for each paragraph
  // =========================
  const getPointForParagraph = (index) => {
    return compareResult?.comparisons?.find(
      (item) => item.userParagraphIndex === index
    );
  };

  // =========================
  // Reset view
  // What it should do:
  // 1. clear hover
  // 2. clear selected popup
  // 3. clear compare error
  // 4. scroll back to top
  // =========================
  const resetView = () => {
    setHoveredPoint(null);
    setSelectedPoint(null);
    setCompareError("");
    setCompareResult(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================
  // Dynamic color for similarity
  // =========================
  const getSimilarityClass = (value) => {
    if (value === null || value === undefined) return "chip-gray";

    const percent =
      Number(value) <= 1 ? Number(value) * 100 : Number(value);

    if (percent >= 80) return "chip-green";
    if (percent >= 50) return "chip-yellow";
    return "chip-red";
  };

  // =========================
  // Dynamic color for essay type
  // =========================
  const getTypeClass = (type) => {
    if (!type) return "chip-gray";

    const t = type.toLowerCase();

    if (t.includes("personal")) return "chip-pink";
    if (t.includes("supplement")) return "chip-yellow";

    return "chip-uc";
  };
  // =========================
  // Metadata (right panel cards / chips)
  // =========================
  const essaySchool = essay?.school || "Unknown School";
  const essayType = essay?.type || "Unknown Type";

  const similarityValue =
    compareResult?.similarity ?? essay?.score ?? essay?.similarity ?? null;

  const similarityText = similarityValue || "none";

  return (
    <div className="compare-page">
      {/* =========================
         Header section
         Note:
         EA / navbar / search bar already comes from App.jsx,
         so ComparePage only keeps its own local title + buttons
         ========================= */}
      <div className="compare-header">
        <div className="compare-header-left">
          <p className="compare-label">Essay Comparison</p>
          <h1>Compare With This Essay</h1>
          <p className="compare-subtitle">Current essay ID: {id}</p>
        </div>

        {/* Action buttons */}
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

      {/* =========================
         Error message
         ========================= */}
      {(error || compareError) && (
        <div className="message error-message">{error || compareError}</div>
      )}

      {/* =========================
         Main layout (Left + Right)
         ========================= */}
      <div className="compare-layout">
        {/* =========================
           LEFT: User Draft
           ========================= */}
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
                userParagraphs.map((paragraph, index) => {
                  const point = getPointForParagraph(index);

                  // No feedback → normal text
                  if (!point) {
                    return (
                      <p key={index} className="para">
                        {paragraph}
                      </p>
                    );
                  }

                  // Feedback exists → interactive highlight
                  return (
                    <p key={index} className="para">
                      <span
                        className={`highlight ${point.color} ${
                          activePoint?.id === point.id ? "active" : ""
                        }`}
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() =>
                          setSelectedPoint((prev) =>
                            prev?.id === point.id ? null : point
                          )
                        }
                      >
                        {paragraph}
                      </span>

                      {/* feedback number badge */}
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

            {/* Hint bar */}
            <div className="hintbar">
              {activePoint
                ? `Point ${activePoint.id} selected.`
                : "Hover to preview matching paragraph."}
            </div>
          </div>
        </section>

        {/* =========================
           RIGHT: Database Essay
           ========================= */}
        <section className="doc-shell">
          <div className="doc-paper">
            <div className="panel-meta panel-meta-right">
              <div>
                <h2>Selected Essay Example</h2>
                <p>This is the database essay used for comparison.</p>

                {/* Small metadata chips */}
                <div className="essay-meta-chips">
                  {/* School */}
                  {isValid(essaySchool) && (
                    <div className="meta-chip chip-school">
                      {essaySchool}
                    </div>
                  )}
                  {/* Similarity（只要有數值就顯示） */}
                  {similarityValue !== null && similarityValue !== undefined && (
                    <div className={`meta-chip ${getSimilarityClass(similarityValue)}`}>
                      {similarityText}
                    </div>
                  )}

                  {/* Essay Type */}
                  {isValid(essayType) && (
                    <div className={`meta-chip ${getTypeClass(essayType)}`}>
                      {essayType}
                    </div>
                  )}
                </div>
              </div>

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
                exampleParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`para example-paragraph ${
                      activePoint?.exampleParagraphIndex === index
                        ? "active"
                        : ""
                    } ${
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

            <div className="hintbar">
              {activePoint
                ? `Linked to feedback ${activePoint.id}`
                : "No paragraph selected"}
            </div>
          </div>
        </section>
      </div>

      {/* =========================
         Popup detail view
         ========================= */}
      {selectedPoint && (
        <div className="popup-backdrop" onClick={() => setSelectedPoint(null)}>
          <div className="popup-card" onClick={(e) => e.stopPropagation()}>
            <div className="popup-head">
              <h3>{selectedPoint.category}</h3>

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
                <div className="detail-label">Matched sentence</div>
                <div className="detail-quote">
                  {selectedPoint.matched_sentence}
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

      {/* =========================
         Bottom feedback cards
         ========================= */}
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
                onClick={() =>
                  setSelectedPoint((prev) =>
                    prev?.id === item.id ? null : item
                  )
                }
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