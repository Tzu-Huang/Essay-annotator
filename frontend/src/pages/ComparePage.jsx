import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/compare.module.css";

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
  // Interaction state
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
  // Check if value is valid
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
        setEssay(data);
      } catch (error) {
        console.error("ERROR:", error);
        setError(error.message || "Failed to load essay.");
      } finally {
        setLoading(false);
      }
    };

    fetchEssay();
  }, [id]);

  // =========================
  // Call compare API
  // =========================
  const runCompare = async () => {
    if (!userDraft.trim()) {
      setCompareError("Your draft is empty.");
      return;
    }

    try {
      setCompareLoading(true);
      setCompareError("");
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

      const normalized = {
        essay_id: data.essay_id,
        similarity: data.similarity ?? data.similarity_percentage ?? null,
        comparisons: (data.comparisons || []).map((item, index) => ({
          id: index + 1,
          highlighted_sentence: item.highlighted_sentence,
          comparison: item.comparison,
          suggestion: item.suggestion,
          matched_sentence: item.matched_sentence || item.highlighted_sentence,
          matched_paragraph: item.matched_paragraph || "",
          category: item.category || "Feedback",
          color: ["yellow", "green", "pink"][index % 3],
          userParagraphIndex: item.user_paragraph_index ?? index,
          exampleParagraphIndex: item.example_paragraph_index ?? index,
        })),
      };

      setCompareResult(normalized);

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
    if (value === null || value === undefined) return "chipGray";

    const percent =
      Number(value) <= 1 ? Number(value) * 100 : Number(value);

    if (percent >= 80) return "chipGreen";
    if (percent >= 50) return "chipYellow";
    return "chipRed";
  };

  // =========================
  // Dynamic color for essay type
  // =========================
  const getTypeClass = (type) => {
    if (!type) return "chipGray";

    const t = type.toLowerCase();

    if (t.includes("personal")) return "chipPink";
    if (t.includes("supplement")) return "chipYellow";

    return "chipUc";
  };

  // =========================
  // Metadata
  // =========================
  const essaySchool = essay?.school || "Unknown School";
  const essayType = essay?.type || "Unknown Type";
  const selectedEssayTopic = essay?.topic || "Unknown Topic";
  const userDraftTopic = localStorage.getItem("userTopic") || "No Topic";

  const similarityValue =
    compareResult?.similarity ?? essay?.score ?? essay?.similarity ?? null;

  const similarityText =
    similarityValue !== null && similarityValue !== undefined
      ? Number(similarityValue) <= 1
        ? `${Math.round(Number(similarityValue) * 100)}% Similar`
        : `${Math.round(Number(similarityValue))}% Similar`
      : "";

  return (
    <div className={styles.comparePage}>
      <div className={styles.compareHeader}>
        <div className={styles.compareHeaderLeft}>
          <p className={styles.compareLabel}>Essay Comparison</p>
          <h1 className={styles.compareTitle}>
            <span className={styles.compareTitlePrefix}>Compare With This Essay</span>
          </h1>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.secondaryBtn} onClick={resetView}>
            Reset View
          </button>

          <button
            className={styles.primaryBtn}
            onClick={runCompare}
            disabled={compareLoading}
          >
            {compareLoading ? "Comparing..." : "Run Compare"}
          </button>
        </div>
      </div>

      {(error || compareError) && (
        <div className={`${styles.message} ${styles.errorMessage}`}>
          {error || compareError}
        </div>
      )}

      <div className={styles.compareLayout}>
        {/* LEFT: User Draft */}
        <section className={styles.docShell}>
          <div className={styles.docPaper}>
            <div className={styles.panelMeta}>
              <div>
                <h2>User Draft</h2>

                <p className={styles.compareSubtitle}>
                  Topic: {userDraftTopic}
                </p>
              </div>

              <div className={styles.panelState}>Hover + click interaction</div>
            </div>

            <div className={styles.docBody}>

              {userParagraphs.length ? (
                userParagraphs.map((paragraph, index) => {
                  const point = getPointForParagraph(index);

                  if (!point) {
                    return (
                      <p key={index} className={styles.para}>
                        {paragraph}
                      </p>
                    );
                  }

                  return (
                    <p key={index} className={styles.para}>
                      <span
                        className={`${styles.highlight} ${styles[point.color]} ${
                          activePoint?.id === point.id ? styles.active : ""
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

                      <span
                        className={`${styles.commentTag} ${styles[point.color]}`}
                      >
                        {point.id}
                      </span>
                    </p>
                  );
                })
              ) : (
                <p className={styles.emptyText}>No user draft found.</p>
              )}
            </div>

            <div className={styles.hintbar}>
              {activePoint
                ? `Point ${activePoint.id} selected.`
                : "Hover to preview matching paragraph."}
            </div>
          </div>
        </section>

        {/* RIGHT: Database Essay */}
        <section className={styles.docShell}>
          <div className={styles.docPaper}>
            <div className={styles.panelMeta}>
              <div>
                <h2>Selected Essay Example</h2>
                <p className={styles.compareSubtitle}>
                  Topic: {selectedEssayTopic}
                </p>

                <div className={styles.essayMetaChips}>
                  {isValid(essaySchool) && (
                    <div className={`${styles.metaChip} ${styles.chipSchool}`}>
                      {essaySchool}
                    </div>
                  )}

                  {similarityValue !== null && similarityValue !== undefined && (
                    <div
                      className={`${styles.metaChip} ${
                        styles[getSimilarityClass(similarityValue)]
                      }`}
                    >
                      {similarityText}
                    </div>
                  )}

                  {isValid(essayType) && (
                    <div
                      className={`${styles.metaChip} ${
                        styles[getTypeClass(essayType)]
                      }`}
                    >
                      {essayType}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.panelState}>
                {compareResult?.essay_id
                  ? `essay_id: ${compareResult.essay_id}`
                  : "Reference essay"}
              </div>
            </div>

            <div className={styles.docBody}>
              {loading ? (
                <p className={styles.emptyText}>Loading...</p>
              ) : exampleParagraphs.length ? (
                exampleParagraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className={`${styles.para} ${styles.exampleParagraph} ${
                      activePoint?.exampleParagraphIndex === index
                        ? styles.active
                        : ""
                    } ${
                      activePoint?.exampleParagraphIndex === index
                        ? styles[activePoint.color]
                        : ""
                    }`}
                  >
                    {paragraph}
                  </p>
                ))
              ) : (
                <p className={styles.emptyText}>No essay found.</p>
              )}
            </div>

            <div className={styles.hintbar}>
              {activePoint
                ? `Linked to feedback ${activePoint.id}`
                : "No paragraph selected"}
            </div>
          </div>
        </section>
      </div>

      {/* Popup */}
      {selectedPoint && (
        <div
          className={styles.popupBackdrop}
          onClick={() => setSelectedPoint(null)}
        >
          <div
            className={styles.popupCard}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.popupHead}>
              <h3>{selectedPoint.category}</h3>

              <button
                className={styles.secondaryBtn}
                onClick={() => setSelectedPoint(null)}
              >
                Close
              </button>
            </div>

            <div className={styles.popupBody}>
              <div className={styles.detailBlock}>
                <div className={styles.detailLabel}>User sentence</div>
                <div className={styles.detailContent}>
                  {selectedPoint.highlighted_sentence}
                </div>
              </div>

              <div className={styles.detailBlock}>
                <div className={styles.detailLabel}>Matched sentence</div>
                <div className={styles.detailQuote}>
                  {selectedPoint.matched_sentence}
                </div>
              </div>

              <div className={styles.detailBlock}>
                <div className={styles.detailLabel}>Comparison</div>
                <div className={styles.detailContent}>
                  {selectedPoint.comparison}
                </div>
              </div>

              <div className={styles.detailBlock}>
                <div className={styles.detailLabel}>Suggestion</div>
                <div className={styles.detailContent}>
                  {selectedPoint.suggestion?.replace(/^- /, "")}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom feedback cards */}
      {compareResult?.comparisons?.length > 0 && (
        <section className={styles.resultSection}>
          <h2>Feedback Cards</h2>

          <div className={styles.resultGrid}>
            {compareResult.comparisons.map((item) => (
              <div
                key={item.id}
                className={`${styles.resultCard} ${
                  selectedPoint?.id === item.id ? styles.selected : ""
                }`}
                onMouseEnter={() => setHoveredPoint(item)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() =>
                  setSelectedPoint((prev) =>
                    prev?.id === item.id ? null : item
                  )
                }
              >
                <div
                  className={`${styles.resultBadge} ${styles[item.color]}`}
                >
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