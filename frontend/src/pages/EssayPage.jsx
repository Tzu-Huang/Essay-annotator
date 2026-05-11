import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import styles from "../styles/EssayPage.module.css";

function EssayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setError("");

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
        );

        if (!response.ok) {
          throw new Error(`Fail to fetch essay: ${response.status}`);
        }

        const data = await response.json();
        setEssay(data);
      } catch (err) {
        console.error("ERROR:", err);
        setError("Failed to load essay.");
      }
    };

    fetchEssay();
  }, [id]);

  const handleCompare = () => {
    navigate(`/compare/${id}`);
  };

  if (error) {
    return <p className={styles.loading}>{error}</p>;
  }

  return (
    <div className={styles.essayPage}>
      {essay ? (
        <>
          {/* NAV */}
          <div className={styles.essayNav}>
            <div className={styles.logo}>
              Essay <span>AI</span>
            </div>

            <div className={styles.navLinks}>
              <span>Home</span>
              <span>My Essays</span>
              <span>Examples</span>
              <span>About Us</span>
            </div>
          </div>

          {/* HERO */}
          <div className={styles.essayHero}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back to Results
            </button>

            <h1 title={essay.topic}>{essay.topic}</h1>

            <div className={styles.metaRow}>
              {essay.essay_type && (
                <span className={`${styles.badge} ${styles.type}`}>
                  {essay.essay_type}
                </span>
              )}

              {essay.word_count && (
                <span className={`${styles.badge} ${styles.words}`}>
                  {essay.word_count} words
                </span>
              )}
            </div>
          </div>

          {/* MAIN */}
          <div className={styles.essayLayout}>
            {/* LEFT SIDEBAR */}
            <div className={styles.sidebar}>
              <div className={`${styles.card} ${styles.infoCard}`}>
                <h3>Essay Info</h3>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>▣</div>
                  <div>
                    <span>Word Count</span>
                    <b>{essay.word_count || essay.words || "-"}</b>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>Aa</div>
                  <div>
                    <span>Type</span>
                    <b>{essay.essay_type || essay.type || "-"}</b>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>⌂</div>
                  <div>
                    <span>School</span>
                    <b>{essay.school || "-"}</b>
                  </div>
                </div>
              </div>

              <div className={`${styles.card} ${styles.noteCard}`}>
                <h3>Reading Guide</h3>
                <p>
                  This essay example is provided for learning structure, tone,
                  and storytelling techniques.
                </p>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className={styles.contentCard}>
              <div className={styles.essayText}>
                {essay.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className={styles.actionBar}>
                <button className={styles.primaryBtn} onClick={handleCompare}>
                  ⚡ Compare with My Essay
                </button>

                <div className={styles.secondaryBtns}>
                  <button>
                    <Copy size={16} />
                    Copy
                  </button>

                  <button>
                    <Download size={16} />
                    Download
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.featureStrip}>
            <div className={styles.featureItem}>
              🛡
              <div>
                <b>AI-Powered</b>
                <p>Smart comparison support</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              ✦
              <div>
                <b>High Quality</b>
                <p>Curated essay examples</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              📖
              <div>
                <b>Learning Focused</b>
                <p>Improve through examples</p>
              </div>
            </div>

            <div className={styles.featureItem}>
              🔒
              <div>
                <b>Your Privacy</b>
                <p>Your essay stays secure</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className={styles.loading}>Loading...</p>
      )}
    </div>
  );
}

export default EssayPage;