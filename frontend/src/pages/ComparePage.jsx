<<<<<<< HEAD
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/compare.module.css";
import logo from "../assets/logo.png";

const API_BASE = "http://44.201.62.0:8000";
const DEFAULT_LEFT_RATIO = 60;
const MIN_LEFT_RATIO = 35;
const MAX_LEFT_RATIO = 75;

const ANNOTATION_TITLES = [
  "Stronger opening image",
  "Show, don’t just tell",
  "Deeper reflection",
  "Stronger closing vision",
];

=======
import Navbar from "../components/Navbar/Navbar";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/compare.module.css";

const API_BASE = import.meta.env.VITE_API_URL;

const DEFAULT_LEFT_RATIO = 50;
const MIN_LEFT_RATIO = 35;
const MAX_LEFT_RATIO = 75;

>>>>>>> feature/Footer
function splitParagraphs(text) {
  return (text || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function countWords(text) {
  return (text || "").trim().split(/\s+/).filter(Boolean).length;
}

<<<<<<< HEAD
function getAnnotationTitle(index) {
  return ANNOTATION_TITLES[index % ANNOTATION_TITLES.length];
}

function mapCategoryToType(category, index) {
  const raw = (category || "").toLowerCase().trim();

  if (raw.includes("expression")) return "expression";
  if (raw.includes("reflection")) return "reflection";
  if (raw.includes("ending")) return "ending";
  if (raw.includes("structure")) return "structure";

  const fallback = ["expression", "reflection", "ending", "structure"];
  return fallback[index % fallback.length];
}

=======
>>>>>>> feature/Footer
function normalizeForSearch(text) {
  return (text || "")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

<<<<<<< HEAD

function normalizeCompareResponse(data, essayId) {
  const rawResults = data?.comparisons || [];
=======
function normalizeCompareResponse(data, essayId) {
  const rawResults = Array.isArray(data?.comparisons) ? data.comparisons : [];
>>>>>>> feature/Footer

  return rawResults.map((item, index) => ({
    id: item.id ?? index + 1,
    essayId: data?.essay_id || essayId,

    userSentence: item.user_sentence || "",
    userSentenceIndex: item.user_sentence_index ?? index,
    userParagraphIndex: item.user_paragraph_index ?? null,

    exampleSentence: item.example_sentence || "",
    exampleParagraph: item.example_paragraph || "",
    exampleParagraphIndex: item.example_paragraph_index ?? index,

    analysis: item.comparison || "",
    suggestions: Array.isArray(item.suggestions) ? item.suggestions : [],

<<<<<<< HEAD
    category: item.category || "",
    type: mapCategoryToType(item.category, index),
    title: getAnnotationTitle(index),
=======
    type: index % 4,
    title: `Suggestion ${index + 1}`,
>>>>>>> feature/Footer
  }));
}

function ComparePage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [compareLoading, setCompareLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [compareError, setCompareError] = useState("");

  const [essayData, setEssayData] = useState(null);
  const [userInput, setUserInput] = useState("");
  const [userTopic, setUserTopic] = useState("");
  const [submittedUserInput, setSubmittedUserInput] = useState("");
  const [compareData, setCompareData] = useState([]);

  const [annotationsEnabled, setAnnotationsEnabled] = useState(true);
  const [activeAnnotationId, setActiveAnnotationId] = useState(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);
  const [hoverCardTop, setHoverCardTop] = useState(0);

  const [leftRatio, setLeftRatio] = useState(DEFAULT_LEFT_RATIO);
  const [isDraggingDivider, setIsDraggingDivider] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function fetchEssay() {
      try {
        setLoading(true);
        setPageError("");

        const res = await fetch(`${API_BASE}/essays/${id}?include_content=true`);

        if (!res.ok) {
          throw new Error("Failed to fetch essay.");
        }

        const data = await res.json();

        if (!ignore) {
          setEssayData(data);
        }
      } catch (err) {
        if (!ignore) {
          setPageError(err.message || "Failed to load essay.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchEssay();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    setUserInput(localStorage.getItem("userDraft") || "");
    setUserTopic(localStorage.getItem("userTopic") || "");
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      if (!isDraggingDivider) return;

      const container = document.getElementById("compare-split-layout");
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
<<<<<<< HEAD
      const clamped = Math.max(MIN_LEFT_RATIO, Math.min(MAX_LEFT_RATIO, percent));
=======
      const clamped = Math.max(
        MIN_LEFT_RATIO,
        Math.min(MAX_LEFT_RATIO, percent)
      );
>>>>>>> feature/Footer

      setLeftRatio(clamped);
    }

    function handleMouseUp() {
      setIsDraggingDivider(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingDivider]);

<<<<<<< HEAD
=======
  const userParagraphs = useMemo(() => {
    return splitParagraphs(submittedUserInput || userInput);
  }, [submittedUserInput, userInput]);

  const dbParagraphs = useMemo(() => {
    return splitParagraphs(essayData?.content || "");
  }, [essayData]);

  const userWordCount = useMemo(() => {
    return countWords(submittedUserInput || userInput);
  }, [submittedUserInput, userInput]);

  const dbWordCount = useMemo(() => {
    return countWords(essayData?.content || "");
  }, [essayData]);

  const activeAnnotation = useMemo(() => {
    return compareData.find((item) => item.id === activeAnnotationId) || null;
  }, [compareData, activeAnnotationId]);

  const hoveredAnnotation = useMemo(() => {
    return compareData.find((item) => item.id === hoveredAnnotationId) || null;
  }, [compareData, hoveredAnnotationId]);

  const shouldUseAnnotationLayout =
    annotationsEnabled && compareData.length > 0;

  function getVariantClass(type) {
    if (type === 0) return styles.variantExpression;
    if (type === 1) return styles.variantReflection;
    if (type === 2) return styles.variantEnding;
    return styles.variantStructure;
  }

>>>>>>> feature/Footer
  function handleDividerMouseDown() {
    setIsDraggingDivider(true);
  }

<<<<<<< HEAD
  function getVariantClass(type) {
    if (type === "expression") return styles.variantExpression;
    if (type === "reflection") return styles.variantReflection;
    if (type === "ending") return styles.variantEnding;
    return styles.variantStructure;
  }

  function getAnnotationCountByType(type) {
    return compareData.filter((item) => item.type === type).length;
=======
  function handleSelectAnnotation(annotationId) {
    setActiveAnnotationId(annotationId);
    setHoveredAnnotationId(annotationId);
  }

  function handleResetView() {
    setCompareData([]);
    setActiveAnnotationId(null);
    setHoveredAnnotationId(null);
    setSubmittedUserInput("");
    setCompareError("");
  }

  function handleAnnotationHover(annotationId, event) {
    setHoveredAnnotationId(annotationId);

    const paragraphEl = event.currentTarget.closest(
      `.${styles.essayParagraph}`
    );
    const gridEl = document.getElementById("user-panel-grid");

    if (!paragraphEl || !gridEl) return;

    const paragraphRect = paragraphEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();

    setHoverCardTop(paragraphRect.top - gridRect.top);
>>>>>>> feature/Footer
  }

  async function handleCompare() {
    try {
      setCompareLoading(true);
      setCompareError("");
      setActiveAnnotationId(null);
      setHoveredAnnotationId(null);

      if (!userInput.trim()) {
        setCompareError("Please enter your essay before running compare.");
        return;
      }

      const currentInput = userInput;
      setSubmittedUserInput(currentInput);

      const res = await fetch(`${API_BASE}/compare/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: currentInput,
        }),
      });

      const data = await res.json();
      console.log("compare response:", data);

      if (!res.ok) {
<<<<<<< HEAD
        throw new Error(data?.detail || "Compare failed");
=======
        throw new Error(data?.detail || "Compare failed.");
      }

      if (data?.too_short) {
        setCompareData([]);
        setCompareError(
          data.message || "Please provide more content before comparing."
        );
        return;
>>>>>>> feature/Footer
      }

      const normalized = normalizeCompareResponse(data, id);
      setCompareData(normalized);

      if (normalized.length === 0) {
        setCompareError("No suggestions returned from server.");
      }
    } catch (err) {
      setCompareError(err.message || "Compare failed.");
    } finally {
      setCompareLoading(false);
    }
  }

<<<<<<< HEAD
  function handleSelectAnnotation(annotationId) {
    setActiveAnnotationId(annotationId);
    setHoveredAnnotationId(annotationId);
  }

  function handleResetView() {
    setCompareData([]);
    setActiveAnnotationId(null);
    setHoveredAnnotationId(null);
    setSubmittedUserInput("");
    setCompareError("");
  }

  const userParagraphs = useMemo(() => {
    const baseText = submittedUserInput || userInput;
    return splitParagraphs(baseText);
  }, [submittedUserInput, userInput]);

  const dbParagraphs = useMemo(() => {
    return splitParagraphs(essayData?.content || "");
  }, [essayData]);

  const userWordCount = useMemo(() => {
    return countWords(submittedUserInput || userInput);
  }, [submittedUserInput, userInput]);

  const dbWordCount = useMemo(() => {
    return countWords(essayData?.content || "");
  }, [essayData]);

  const activeAnnotation = useMemo(
    () => compareData.find((item) => item.id === activeAnnotationId) || null,
    [compareData, activeAnnotationId]
  );

  const hoveredAnnotation = useMemo(
    () => compareData.find((item) => item.id === hoveredAnnotationId) || null,
    [compareData, hoveredAnnotationId]
  );

  function handleAnnotationHover(annotationId, event) {
    setHoveredAnnotationId(annotationId);

    const paragraphEl = event.currentTarget.closest(`.${styles.essayParagraph}`);
    const gridEl = document.getElementById("user-panel-grid");

    if (!paragraphEl || !gridEl) return;

    const paragraphRect = paragraphEl.getBoundingClientRect();
    const gridRect = gridEl.getBoundingClientRect();

    setHoverCardTop(paragraphRect.top - gridRect.top);
  }
=======
>>>>>>> feature/Footer
  function renderSentenceHighlights(paragraph, annotations, sentenceKey) {
    if (!annotations.length) {
      return paragraph;
    }

    let remainingText = paragraph;
    const renderedParts = [];

    annotations.forEach((annotation) => {
      const sentence = annotation[sentenceKey];
      if (!sentence) return;

      const index = remainingText.indexOf(sentence);

      if (index === -1) {
        return;
      }

      const before = remainingText.slice(0, index);
      const match = remainingText.slice(index, index + sentence.length);
      const after = remainingText.slice(index + sentence.length);

      if (before) {
        renderedParts.push(before);
      }

      const isFocused = activeAnnotationId === annotation.id;
      const isHovered = hoveredAnnotationId === annotation.id;

      renderedParts.push(
        <span
          key={`${annotation.id}-${sentenceKey}`}
          className={`${styles.inlineSentenceHighlight} ${getVariantClass(
            annotation.type
          )} ${isFocused ? styles.isFocused : ""} ${
            isHovered ? styles.isHovered : ""
          }`}
          onMouseEnter={(e) => handleAnnotationHover(annotation.id, e)}
          onMouseLeave={() => {
            if (activeAnnotationId !== annotation.id) {
              setHoveredAnnotationId(null);
            }
          }}
          onClick={() => handleSelectAnnotation(annotation.id)}
        >
          {match}
        </span>
      );

      remainingText = after;
    });

    if (remainingText) {
      renderedParts.push(remainingText);
    }

    return renderedParts;
  }

  function isSentenceInParagraph(paragraph, sentence) {
    if (!paragraph || !sentence) return false;

    return normalizeForSearch(paragraph).includes(normalizeForSearch(sentence));
  }

  function renderUserParagraph(paragraph, index) {
    const annotations = compareData.filter((item) => {
      if (item.userParagraphIndex !== null) {
        return item.userParagraphIndex === index;
      }

      return isSentenceInParagraph(paragraph, item.userSentence);
    });

    if (!annotations.length || !annotationsEnabled) {
      return <p className={styles.essayParagraph}>{paragraph}</p>;
    }

    return (
      <p className={styles.essayParagraph}>
        <span className={styles.essayLineWrap}>
          <span className={styles.annotationGroup}>
            {annotations.map((annotation) => (
              <button
                key={annotation.id}
                type="button"
                className={`${styles.annotationBadge} ${getVariantClass(
                  annotation.type
                )}`}
                onMouseEnter={(e) => handleAnnotationHover(annotation.id, e)}
                onMouseLeave={() => {
                  if (activeAnnotationId !== annotation.id) {
                    setHoveredAnnotationId(null);
                  }
                }}
                onClick={() => handleSelectAnnotation(annotation.id)}
              >
                {annotation.id}
              </button>
            ))}
          </span>

          <span className={styles.essaySentenceBlock}>
            {renderSentenceHighlights(paragraph, annotations, "userSentence")}
          </span>
        </span>
      </p>
    );
  }

  function renderDbParagraph(paragraph, index) {
    const previewAnnotation = activeAnnotation || hoveredAnnotation;

<<<<<<< HEAD
    if (!previewAnnotation || previewAnnotation.exampleParagraphIndex !== index) {
=======
    if (
      !previewAnnotation ||
      previewAnnotation.exampleParagraphIndex !== index
    ) {
>>>>>>> feature/Footer
      return (
        <p className={`${styles.essayParagraph} ${styles.dbParagraph}`}>
          {paragraph}
        </p>
      );
    }

    return (
      <p className={`${styles.essayParagraph} ${styles.dbParagraph}`}>
<<<<<<< HEAD
        {renderSentenceHighlights(paragraph, [previewAnnotation], "exampleSentence")}
=======
        {renderSentenceHighlights(
          paragraph,
          [previewAnnotation],
          "exampleSentence"
        )}
>>>>>>> feature/Footer
      </p>
    );
  }

  if (loading) {
    return (
      <div className={styles.comparePage}>
        <div className={styles.compareLoading}>Loading compare page...</div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className={styles.comparePage}>
        <div className={styles.compareErrorBox}>{pageError}</div>
      </div>
    );
  }

  return (
    <div className={styles.comparePage}>
<<<<<<< HEAD
=======
      <Navbar
        variant="compare"
        annotationsEnabled={annotationsEnabled}
        setAnnotationsEnabled={setAnnotationsEnabled}
        handleResetView={handleResetView}
        handleCompare={handleCompare}
        compareLoading={compareLoading}
      />

>>>>>>> feature/Footer
      {compareLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingCard}>
            <div className={styles.loadingSpinner} />
            <div className={styles.loadingTitle}>Comparing essays...</div>
            <div className={styles.loadingText}>
              Generating suggestions and matching paragraphs.
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
      <header className={styles.compareTopbar}>
        <div className={styles.topbarLeft}>
          <div className={styles.brandBlock}>
            <img
              src={logo}
              alt="Essay Annotator"
              className={styles.brandLogo}
            />
            <span className={styles.brandSub}> / Compare-my-essay</span>
          </div>
        </div>

        <div className={styles.topbarCenter}>
          <div className={styles.pillGroup}>
            <span className={`${styles.topPill} ${styles.pillTotal}`}>
              {compareData.length} suggestions
            </span>
            <span className={`${styles.topPill} ${styles.pillExpression}`}>
              {getAnnotationCountByType("expression")} Expression
            </span>
            <span className={`${styles.topPill} ${styles.pillReflection}`}>
              {getAnnotationCountByType("reflection")} Reflection
            </span>
            <span className={`${styles.topPill} ${styles.pillEnding}`}>
              {getAnnotationCountByType("ending")} Ending
            </span>
          </div>
        </div>

        <div className={styles.topbarRight}>
          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => setAnnotationsEnabled((prev) => !prev)}
          >
            <span
              className={`${styles.statusDot} ${
                annotationsEnabled ? styles.statusOn : styles.statusOff
              }`}
            />
            <span>{annotationsEnabled ? "Annotations on" : "Annotations off"}</span>
          </button>

          <button
            type="button"
            className={styles.ghostButton}
            onClick={handleResetView}
          >
            Show Original
          </button>

          <button
            type="button"
            className={`${styles.primaryButton} ${
              compareLoading ? styles.primaryButtonLoading : ""
            }`}
            onClick={handleCompare}
            disabled={compareLoading}
          >
            {compareLoading && <span className={styles.buttonSpinner} />}
            <span>{compareLoading ? "Loading Suggestions..." : "Load Suggestions"}</span>
          </button>
        </div>
      </header>

=======
>>>>>>> feature/Footer
      {compareError && (
        <div className={styles.globalMessage}>
          <div className={styles.compareErrorInline}>{compareError}</div>
        </div>
      )}

      <main className={styles.compareMain}>
        <div
          id="compare-split-layout"
          className={styles.compareSplitLayout}
          style={{
            gridTemplateColumns: `${leftRatio}fr 12px ${100 - leftRatio}fr`,
          }}
        >
          <section className={styles.userPanel}>
            <div className={styles.userPanelHeader}>
              <div className={styles.essayCardLabel}>Your Essay</div>
<<<<<<< HEAD
              <div className={styles.essayCardTitle}>
                  {userTopic || "User Draft"}
=======

              <div className={styles.essayCardTitle}>
                {userTopic || "User Draft"}
>>>>>>> feature/Footer
              </div>

              <div className={styles.metaChipRow}>
                <span className={`${styles.metaChip} ${styles.chipNeutral}`}>
                  {userWordCount} words
                </span>
<<<<<<< HEAD
                <span className={`${styles.metaChip} ${styles.chipNeutral}`}>
                  User Draft
                </span>

              </div>
            </div>

            <div id="user-panel-grid" className={styles.userPanelGrid}>
=======

                <span className={`${styles.metaChip} ${styles.chipNeutral}`}>
                  User Draft
                </span>
              </div>
            </div>

            <div
              id="user-panel-grid"
              className={`${styles.userPanelGrid} ${
                shouldUseAnnotationLayout
                  ? styles.annotationLayout
                  : styles.readingLayout
              }`}
            >
>>>>>>> feature/Footer
              <div className={styles.userEssayMain}>
                <div className={styles.userEssayBody}>
                  {userParagraphs.map((paragraph, index) => (
                    <div key={index}>{renderUserParagraph(paragraph, index)}</div>
                  ))}
                </div>

                <div className={styles.essayCardFooter}>
                  {userWordCount} words
                  <span className={styles.metaSep}>·</span>
                  {userParagraphs.length} paragraphs
                </div>
              </div>

              <aside className={styles.userHoverRail}>
                <div
                  className={`${styles.hoverNoteRail} ${
                    hoveredAnnotation ? styles.hoverNoteRailVisible : ""
                  }`}
                  style={{ top: `${hoverCardTop}px` }}
                >
                  {hoveredAnnotation && (
                    <div className={styles.hoverNoteCard}>
                      <div
                        className={`${styles.hoverNoteAccent} ${getVariantClass(
                          hoveredAnnotation.type
                        )}`}
                      />
<<<<<<< HEAD
                      <div className={styles.hoverNoteBody}>
                        <div className={styles.hoverNoteCategory}>
                          {hoveredAnnotation.category || hoveredAnnotation.type}
=======

                      <div className={styles.hoverNoteBody}>
                        <div className={styles.hoverNoteCategory}>
                          Suggestion {hoveredAnnotation.id}
>>>>>>> feature/Footer
                        </div>

                        <div className={styles.hoverNoteTitle}>
                          {hoveredAnnotation.title}
                        </div>

                        <div className={styles.hoverNotePreview}>
<<<<<<< HEAD
                          {(hoveredAnnotation.analysis || "See suggestion details.").slice(
                            0,
                            72
                          )}
                          {(hoveredAnnotation.analysis || "").length > 72 ? "..." : ""}
=======
                          {(
                            hoveredAnnotation.analysis ||
                            "See suggestion details."
                          ).slice(0, 72)}
                          {(hoveredAnnotation.analysis || "").length > 72
                            ? "..."
                            : ""}
>>>>>>> feature/Footer
                        </div>

                        <button
                          type="button"
                          className={styles.hoverNoteButton}
<<<<<<< HEAD
                          onClick={() => handleSelectAnnotation(hoveredAnnotation.id)}
=======
                          onClick={() =>
                            handleSelectAnnotation(hoveredAnnotation.id)
                          }
>>>>>>> feature/Footer
                        >
                          See full analysis
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </section>

          <div
            className={`${styles.resizeDivider} ${
              isDraggingDivider ? styles.resizeDividerActive : ""
            }`}
            onMouseDown={handleDividerMouseDown}
          >
            <div className={styles.resizeDividerLine} />
<<<<<<< HEAD
=======

>>>>>>> feature/Footer
            <div className={styles.resizeDividerHandle}>
              <span className={styles.resizeArrow}>‹</span>
              <span className={styles.resizeDots}>⋮</span>
              <span className={styles.resizeArrow}>›</span>
            </div>
          </div>

          <section className={styles.databasePanel}>
<<<<<<< HEAD
            <div className={styles.essayCard}>
              <div className={styles.essayCardHeader}>
                <div className={styles.essayCardLabel}>Database Essay</div>
                <div className={styles.essayCardTitle}>{essayData?.id || id}</div>
=======
            <div className={styles.essayHeaderCard}>
              <div className={styles.essayCardHeader}>
                <div className={styles.essayCardLabel}>Database Essay</div>

                <div className={styles.essayCardTitle}>
                  {essayData?.generated_title || "Untitled Essay"}
                </div>
>>>>>>> feature/Footer

                <div className={styles.metaChipRow}>
                  {essayData?.type && (
                    <span className={`${styles.metaChip} ${styles.chipType}`}>
                      {essayData.type}
                    </span>
                  )}

<<<<<<< HEAD
                  {essayData?.school && (
                    <span className={`${styles.metaChip} ${styles.chipSchool}`}>
                      {essayData.school}
                    </span>
                  )}
=======
                  {essayData?.school &&
                    essayData.school.toLowerCase() !== "none" && (
                      <span className={`${styles.metaChip} ${styles.chipSchool}`}>
                        {essayData.school}
                      </span>
                    )}
>>>>>>> feature/Footer

                  <span className={`${styles.metaChip} ${styles.chipRef}`}>
                    Reference essay
                  </span>
                </div>
              </div>
<<<<<<< HEAD

              <div className={styles.essayCardBody}>
                {dbParagraphs.map((paragraph, index) => (
                  <div key={index}>{renderDbParagraph(paragraph, index)}</div>
                ))}
              </div>

              <div className={styles.essayCardFooter}>
                {dbWordCount} words
                <span className={styles.metaSep}>·</span>
                {dbParagraphs.length} paragraphs
              </div>
=======
            </div>

            <div className={styles.essayCardBody}>
              {dbParagraphs.map((paragraph, index) => (
                <div key={index}>{renderDbParagraph(paragraph, index)}</div>
              ))}
            </div>

            <div className={styles.essayCardFooter}>
              {dbWordCount} words
              <span className={styles.metaSep}>·</span>
              {dbParagraphs.length} paragraphs
>>>>>>> feature/Footer
            </div>
          </section>
        </div>
      </main>

      {activeAnnotation && (
        <section className={`${styles.bottomPanel} ${styles.bottomPanelOpen}`}>
          <div className={styles.bottomPanelHandle} />

          <div className={styles.bottomPanelInner}>
            <div className={styles.bottomPanelHeader}>
              <div className={styles.panelTitleGroup}>
                <span
                  className={`${styles.panelIndex} ${getVariantClass(
                    activeAnnotation.type
                  )}`}
                >
                  {activeAnnotation.id}
                </span>

                <div>
                  <div className={styles.panelType}>
<<<<<<< HEAD
                    {activeAnnotation.category || activeAnnotation.type}
                  </div>
                  <div className={styles.panelTitle}>{activeAnnotation.title}</div>
=======
                    Suggestion {activeAnnotation.id}
                  </div>

                  <div className={styles.panelTitle}>
                    {activeAnnotation.title}
                  </div>
>>>>>>> feature/Footer
                </div>
              </div>

              <div className={styles.panelActions}>
                <button
                  type="button"
                  className={styles.panelIconButton}
                  onClick={() => {
                    const currentIndex = compareData.findIndex(
                      (item) => item.id === activeAnnotation.id
                    );
<<<<<<< HEAD
=======

>>>>>>> feature/Footer
                    if (currentIndex > 0) {
                      handleSelectAnnotation(compareData[currentIndex - 1].id);
                    }
                  }}
                >
                  ‹
                </button>

                <button
                  type="button"
                  className={styles.panelIconButton}
                  onClick={() => {
                    const currentIndex = compareData.findIndex(
                      (item) => item.id === activeAnnotation.id
                    );
<<<<<<< HEAD
=======

>>>>>>> feature/Footer
                    if (currentIndex < compareData.length - 1) {
                      handleSelectAnnotation(compareData[currentIndex + 1].id);
                    }
                  }}
                >
                  ›
                </button>

                <button
                  type="button"
                  className={styles.panelIconButton}
                  onClick={() => {
                    setActiveAnnotationId(null);
                    setHoveredAnnotationId(null);
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className={styles.bottomPanelGrid}>
<<<<<<< HEAD
              <div className={styles.panelBlock}>
                <div className={styles.panelBlockLabel}>Your sentence</div>
                <div className={styles.panelQuoteBox}>
                  {activeAnnotation.userSentence || "No highlighted sentence returned."}
                </div>
              </div>

              <div className={styles.panelBlock}>
                <div className={styles.panelBlockLabel}>Matched sentence</div>
                <div className={styles.panelQuoteBox}>
                  {activeAnnotation.exampleSentence || "No matched sentence returned."}
                </div>
              </div>

              <div className={styles.panelBlock}>
                <div className={styles.panelBlockLabel}>Suggestions</div>
                <div className={styles.panelSuggestionList}>
                  {activeAnnotation.suggestions?.length > 0 ? (
                    activeAnnotation.suggestions.map((item, index) => (
                      <div key={index} className={styles.panelSuggestionItem}>
                        <span className={styles.suggestionNumber}>{index + 1}</span>
=======
              <div className={`${styles.panelBlock} ${styles.panelUser}`}>
                <div className={styles.panelBlockLabel}>Your sentence</div>

                <div className={styles.panelQuoteBox}>
                  {activeAnnotation.userSentence ||
                    "No highlighted sentence returned."}
                </div>
              </div>

              <div className={`${styles.panelBlock} ${styles.panelMatch}`}>
                <div className={styles.panelBlockLabel}>Matched sentence</div>

                <div className={styles.panelQuoteBox}>
                  {activeAnnotation.exampleSentence ||
                    "No matched sentence returned."}
                </div>
              </div>

              <div className={`${styles.panelBlock} ${styles.panelSuggestion}`}>
                <div className={styles.panelBlockLabel}>Suggestions</div>

                <div className={styles.panelSuggestionList}>
                  {activeAnnotation.suggestions.length > 0 ? (
                    activeAnnotation.suggestions.map((item, index) => (
                      <div key={index} className={styles.panelSuggestionItem}>
                        <span className={styles.suggestionNumber}>
                          {index + 1}
                        </span>
>>>>>>> feature/Footer
                        <span>{item}</span>
                      </div>
                    ))
                  ) : (
                    <div className={styles.panelAnalysisText}>
                      {activeAnnotation.analysis || "No suggestions provided."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default ComparePage;