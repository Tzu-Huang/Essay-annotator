import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import styles from "../styles/home.module.css";

const FALLBACK_ESSAY_COUNT = 219;
const API_BASE = import.meta.env.VITE_API_URL;

const ESSAYS = [
  {
    id: "essay_0039",
    school: "Harvard University",
    title: "Nanotech Research Passion",
    description:
      "A research experience in nanotechnology reveals the writer's deep fascination with science and lifelong ambition for discovery.",
  },
  {
    id: "essay_0042",
    school: "Stanford University",
    title: "What Real Learning Means",
    description:
      "A summer science program transforms the writer's view of learning into curiosity and discovery.",
  },
  {
    id: "essay_0185",
    school: "Columbia University",
    title: "Music for Healing",
    description:
      "A hospital performance inspires the writer to use music to support a child with a rare disease.",
  },
  {
    id: "essay_0043",
    school: "University of Pennsylvania",
    title: "Small Changes, Big Impact",
    description:
      "From public health service to medical research, meaningful change often begins with small solutions.",
  },
  {
    id: "essay_0026",
    school: "Johns Hopkins",
    title: "Standing Out and Fitting In",
    description:
      "A journey through self-expression and belonging helps the writer discover authenticity and community coexist.",
  },
  {
    id: "essay_0009",
    school: "Ivy League",
    title: "Finding Identity Underwater",
    description:
      "Scuba diving becomes a refuge of peace for a writer navigating cultural identity between two worlds.",
  },
];

function Home({ onOpenSignIn }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [essayCount, setEssayCount] = useState(FALLBACK_ESSAY_COUNT);

  useEffect(() => {
    document.documentElement.classList.add("homepage-scrollbar-hidden");
    document.body.classList.add("homepage-scrollbar-hidden");

    return () => {
      document.documentElement.classList.remove("homepage-scrollbar-hidden");
      document.body.classList.remove("homepage-scrollbar-hidden");
    };
  }, []);

  useEffect(() => {
    if (!API_BASE) return undefined;

    const controller = new AbortController();

    async function fetchEssayCount() {
      try {
        const response = await fetch(`${API_BASE}/ready`, {
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data = await response.json();
        if (Number.isFinite(data.essay_count) && data.essay_count > 0) {
          setEssayCount(data.essay_count);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.warn("Unable to load essay count; using fallback.", error);
        }
      }
    }

    fetchEssayCount();

    return () => controller.abort();
  }, []);

  const handleStartWriting = () => {
    if (user) {
      navigate("/editor");
      return;
    }

    onOpenSignIn();
  };

  return (
    <main className={styles.home}>
      <div className={styles.introScroll}>
        <div className={styles.introScreen}>
          <span className={`${styles.ambientBlob} ${styles.blobOne}`} />
          <span className={`${styles.ambientBlob} ${styles.blobTwo}`} />

          <section className={styles.hero}>
            <div className={styles.wrap}>
              <h1>
                RELEVANT essays
                <br />
                not <span className={styles.accent}>impressive</span> ones.
              </h1>

              <p className={styles.dek}>
                Paste your draft. We'll find the accepted essays closest to
                yours — matched by what you're actually writing about, not by
                keyword.
              </p>

              <div className={styles.heroActions}>
                <button
                  type="button"
                  className={styles.primaryButton}
                  onClick={handleStartWriting}
                >
                  Start writing
                </button>
                <a href="#how-it-works" className={styles.outlineButton}>
                  See how it works
                </a>
              </div>

              <div className={styles.credentialRow}>
                <div className={styles.credential}>
                  <b>
                    <CountUpNumber value={15} easing="linear" />
                  </b>
                  <span>Different topics</span>
                </div>
                <div className={styles.credential}>
                  <b>
                    <CountUpNumber value={essayCount} />
                    <span className={styles.countPlus}>+</span>
                  </b>
                  <span>Accepted essays</span>
                </div>
                <div className={styles.credential}>
                  <b>Free</b>
                  <span>To get started</span>
                </div>
              </div>
            </div>
          </section>

          <div className={styles.peekWrap}>
            <div className={styles.peekPanel}>
              <span className={styles.peekMatch}>88% match | Live preview</span>
              <span className={styles.peekStat}>
                <b>200+</b> essays analyzed
              </span>

              <div className={styles.peekTopbar}>
                <span className={`${styles.peekDot} ${styles.red}`} />
                <span className={`${styles.peekDot} ${styles.yellow}`} />
                <span className={`${styles.peekDot} ${styles.green}`} />
                <span className={styles.peekUrl}>essayannotator.com/compare</span>
              </div>

              <div className={styles.peekBody}>
                <div className={`${styles.peekPane} ${styles.mine}`}>
                  <p className={styles.peekPaneHead}>Your Essay</p>
                  <p className={styles.peekText}>
                    Ever since my first day volunteering at the community
                    clinic, I knew I wanted to make a difference in people's
                    lives. <span className={styles.peekBadge}>1</span>{" "}
                    <span className={`${styles.peekHighlight} ${styles.orange}`}>
                      The experience opened my eyes
                    </span>{" "}
                    to how small acts of kindness can have a big impact.{" "}
                    <span className={`${styles.peekBadge} ${styles.alt}`}>2</span>
                    <span className={styles.peekCursor} />
                  </p>
                </div>

                <div className={`${styles.peekPane} ${styles.theirs}`}>
                  <p className={styles.peekPaneHead}>Sample Essay</p>
                  <p className={styles.peekText}>
                    Stepping into the local hospital sophomore summer, I
                    embraced the role of student volunteer, eager to assist
                    patients. <span className={styles.peekBadge}>1</span>{" "}
                    <span className={`${styles.peekHighlight} ${styles.greenText}`}>
                      The sterile scent of alcohol greeted me
                    </span>{" "}
                    and the vast, maze-like hospital left me disoriented.{" "}
                    <span className={`${styles.peekBadge} ${styles.alt}`}>2</span>
                  </p>
                </div>
              </div>

              <div className={styles.peekComments}>
                <div className={styles.peekComment}>
                  <span className={`${styles.peekCommentDot} ${styles.orange}`} />
                  Specific, sensory detail stands out immediately
                </div>
                <div className={styles.peekComment}>
                  <span className={`${styles.peekCommentDot} ${styles.greenText}`} />
                  Matches the opening style of top-ranked essays
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        id="how-it-works"
        className={`${styles.section} ${styles.howSection}`}
      >
        <div className={styles.wrap}>
          <SectionHead
            eyebrow="Procedure"
            title="How the review is conducted"
            copy="Three stages, modeled on how an admissions reader actually evaluates a personal statement."
          />

          <div className={styles.steps}>
            <Step
              rank="I"
              title="Paste your draft"
              copy="Essay Annotator maps your voice, structure, and story from the first line, any draft, any stage."
            />
            <Step
              rank="II"
              title="Find similar accepted essays"
              copy="We surface accepted essays that mirror your topic, tone, and structure, not just keywords."
            />
            <Step
              rank="III"
              title="Learn what works"
              copy="See the exact patterns that make accepted essays land, highlighted directly on your writing."
            />
          </div>
        </div>
      </section>

      <Divider />

      <section className={styles.section}>
        <div className={styles.wrap}>
          <SectionHead
            eyebrow="Comparative Review"
            title="See what makes strong essays work"
            titleClassName={styles.singleLineTitle}
            copy="Your draft, reviewed side by side with a real accepted essay."
          />

          <div className={styles.certificate}>
            <div className={styles.certHead}>
              <p>Comparative Reading | Prompt Matched</p>
            </div>

            <div className={styles.certBody}>
              <div className={`${styles.certCol} ${styles.admittedCol}`}>
                <h4>Candidate draft</h4>
                <h3>Your essay</h3>
                <p>Ever since my first day volunteering at the community clinic,</p>
                <p>I knew I wanted to make a difference in people's lives.</p>
                <p>
                  <span className={styles.certHighlight}>
                    The experience opened my eyes to how small acts of kindness
                    can have a big impact.
                  </span>
                </p>
                <p>I hope to continue this journey in college and beyond.</p>
              </div>

              <div className={styles.certDivider}>
                <span className={styles.relationButton}>
                  See how they are related
                </span>
              </div>

              <div className={styles.certCol}>
                <h4>Admitted essay</h4>
                <h3>A First Day at the Hospital</h3>
                <p>
                  Stepping into the local hospital sophomore summer, I embraced
                  the role of student volunteer, eager to assist patients.{" "}
                  <span className={styles.certHighlight}>
                    The sterile scent of alcohol greeted me and the vast,
                    maze-like hospital left me disoriented,
                  </span>{" "}
                  so I struggled to find the desired locations in the
                  labyrinthine hallways.
                </p>
                <p className={styles.ellipsis}>...</p>
              </div>

              <div className={styles.certNote}>
                <b>Stronger opening image</b>
                <span>
                  A First Day at the Hospital turns a general idea into a vivid, sensory image
                  that pulls readers in.
                </span>
                <div className={styles.rewriteDemo} aria-label="Opening image rewrite demonstration">
                  <div className={styles.rewriteBefore}>
                    <small>Draft line</small>
                    <p>
                      The experience opened my eyes to how small acts of
                      kindness can have a big impact.
                    </p>
                  </div>
                  <div className={styles.rewriteFlow} aria-hidden="true">
                    <span>setting</span>
                    <span>sensory detail</span>
                    <span>specific movement</span>
                  </div>
                  <div className={styles.rewriteAfter}>
                    <small>Stronger opening</small>
                    <p>
                      The sterile scent of alcohol greeted me as I stepped into
                      the hospital hallway.
                    </p>
                  </div>
                </div>
                <Link to="/editor" className={styles.analysisButton}>
                  See full analysis
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Divider />

      <section id="library" className={styles.section}>
        <div className={styles.wrap}>
          <SectionHead
            eyebrow="The Archive"
            title="Explore real accepted essays"
            copy="Essays from students admitted to top universities."
          />

          <div className={styles.libraryGrid}>
            {ESSAYS.map((essay) => (
              <Link to={`/essay/${essay.id}`} className={styles.card} key={essay.id}>
                <span className={styles.school}>{essay.school}</span>
                <h3>{essay.title}</h3>
                <p>{essay.description}</p>
                <span className={styles.go}>Read more</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      <section className={styles.section}>
        <div className={styles.wrap}>
          <SectionHead eyebrow="Committee Notes" title="Why Essay Annotator?" />

          <HonestScale essayCount={essayCount} />
        </div>
      </section>

      <section className={styles.cta}>
        <div className={styles.wrap}>
          <h2>
            Ready to improve
            <br />
            your essay?
          </h2>
          <p>
            Access a curated database of 200+ real essays accepted into Harvard,
            MIT, Stanford, and other top universities.
          </p>

          <div className={styles.ctaStats}>
            <div className={styles.stat}>
              <b>
                <CountUpNumber value={essayCount} />
                <span className={styles.countPlus}>+</span>
              </b>
              <span>Accepted essays</span>
            </div>
            <div className={styles.stat}>
              <b>
                <CountUpNumber value={15} easing="linear" />
              </b>
              <span>Different topics</span>
            </div>
            <div className={styles.stat}>
              <b>Free</b>
              <span>To get started</span>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={handleStartWriting}
          >
            Start writing
          </button>
        </div>
      </section>
    </main>
  );
}

function SectionHead({ eyebrow, title, copy, titleClassName }) {
  return (
    <div className={styles.sectionHead}>
      <p>{eyebrow}</p>
      <h2 className={titleClassName}>{title}</h2>
      {copy ? <span>{copy}</span> : null}
    </div>
  );
}

const SCALE_ROWS = [
  { label: "Sourced from essays that were actually accepted", generic: 1, us: 7 },
  { label: "Specific to the draft you actually wrote", generic: 2, us: 7 },
  { label: "Shows you the whole essay, not an excerpt", generic: 1, us: 6 },
  { label: "Answers instantly, at any hour", generic: 7, us: 7 },
];

const SCALE_NOTES = [
  {
    row: 0,
    num: "1",
    lead: (count) => `${count} essays, every one from a student who got in.`,
    rest: " Not scraped samples — real files, with the outcome attached.",
  },
  {
    row: 3,
    num: "2",
    lead: () => "A genuine tie.",
    rest: " Your draft is read the moment you paste it; the archive was read long before. The matching itself is arithmetic.",
  },
];

const SCALE_DOTS = 7;

function ScaleDots({ filled, isUs }) {
  return (
    <div className={`${styles.nsDots} ${isUs ? styles.us : ""}`}>
      {Array.from({ length: SCALE_DOTS }, (_, index) => (
        <span
          key={index}
          className={`${styles.nsDot} ${index < filled ? styles.filled : ""}`}
          style={{ transitionDelay: `${index * 45}ms` }}
        />
      ))}
    </div>
  );
}

function HonestScale({ essayCount }) {
  const docRef = useRef(null);
  const margRef = useRef(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const doc = docRef.current;
    const marg = margRef.current;
    if (!doc || !marg) return undefined;

    // Each margin note sits level with the row it annotates; when the layout
    // collapses to one column the notes flow inline instead.
    const align = () => {
      const isStacked = getComputedStyle(marg).position === "static";
      const margTop = marg.getBoundingClientRect().top;

      marg.querySelectorAll(`.${styles.nsNote}`).forEach((note) => {
        if (isStacked) {
          note.style.top = "";
          return;
        }

        const row = doc.querySelector(
          `.${styles.nsRow}[data-row="${note.dataset.row}"]`,
        );
        if (row) {
          note.style.top = `${row.getBoundingClientRect().top - margTop + 18}px`;
        }
      });
    };

    const frameId = requestAnimationFrame(align);
    window.addEventListener("resize", align);
    if (document.fonts) document.fonts.ready.then(align);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          align();
          setIsRevealed(true);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(doc);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("resize", align);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={docRef}
      className={`${styles.nsDoc} ${isRevealed ? styles.on : ""}`}
    >
      <div>
        <div className={styles.nsHead}>
          <span>&nbsp;</span>
          <span>Generic AI</span>
          <span className={styles.nsUs}>Essay Annotator</span>
        </div>

        <div>
          {SCALE_ROWS.map((row, index) => {
            const noteIndex = SCALE_NOTES.findIndex((item) => item.row === index);
            const note = noteIndex === -1 ? null : SCALE_NOTES[noteIndex];
            const isTie = row.generic === row.us;

            return (
              <div
                key={row.label}
                data-row={index}
                className={`${styles.nsRow} ${isTie ? styles.nsTie : ""}`}
              >
                <b>
                  {row.label}
                  {note ? (
                    <span
                      className={styles.nsMk}
                      style={{ transitionDelay: `${480 + noteIndex * 220}ms` }}
                    >
                      {note.num}
                    </span>
                  ) : null}
                </b>
                <ScaleDots filled={row.generic} isUs={false} />
                <ScaleDots filled={row.us} isUs />
              </div>
            );
          })}
        </div>
      </div>

      <div ref={margRef} className={styles.nsMarg}>
        {SCALE_NOTES.map((note, index) => (
          <div
            key={note.num}
            data-row={note.row}
            className={styles.nsNote}
            style={{ transitionDelay: `${560 + index * 220}ms` }}
          >
            <span className={styles.nsNum}>{note.num}</span>
            <span className={styles.nsTxt}>
              <b>{note.lead(essayCount)}</b>
              {note.rest}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getPrefersReducedMotion() {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function CountUpNumber({
  value,
  duration = 5500,
  pause = 2400,
  resetPause = 520,
  easing = "default",
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isResetting, setIsResetting] = useState(true);
  const prefersReducedMotion = getPrefersReducedMotion();
  const renderedDisplayValue = prefersReducedMotion ? value : displayValue;
  const renderedIsResetting = prefersReducedMotion ? false : isResetting;
  const elementRef = useRef(null);
  const frameRef = useRef(null);
  const timeoutsRef = useRef([]);
  const lastDisplayRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;

    if (prefersReducedMotion) {
      return undefined;
    }

    let isVisible = false;
    let isCancelled = false;

    const clearTimers = () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }

      timeoutsRef.current.forEach((timeoutId) => clearTimeout(timeoutId));
      timeoutsRef.current = [];
    };

    const runAnimation = () => {
      setIsResetting(true);
      lastDisplayRef.current = 0;
      setDisplayValue(0);

      timeoutsRef.current.push(
        setTimeout(() => {
          if (isCancelled || !isVisible) return;
          setIsResetting(false);
          let startedAt;

          const animate = (timestamp) => {
            if (isCancelled || !isVisible) return;
            if (!startedAt) startedAt = timestamp;

            const progress = Math.min((timestamp - startedAt) / duration, 1);
            let nextValue;

            if (easing === "linear") {
              nextValue = Math.floor(value * progress);
            } else {
              const cosineProgress = 0.5 * (1 - Math.cos(Math.PI * progress));
              nextValue = Math.floor(value * cosineProgress);
            }

            nextValue = Math.min(value, nextValue);
            if (nextValue !== lastDisplayRef.current || progress === 1) {
              lastDisplayRef.current = nextValue;
              setDisplayValue(progress === 1 ? value : nextValue);
            }

            if (progress < 1) {
              frameRef.current = requestAnimationFrame(animate);
            }
          };

          frameRef.current = requestAnimationFrame(animate);
        }, resetPause),
      );

      timeoutsRef.current.push(
        setTimeout(() => {
          if (isCancelled || !isVisible) return;
          runAnimation();
        }, resetPause + duration + pause),
      );
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (entry?.isIntersecting) {
          if (isVisible) return;
          isVisible = true;
          clearTimers();
          runAnimation();
          return;
        }

        isVisible = false;
        clearTimers();
        setIsResetting(true);
        lastDisplayRef.current = 0;
        setDisplayValue(0);
      },
      { threshold: 0.55 },
    );

    observer.observe(element);

    return () => {
      isCancelled = true;
      observer.disconnect();
      clearTimers();
    };
  }, [duration, easing, pause, prefersReducedMotion, resetPause, value]);

  const targetDigits = String(value).split("");
  const lastIndex = targetDigits.length - 1;

  return (
    <span ref={elementRef} className={styles.countNumber}>
      {targetDigits.map((_, index) => {
        const distanceFromRight = lastIndex - index;
        const placeValue = 10 ** distanceFromRight;
        const targetStep = Math.floor(renderedDisplayValue / placeValue);
        const isLeadingHidden = renderedDisplayValue < placeValue && distanceFromRight > 0;
        const sequence = Array.from({ length: targetStep + 1 }, (_, step) =>
          String(step % 10),
        );

        return (
          <span
            className={`${styles.digitWindow} ${
              isLeadingHidden ? styles.digitWindowHidden : ""
            }`}
            key={`${index}-${value}`}
          >
            <span
              className={`${styles.digitTrack} ${
                renderedIsResetting ? styles.digitTrackResetting : ""
              }`}
              style={{
                transform: `translateY(-${targetStep}em)`,
                transitionDuration:
                  renderedDisplayValue >= value - 1 ? "320ms" : undefined,
              }}
            >
              {sequence.map((number, step) => (
                <span className={styles.digit} key={`${number}-${step}`}>
                  {number}
                </span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}

function Step({ rank, title, copy }) {
  return (
    <div className={styles.step}>
      <div className={styles.rank}>{rank}</div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </div>
  );
}

function Divider() {
  return <hr className={styles.divider} />;
}

export default Home;
