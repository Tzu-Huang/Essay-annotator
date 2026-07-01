import { forwardRef, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import styles from "../styles/home.module.css";

const ESSAY_TEXT =
  "Born in New York, I have lived abroad most of my life. Shanghai for 8 years and Taiwan making up most of the rest. Navigating these extremes has molded my international perspective, and I easily adapt to new environments…";

const HeroMockup = forwardRef(function HeroMockup({ onOpenSignIn }, ref) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const textRef = useRef(null);
  const wcRef = useRef(null);

  useEffect(() => {
    const el = textRef.current;
    const wc = wcRef.current;
    let i = 0;
    const iv = setInterval(() => {
      if (i >= ESSAY_TEXT.length) {
        clearInterval(iv);
        el.innerHTML = ESSAY_TEXT + `<span class="${styles.mockupCursor}"></span>`;
        return;
      }
      i++;
      el.innerHTML =
        ESSAY_TEXT.slice(0, i) + `<span class="${styles.mockupCursor}"></span>`;
      wc.textContent = Math.round(i / 5) + " words";
    }, 28);
    return () => clearInterval(iv);
  }, []);

  const handleViewAll = (e) => {
    e.preventDefault();
    if (user) {
      navigate("/editor");
    } else {
      onOpenSignIn();
    }
  };

  return (
    <div className={styles.heroVisual} ref={ref}>
      <div className={styles.heroMockup}>
        {/* ── Left panel — Your Essay ── */}
        <div className={styles.mockupPanel}>
          <div className={styles.mockupPanelHeader}>
            <div className={styles.mockupIcon}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            </div>
            <div>
              <p className={styles.mockupPanelTitle}>Your Essay</p>
              <p className={styles.mockupPanelSub}>
                Preview and enhance your essay
              </p>
            </div>
          </div>

          <div className={styles.mockupEssayBox}>
            <p className={styles.mockupEssayText} ref={textRef} />
          </div>

          <div className={styles.mockupEssayFooter}>
            <span className={styles.mockupBadge}>Your Draft</span>
            <span className={styles.mockupWordCount} ref={wcRef}>0 words</span>
          </div>
        </div>

        {/* ── Right panel — Similar Accepted Essays ── */}
        <div className={styles.mockupPanel}>
          <div className={styles.mockupPanelHeader}>
            <div className={styles.mockupIcon}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M8 12h8M8 8h4" />
              </svg>
            </div>
            <div>
              <p className={styles.mockupPanelTitle}>Similar Accepted Essays</p>
              <p className={styles.mockupPanelSub}>
                Find and compare similar successful essays
              </p>
            </div>
          </div>

          <div className={styles.mockupMatchList}>
            <div className={styles.mockupMatchItem}>
              <div className={styles.mockupMatchBar} />
              <div className={styles.mockupMatchAvatar}>
                k
              </div>
              <div className={styles.mockupMatchInfo}>
                <strong>Essay_0155</strong>
                <span>University of California</span>
              </div>
              <span className={styles.mockupSimilarity}>46% similar</span>
            </div>

            <div className={styles.mockupMatchItem}>
              <div className={styles.mockupMatchBar} />
              <div className={styles.mockupMatchAvatar}>
                k
              </div>
              <div className={styles.mockupMatchInfo}>
                <strong>Essay_0098</strong>
                <span>Northwestern University</span>
              </div>
              <span className={styles.mockupSimilarity}>43% similar</span>
            </div>

            <div className={styles.mockupMatchItem}>
              <div className={styles.mockupMatchBar} />
              <div className={styles.mockupMatchAvatar}>
                ✕
              </div>
              <div className={styles.mockupMatchInfo}>
                <strong>Essay_0112</strong>
                <span>Duke University</span>
              </div>
              <span className={styles.mockupSimilarity}>42% similar</span>
            </div>
          </div>

          <a href="#" className={styles.mockupViewAll} onClick={handleViewAll}>
            View all matches →
          </a>
        </div>
      </div>
    </div>
  );
});

export default HeroMockup;
