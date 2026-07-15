import { forwardRef } from "react";
import { FileText, Search } from "lucide-react";

import styles from "../styles/home.module.css";

const MATCHES = [
  { initials: "H", name: "Harvard University", topic: "Nanotech Research Passion", similarity: "94%" },
  { initials: "S", name: "Stanford University", topic: "What Real Learning Means", similarity: "89%" },
  { initials: "C", name: "Columbia University", topic: "Music for Healing", similarity: "85%" },
];

const HeroMockup = forwardRef(function HeroMockup(_props, ref) {
  return (
    <div className={styles.heroVisual} ref={ref}>
      <div className={styles.heroMockup}>
        <div className={styles.mockupPanel}>
          <div className={styles.mockupPanelHeader}>
            <span className={styles.mockupIcon}>
              <FileText size={16} />
            </span>
            <div>
              <p className={styles.mockupPanelTitle}>Your Essay</p>
              <p className={styles.mockupPanelSub}>Personal statement draft</p>
            </div>
          </div>

          <div className={styles.mockupEssayBox}>
            <p className={styles.mockupEssayText}>
              Ever since my first day volunteering at the community clinic, I
              knew I wanted to make a difference in people&apos;s lives.
              <span className={styles.mockupCursor} />
            </p>
          </div>

          <div className={styles.mockupEssayFooter}>
            <span className={styles.mockupBadge}>Draft</span>
            <span className={styles.mockupWordCount}>612 words</span>
          </div>
        </div>

        <div className={styles.mockupPanel}>
          <div className={styles.mockupPanelHeader}>
            <span className={styles.mockupIcon}>
              <Search size={16} />
            </span>
            <div>
              <p className={styles.mockupPanelTitle}>Similar Accepted Essays</p>
              <p className={styles.mockupPanelSub}>Ranked by match</p>
            </div>
          </div>

          <div className={styles.mockupMatchList}>
            {MATCHES.map((match) => (
              <div className={styles.mockupMatchItem} key={match.name}>
                <span className={styles.mockupMatchBar} />
                <span className={styles.mockupMatchAvatar}>{match.initials}</span>
                <div className={styles.mockupMatchInfo}>
                  <strong>{match.name}</strong>
                  <span>{match.topic}</span>
                </div>
                <span className={styles.mockupSimilarity}>{match.similarity}</span>
              </div>
            ))}
          </div>

          <a href="#how-it-works" className={styles.mockupViewAll}>
            View all matches →
          </a>
        </div>
      </div>
    </div>
  );
});

export default HeroMockup;
