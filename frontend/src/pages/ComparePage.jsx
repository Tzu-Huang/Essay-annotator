import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../styles/compare.module.css";

import logo from "../assets/logo.png";

const API_BASE = "http://44.201.62.0:8000";

function ComparePage() {
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [compareLoading, setCompareLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [compareError, setCompareError] = useState("");

  const [userInput, setUserInput] = useState("");
  const [submittedUserInput, setSubmittedUserInput] = useState("");

  const [essayData, setEssayData] = useState(null);
  const [compareData, setCompareData] = useState([]);

  const [annotationsEnabled, setAnnotationsEnabled] = useState(true);
  const [activeAnnotationId, setActiveAnnotationId] = useState(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState(null);

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
    setUserInput(`When I first started volunteering at the community music center, I thought I was only teaching scales and rhythm.

Over time, I realized that each lesson was also an invitation for younger students to feel that they belonged in a place that often seemed distant from their lives.

One student, who barely spoke during our first session, slowly began to ask questions, stay after class, and eventually perform in front of others.

Watching that change forced me to rethink what leadership meant.

It was not about standing in front of a room and controlling it.

It was about building trust, noticing quiet progress, and creating a space where someone else could become more confident.

In college, I want to continue building those kinds of spaces through mentorship, community arts programs, and service.`);
  }, []);

  function splitParagraphs(text) {
    return (text || "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
  }

  function normalizeText(text) {
    return (text || "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function findParagraphIndex(fullText, targetText) {
    if (!fullText || !targetText) return -1;

    const paragraphs = splitParagraphs(fullText);
    const normalizedTarget = normalizeText(targetText);

    return paragraphs.findIndex((p) =>
      normalizeText(p).includes(normalizedTarget)
    );
  }

  function getAnnotationType(index) {
    const types = ["expression", "reflection", "ending", "structure"];
    return types[index % types.length];
  }

  function getAnnotationTitle(index) {
    const titles = [
      "Stronger opening image",
      "Show, don’t just tell",
      "Deeper reflection",
      "Stronger closing vision",
    ];
    return titles[index % titles.length];
  }

  function getAnnotationCountByType(type) {
    return compareData.filter((item) => item.type === type).length;
  }

  function getTypeVariant(type) {
    if (type === "expression") return "expression";
    if (type === "reflection") return "reflection";
    if (type === "ending") return "ending";
    return "structure";
  }

  function getVariantClass(type) {
    const variant = getTypeVariant(type);

    if (variant === "expression") return styles.variantExpression;
    if (variant === "reflection") return styles.variantReflection;
    if (variant === "ending") return styles.variantEnding;
    return styles.variantStructure;
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
        throw new Error(data?.detail || "Compare failed");
      }
      
      const rawResults = data?.comparisons || [];

      const normalized = rawResults.map((item, index) => ({
        id: index + 1,
        essay_id: data?.essay_id || id,
        highlight: item.highlighted_sentence || "",
        matched: item.matched_sentence || "",

        analysis: item.comparison || "",
        suggestions: item.suggestion ? [item.suggestion] : [],

        type: getAnnotationType(index),
        title: getAnnotationTitle(index),
        paraIndex: item.user_paragraph_index ?? index,
        refParaIndex: item.example_paragraph_index ?? index,
      }));

      setCompareData(normalized);

      // 🔥 讓 UI 一定有反應
      if (normalized.length > 0) {
        setActiveAnnotationId(normalized[0].id);
      }
      else{
        setCompareError("No suggestions returned from server.");
      }
    } catch (err) {
      setCompareError(err.message || "Compare failed.");
    } finally {
      setCompareLoading(false);
    }
  }

  const userParagraphs = useMemo(() => {
    const baseText = submittedUserInput || userInput;
    return splitParagraphs(baseText);
  }, [submittedUserInput, userInput]);

  const dbParagraphs = useMemo(() => {
    return splitParagraphs(essayData?.content || "");
  }, [essayData]);

  const activeAnnotation =
    compareData.find((item) => item.id === activeAnnotationId) || null;

  const hoveredAnnotation =
    compareData.find((item) => item.id === hoveredAnnotationId) || null;

  function handleSelectAnnotation(annotationId) {
    setActiveAnnotationId(annotationId);
    setHoveredAnnotationId(annotationId);
  }

  function renderUserParagraph(paragraph, index) {
    const annotation = compareData.find((item) => item.paraIndex === index);

    if (!annotation || !annotationsEnabled) {
      return <p className={styles.essayParagraph}>{paragraph}</p>;
    }

    const isFocused = activeAnnotationId === annotation.id;
    const isHovered = hoveredAnnotationId === annotation.id;

    return (
      <p className={styles.essayParagraph}>
        <span className={styles.essayLineWrap}>
          <button
            type="button"
            className={`${styles.annotationBadge} ${getVariantClass(annotation.type)}`}
            onMouseEnter={() => setHoveredAnnotationId(annotation.id)}
            onMouseLeave={() => {
              if (activeAnnotationId !== annotation.id) {
                setHoveredAnnotationId(null);
              }
            }}
            onClick={() => handleSelectAnnotation(annotation.id)}
          >
            {annotation.id}
          </button>

          <span
            className={`${styles.essayHighlight} ${getVariantClass(annotation.type)} ${
              isFocused ? styles.isFocused : ""
            } ${isHovered ? styles.isHovered : ""}`}
            onMouseEnter={() => setHoveredAnnotationId(annotation.id)}
            onMouseLeave={() => {
              if (activeAnnotationId !== annotation.id) {
                setHoveredAnnotationId(null);
              }
            }}
            onClick={() => handleSelectAnnotation(annotation.id)}
          >
            {paragraph}
          </span>
        </span>
      </p>
    );
  }

  function renderDbParagraph(paragraph, index) {
    const previewAnnotation = activeAnnotation || hoveredAnnotation;
    const matched = previewAnnotation && previewAnnotation.refParaIndex === index;

    return (
      <p
        className={`${styles.essayParagraph} ${styles.dbParagraph} ${
          matched ? `${styles.isLinked} ${getVariantClass(previewAnnotation.type)}` : ""
        }`}
      >
        {paragraph}
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
            <span>{annotationsEnabled ? "Annotations on" : "Annotations off"} </span>
          </button>

          <button
            type="button"
            className={styles.ghostButton}
            onClick={() => {
              setCompareData([]);
              setActiveAnnotationId(null);
              setHoveredAnnotationId(null);
              setSubmittedUserInput("");
            }}
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

      {compareError && (
        <div className={styles.globalMessage}>
          <div className={styles.compareErrorInline}>{compareError}</div>
        </div>
      )}

      <main className={styles.compareMain}>
        <div className={styles.compareHoverLayout}>
          <div className={styles.essayGrid}>
            <section className={styles.essayColumn}>
              <div className={styles.essayCard}>
                <div className={styles.essayCardHeader}>
                  <div className={styles.essayCardLabel}>Your Essay</div>
                  <div className={styles.essayCardTitle}>User Draft</div>
                  <div className={styles.essayCardMeta}>
                    {userParagraphs.join(" ").split(/\s+/).filter(Boolean).length} words
                    <span className={styles.metaSep}>·</span>
                    {userParagraphs.length} paragraphs
                  </div>
                </div>

                <div className={styles.essayCardBody}>
                  {userParagraphs.map((paragraph, index) => (
                    <div key={index}>{renderUserParagraph(paragraph, index)}</div>
                  ))}
                </div>

                <div className={styles.essayCardFooter}>
                  {userParagraphs.join(" ").split(/\s+/).filter(Boolean).length} words
                  <span className={styles.metaSep}>·</span>
                  {userParagraphs.length} paragraphs
                </div>
              </div>
            </section>

            <section className={styles.essayColumn}>
              <div className={styles.essayCard}>
                <div className={styles.essayCardHeader}>
                  <div className={styles.essayCardLabel}>Database Essay</div>
                  <div className={styles.essayCardTitle}>{essayData?.id || id}</div>
                  <div className={styles.metaChipRow}>
                    {essayData?.school && (
                      <span className={`${styles.metaChip} ${styles.chipSchool}`}>
                        {essayData.school}
                      </span>
                    )}

                    {essayData?.type && (
                      <span className={`${styles.metaChip} ${styles.chipType}`}>
                        {essayData.type}
                      </span>
                    )}

                    <span className={`${styles.metaChip} ${styles.chipRef}`}>
                      Reference essay
                    </span>
                  </div>
                </div>

                <div className={styles.essayCardBody}>
                  {dbParagraphs.map((paragraph, index) => (
                    <div key={index}>{renderDbParagraph(paragraph, index)}</div>
                  ))}
                </div>

                <div className={styles.essayCardFooter}>
                  {dbParagraphs.join(" ").split(/\s+/).filter(Boolean).length} words
                  <span className={styles.metaSep}>·</span>
                  {dbParagraphs.length} paragraphs
                </div>
              </div>
            </section>
          </div>

          {/* Hover side card */}
          <aside
            className={`${styles.hoverNoteRail} ${
              hoveredAnnotation ? styles.hoverNoteRailVisible : ""
            }`}
          >
            {hoveredAnnotation && (
              <div className={styles.hoverNoteCard}>
                <div
                  className={`${styles.hoverNoteAccent} ${getVariantClass(
                    hoveredAnnotation.type
                  )}`}
                />
                <div className={styles.hoverNoteBody}>
                  <div
                    className={`${styles.hoverNoteCategory} ${getVariantClass(
                      hoveredAnnotation.type
                    )}`}
                  >
                    {hoveredAnnotation.type}
                  </div>

                  <div className={styles.hoverNoteTitle}>
                    {hoveredAnnotation.title}
                  </div>

                  <div className={styles.hoverNotePreview}>
                     {(hoveredAnnotation.analysis || "See suggestion details.").slice(0, 72)}
                     {(hoveredAnnotation.analysis || "").length > 72 ? "..." : ""}
                  </div>

                  <button
                    type="button"
                    className={styles.hoverNoteButton}
                    onClick={() => handleSelectAnnotation(hoveredAnnotation.id)}
                  >
                    See full analysis
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      <section
        className={`${styles.bottomPanel} ${
          activeAnnotation ? styles.bottomPanelOpen : ""
        }`}
      >
        <div className={styles.bottomPanelHandle} />

        {activeAnnotation ? (
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
                  <div className={styles.panelType}>{activeAnnotation.type}</div>
                  <div className={styles.panelTitle}>{activeAnnotation.title}</div>
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
              <div className={styles.panelBlock}>
                <div className={styles.panelBlockLabel}>Your sentence</div>
                <div className={styles.panelQuoteBox}>
                  {activeAnnotation.highlight || "No highlighted sentence returned."}
                </div>
              </div>

              <div className={styles.panelBlock}>
                <div className={styles.panelBlockLabel}>Matched sentence</div>
                <div className={styles.panelQuoteBox}>
                  {activeAnnotation.matched || "No matched sentence returned."}
                </div>
              </div>

              <div className={styles.panelBlock}>
                <div className={styles.panelBlockLabel}>Suggestions</div>
                <div className={styles.panelSuggestionList}>
                  {activeAnnotation.suggestions?.length > 0 ? (
                    activeAnnotation.suggestions.map((item, index) => (
                      <div key={index} className={styles.panelSuggestionItem}>
                        <span className={styles.suggestionNumber}>{index + 1}</span>
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
        ) : (
          <div className={styles.bottomPanelEmpty}>
            Click a highlighted sentence to view the suggestion details.
          </div>
        )}
      </section>
    </div>
  );
}

export default ComparePage;