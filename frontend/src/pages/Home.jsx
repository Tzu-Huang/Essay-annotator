<<<<<<< HEAD
import { Link } from "react-router-dom";
import {
  FileText,
  FileCheck,
  Search,
  TrendingUp,
} from "lucide-react";

import styles from "../styles/home.module.css";

function Home() {
  const curatedEssays = [
    {
      id: "essay_0039",
      school: "Harvard University",
      topic:
        "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you?",
      title: "Nanotech Research Passion",
      description:
        "A research experience in nanotechnology reveals the writer’s deep fascination with science and lifelong ambition for discovery.",
      logo: "/logos/harvard.svg",
    },
    {
      id: "essay_0042",
      school: "Stanford University",
      topic:
        "The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.",
      title: "What Real Learning Means",
      description:
        "A summer science program transforms the writer’s view of learning from memorization into curiosity, collaboration, and discovery.",
      logo: "/logos/stanford.png",
    },
    {
      id: "essay_0185",
      school: "Columbia University",
      topic:
        "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.",
      title: "Music for Healing",
      description:
        "A hospital performance inspires the writer to use music to support a child with a rare disease.",
      logo: "/logos/columbia.jpg",
    },
    {
      id: "essay_0043",
      school: "University of Pennsylvania",
      topic:
        "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
      title: "Small Changes, Big Impact",
      description:
        "From public health service to medical research, the writer learns that meaningful change often begins with small, practical solutions.",
      logo: "/logos/upenn.svg",
    },
    {
      id: "essay_0026",
      school: "Johns Hopkins",
      topic:
        "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
      title: "Standing Out and Fitting In",
      description:
        "A journey through self-expression, insecurity, and belonging helps the writer discover that authenticity and community can coexist.",
      logo: "/logos/jhu.webp",
    },
    {
      id: "essay_0025",
      school: "Johns Hopkins",
      topic:
        "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.",
      title: "Learning Through Frustration",
      description:
        "Struggles in art and data science teach the writer that patience and perseverance can turn frustration into growth.",
      logo: "/logos/jhu.webp",
    },
    {
      id: "essay_0029",
      school: "Johns Hopkins",
      topic:
        "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
      title: "Building Community Through Music",
      description:
        "Through carefully curated playlists, the writer uses music to unite teammates, classmates, and younger students across different communities.",
      logo: "/logos/jhu.webp",
    },
    {
      id: "essay_0004",
      school: "Ivy League",
      topic:
        "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
      title: "Justice, Courage, and Compassion",
      description:
        "A school discipline hearing reshapes the writer’s view of justice as a balance between accountability and empathy.",
      logo: "/logos/ivy.png",
    },
    {
      id: "essay_0009",
      school: "Ivy League",
      topic:
        "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
      title: "Finding Identity Underwater",
      description:
        "Scuba diving becomes a refuge of peace and equality for a writer navigating cultural identity and life between two worlds.",
      logo: "/logos/ivy.png",
    },
    {
      id: "essay_0005",
      school: "Ivy League",
      topic:
        "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
      title: "The Hot Sauce Sommelier",
      description:
        "A love of spice becomes a vivid lens for exploring curiosity, culture, adventure, and personal identity.",
      logo: "/logos/ivy.png",
    },
  ];

  const scrollingEssays = [...curatedEssays, ...curatedEssays];

  return (
    <div className={styles.home}>
      <section className={styles.hero}>
        <div className={styles.heroDecor} />

          <h1>
            Get Into Top Colleges By Learning From 
            <br />
            <span>200+ Real Accepted Essays</span>
          </h1>

=======
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileCheck,
  Search,
  TrendingUp,
  Upload,
  ScanSearch,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "../styles/home.module.css";
import { useAuth } from "../hooks/useAuth";

gsap.registerPlugin(ScrollTrigger);

const CURATED_ESSAYS = [
  {
    id: "essay_0039",
    school: "Harvard University",
    topic:
      "Describe a topic, idea, or concept you find so engaging that it makes you lose all track of time. Why does it captivate you?",
    title: "Nanotech Research Passion",
    description:
      "A research experience in nanotechnology reveals the writer's deep fascination with science and lifelong ambition for discovery.",
    logo: "/logos/harvard.svg",
  },
  {
    id: "essay_0042",
    school: "Stanford University",
    topic:
      "The Stanford community is deeply curious and driven to learn in and out of the classroom. Reflect on an idea or experience that makes you genuinely excited about learning.",
    title: "What Real Learning Means",
    description:
      "A summer science program transforms the writer's view of learning from memorization into curiosity, collaboration, and discovery.",
    logo: "/logos/stanford.png",
  },
  {
    id: "essay_0185",
    school: "Columbia University",
    topic:
      "Share an essay on any topic of your choice. It can be one you've already written, one that responds to a different prompt, or one of your own design.",
    title: "Music for Healing",
    description:
      "A hospital performance inspires the writer to use music to support a child with a rare disease.",
    logo: "/logos/columbia.jpg",
  },
  {
    id: "essay_0043",
    school: "University of Pennsylvania",
    topic:
      "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    title: "Small Changes, Big Impact",
    description:
      "From public health service to medical research, the writer learns that meaningful change often begins with small, practical solutions.",
    logo: "/logos/upenn.svg",
  },
  {
    id: "essay_0026",
    school: "Johns Hopkins",
    topic:
      "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    title: "Standing Out and Fitting In",
    description:
      "A journey through self-expression, insecurity, and belonging helps the writer discover that authenticity and community can coexist.",
    logo: "/logos/jhu.webp",
  },
  {
    id: "essay_0025",
    school: "Johns Hopkins",
    topic:
      "The lessons we take from obstacles we encounter can be fundamental to later success. Recount a time when you faced a challenge, setback, or failure.",
    title: "Learning Through Frustration",
    description:
      "Struggles in art and data science teach the writer that patience and perseverance can turn frustration into growth.",
    logo: "/logos/jhu.webp",
  },
  {
    id: "essay_0029",
    school: "Johns Hopkins",
    topic:
      "Discuss an accomplishment, event, or realization that sparked a period of personal growth and a new understanding of yourself or others.",
    title: "Building Community Through Music",
    description:
      "Through carefully curated playlists, the writer uses music to unite teammates, classmates, and younger students across different communities.",
    logo: "/logos/jhu.webp",
  },
  {
    id: "essay_0004",
    school: "Ivy League",
    topic:
      "Reflect on a time when you questioned or challenged a belief or idea. What prompted your thinking? What was the outcome?",
    title: "Justice, Courage, and Compassion",
    description:
      "A school discipline hearing reshapes the writer's view of justice as a balance between accountability and empathy.",
    logo: "/logos/ivy.png",
  },
  {
    id: "essay_0009",
    school: "Ivy League",
    topic:
      "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
    title: "Finding Identity Underwater",
    description:
      "Scuba diving becomes a refuge of peace and equality for a writer navigating cultural identity and life between two worlds.",
    logo: "/logos/ivy.png",
  },
  {
    id: "essay_0005",
    school: "Ivy League",
    topic:
      "Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.",
    title: "The Hot Sauce Sommelier",
    description:
      "A love of spice becomes a vivid lens for exploring curiosity, culture, adventure, and personal identity.",
    logo: "/logos/ivy.png",
  },
];

const CARDS_PER_VIEW = 5;
const REPEAT_COUNT = 80;

const WORDS = ["Improvement.", "Stories.", "Confidence."];

function useTypewriter(words) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    let wi = 0,
      ci = 0,
      deleting = false,
      t;
    const tick = () => {
      const word = words[wi];
      if (!deleting) {
        setDisplay(word.slice(0, ++ci));
        if (ci === word.length) {
          deleting = true;
          t = setTimeout(tick, 1800);
          return;
        }
      } else {
        setDisplay(word.slice(0, --ci));
        if (ci === 0) {
          deleting = false;
          wi = (wi + 1) % words.length;
        }
      }
      t = setTimeout(tick, deleting ? 55 : 90);
    };
    t = setTimeout(tick, 600);
    return () => clearTimeout(t);
  }, [words]);
  return display;
}

function Home({ onOpenSignIn }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartWriting = () => {
    if (user) {
      navigate("/editor");
      return;
    }
    onOpenSignIn();
  };

  const loopedEssays = Array.from(
    { length: REPEAT_COUNT },
    () => CURATED_ESSAYS,
  ).flat();

  const startIndex = CURATED_ESSAYS.length * 20;
  const maxEssayIndex = loopedEssays.length - CARDS_PER_VIEW;

  const [essayIndex, setEssayIndex] = useState(startIndex);

  const handlePrevEssay = () => setEssayIndex((prev) => Math.max(prev - 1, 0));
  const handleNextEssay = () =>
    setEssayIndex((prev) => Math.min(prev + 1, maxEssayIndex));

  const typed = useTypewriter(WORDS);

  const heroContentRef = useRef(null);
  const heroPaperRef = useRef(null);
  const stickyGreenRef = useRef(null);
  const matchCardRef = useRef(null);
  const stickyPurpleRef = useRef(null);
  const howItWorksRef = useRef(null);
  const stepsRef = useRef([]);
  const compareSectionRef = useRef(null);
  const featuredRef = useRef(null);
  const differenceSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);

  // Enable scroll snapping only on this page
  useEffect(() => {
    document.documentElement.style.scrollSnapType = "y proximity";
    return () => {
      document.documentElement.style.scrollSnapType = "";
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero content — fades up on load
      gsap.from(heroContentRef.current, {
        opacity: 0,
        y: 32,
        duration: 0.9,
        ease: "power3.out",
        delay: 0.1,
      });

      // Hero visual elements — staggered, each keeps its own rotation
      gsap.from(heroPaperRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.85,
        ease: "power3.out",
        delay: 0.3,
      });
      gsap.from(stickyGreenRef.current, {
        opacity: 0,
        x: 24,
        y: -16,
        duration: 0.7,
        ease: "power2.out",
        delay: 0.55,
      });
      gsap.from(matchCardRef.current, {
        opacity: 0,
        x: -28,
        y: 20,
        duration: 0.75,
        ease: "power2.out",
        delay: 0.7,
      });
      gsap.from(stickyPurpleRef.current, {
        opacity: 0,
        x: 20,
        y: 16,
        duration: 0.7,
        ease: "power2.out",
        delay: 0.85,
      });

      // How it works section — reverses when scrolling back up
      gsap.from(howItWorksRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: "top 82%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Step cards staggered — each reverses individually
      gsap.from(stepsRef.current.filter(Boolean), {
        opacity: 0,
        y: 36,
        duration: 0.65,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: howItWorksRef.current,
          start: "top 75%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Compare section
      gsap.from(compareSectionRef.current, {
        opacity: 0,
        y: 36,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: compareSectionRef.current,
          start: "top 82%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Featured essays section
      gsap.from(featuredRef.current, {
        opacity: 0,
        y: 28,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: featuredRef.current,
          start: "top 84%",
          toggleActions: "play reverse play reverse",
        },
      });

      // Difference section
      gsap.from(differenceSectionRef.current, {
        opacity: 0,
        y: 36,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: differenceSectionRef.current,
          start: "top 82%",
          toggleActions: "play reverse play reverse",
        },
      });

      // CTA
      gsap.from(ctaSectionRef.current, {
        opacity: 0,
        y: 28,
        duration: 0.75,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ctaSectionRef.current,
          start: "top 86%",
          toggleActions: "play reverse play reverse",
        },
      });
    });

    return () => ctx.revert();
  }, []);

  return (
    <div className={styles.home}>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroContent} ref={heroContentRef}>
          <h1 className={styles.heroTitle}>
            <span className={styles.titleLine1}>REAL Essays</span>
            <span className={styles.titleLine2}>
              REAL <span className={styles.typedWord}>{typed}</span>
              <span className={styles.cursor} aria-hidden="true" />
            </span>
          </h1>

          <p className={styles.heroDescription}>
            Upload your draft, find similar successful essays, and see what
            makes them work.
          </p>

          <div className={styles.heroActions}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={handleStartWriting}
            >
              Start Writing
            </button>

            <a href="#how-it-works" className={styles.secondaryLink}>
              See how it works →
            </a>
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.stickyNoteGreen} ref={stickyGreenRef}>
            Learn from essays that actually got in.
          </div>

          <div className={styles.heroPaper} ref={heroPaperRef}>
            <div className={styles.paperColumn}>
              <p className={styles.paperMiniTitle}>Your Essay</p>
              <h3 className={styles.paperMainTitle}>music</h3>

              <div className={styles.pillRow}>
                <span>0 words</span>
                <span>User Draft</span>
              </div>

              <div className={styles.fakeLineShort}></div>
              <div className={styles.fakeLine}></div>
              <div className={styles.fakeLine}></div>
              <div className={styles.fakeLineMedium}></div>
            </div>

            <div className={styles.paperColumn}>
              <p className={styles.paperMiniTitle}>Similar Accepted Essays</p>
              <h3 className={styles.paperMainTitle}>essay_0155</h3>

              <div className={styles.pillRow}>
                <span>University of California</span>
                <span>Reference essay</span>
              </div>

              <p className={styles.paperText}>
                Born in New York, I have lived abroad most of my life: Shanghai
                for 8 years and Taiwan making up most of the rest.
              </p>

              <div className={styles.fakeLine}></div>
              <div className={styles.fakeLine}></div>
              <div className={styles.fakeLineMedium}></div>
            </div>
          </div>

          <div className={styles.matchCard} ref={matchCardRef}>
            <div className={styles.matchHeader}>
              <strong>Top Matches</strong>
              <span className={styles.matchCount}>3</span>
            </div>

            <div className={styles.matchItem}>
              <span className={styles.matchIndex}>1</span>
              <p>What would you say is your greatest talent...</p>
              <b className={styles.matchPercent}>49% similar</b>
            </div>

            <div className={styles.matchItem}>
              <span className={styles.matchIndex}>2</span>
              <p>In addition to my major, my academic interests include...</p>
              <b className={styles.matchPercent}>46% similar</b>
            </div>

            <div className={styles.matchItem}>
              <span className={styles.matchIndex}>3</span>
              <p>Some students have a background, identity, interest...</p>
              <b className={styles.matchPercent}>44% similar</b>
            </div>
          </div>

          <div className={styles.stickyNotePurple} ref={stickyPurpleRef}>
            See what makes <br /> successful essays <br /> stand out.
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section
        id="how-it-works"
        className={styles.howItWorks}
        ref={howItWorksRef}
      >
        <div className={styles.sectionLabel}>HOW IT WORKS</div>

        <div className={styles.stepsGrid}>
          <div className={styles.step} ref={(el) => (stepsRef.current[0] = el)}>
            <div className={styles.stepHead}>
              <span className={styles.stepNumber}>1</span>
              <h3>Upload your draft</h3>
            </div>

            <p>
              Paste your essay and let Essay Annotator understand your story.
            </p>

            <div className={styles.stepCard}>
              <strong>Your Draft</strong>
              <span>Personal Statement — Draft 1</span>
              <div className={styles.stepCardLines}>
                <i></i>
                <i></i>
                <i></i>
              </div>
              <div className={styles.stepIcon}>
                <Upload size={28} />
              </div>
            </div>
          </div>

          <div className={styles.stepArrow}>→</div>

          <div className={styles.step} ref={(el) => (stepsRef.current[1] = el)}>
            <div className={styles.stepHead}>
              <span className={styles.stepNumber}>2</span>
              <h3>Find similar accepted essays</h3>
            </div>

            <p>Essay Annotator finds real essays from students like you.</p>

            <div className={styles.stepCard}>
              <strong>Top Matches</strong>

              <div className={styles.matchRow}>
                <span>1</span>
                <div></div>
                <b>86% match</b>
              </div>

              <div className={styles.matchRow}>
                <span>2</span>
                <div></div>
                <b>82% match</b>
              </div>

              <div className={styles.matchRow}>
                <span>3</span>
                <div></div>
                <b>79% match</b>
              </div>
            </div>
          </div>

          <div className={styles.stepArrow}>→</div>

          <div className={styles.step} ref={(el) => (stepsRef.current[2] = el)}>
            <div className={styles.stepHead}>
              <span className={styles.stepNumber}>3</span>
              <h3>Learn what works</h3>
            </div>

            <p>
              See how successful essays answer the same questions — and why they
              stand out.
            </p>

            <div className={styles.stepCard}>
              <strong>Essay Insights</strong>
              <span>
                See structure, tone, and details that make accepted essays
                stronger.
              </span>

              <div className={styles.analysisLines}>
                <i></i>
                <i></i>
                <i></i>
                <i></i>
              </div>

              <div className={styles.scanIcon}>
                <ScanSearch size={28} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARE */}
      <section className={styles.compareSection} ref={compareSectionRef}>
        <div className={styles.compareIntro}>
          <h2 className={styles.sectionTitle}>
            See What Makes <br />
            Strong Essays Work
          </h2>

          <p>
            Compare your draft with real accepted essays and discover what makes
            stronger writing stand out.
          </p>
        </div>

        <div className={styles.analysisDemo}>
          <div className={styles.analysisPaper}>
            <div className={styles.analysisColumn}>
              <p className={styles.analysisLabel}>YOUR ESSAY</p>
              <h3>User Draft</h3>

              <div
                className={`${styles.analysisDivider} ${styles.leftDivider}`}
              ></div>
              <p className={styles.analysisText}>
                Ever since my first day volunteering at the community clinic,
              </p>

              <p className={styles.analysisText}>
                I knew I wanted to make a difference in people&apos;s lives.
              </p>

              <p className={styles.analysisText}>
                <span className={styles.hoverHighlight}>
                  The experience opened my eyes to how small acts of kindness
                  can have a big impact.
                </span>
              </p>

              <p className={styles.analysisTextMuted}>
                I hope to continue this journey in college and beyond.
              </p>

              <div className={styles.demoSoftLines}>
                <span></span>
                <span></span>
              </div>
            </div>

            <div className={styles.analysisMiddle}>
              <div className={styles.suggestionPopup}>
                <p>EXPRESSION</p>
                <strong>Stronger opening image</strong>
                <span>
                  The database essay is stronger because it turns a general idea
                  into a vivid, sensory image that pulls readers in.
                </span>
                <button type="button">See full analysis →</button>
              </div>
            </div>

            <div className={styles.analysisColumn}>
              <p className={styles.analysisLabel}>DATABASE ESSAY</p>
              <h3>essay_0167</h3>

              <div
                className={`${styles.analysisDivider} ${styles.rightDivider}`}
              ></div>

              <p className={styles.analysisText}>
                Stepping into the local hospital sophomore year summer, I
                embraced the role of student volunteer, eager to assist
                patients.{" "}
                <span className={styles.hoverHighlight}>
                  The sterile scent of alcohol greeted me and the vast,
                  maze-like hospital left me disoriented,
                </span>{" "}
                so I struggled to find the desired locations in the labyrinthine
                hallways.
              </p>

              <p className={styles.analysisTextMuted}>...</p>

              <div className={styles.demoSoftLines}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ESSAY LIBRARY - CAROUSEL STYLE */}
      <section className={styles.featuredScroll} ref={featuredRef}>
        <div className={styles.libraryContent}>
          <h2 className={styles.sectionTitleCenter}>
            EXPLORE REAL ACCEPTED ESSAYS
          </h2>

          <p className={styles.featuredSubtitle}>
            Explore real essays from top schools and click any card to read
            more.
          </p>

          <div className={styles.scrollWrapper}>
            <button
              type="button"
              className={`${styles.carouselBtn} ${styles.carouselBtnLeft}`}
              onClick={handlePrevEssay}
              aria-label="Previous essays"
            >
              ‹
            </button>

            <div className={styles.carouselViewport}>
              <div
                className={styles.scrollTrack}
                style={{
                  transform: `translateX(calc(${essayIndex} * -1 * (var(--essay-card-width) + var(--essay-card-gap))))`,
                }}
              >
                {loopedEssays.map((essay, index) => (
                  <Link
                    to={`/essay/${essay.id}`}
                    className={styles.scrollCard}
                    key={`${essay.id}-${index}`}
                  >
                    <div className={styles.pin}></div>

                    <div className={styles.cardHeader}>
                      <img
                        src={essay.logo}
                        alt={`${essay.school} logo`}
                        className={styles.schoolLogo}
                      />

                      <h4>{essay.school}</h4>
                    </div>

                    <p>{essay.title}</p>

                    <span>{essay.description}</span>

                    <div className={styles.scrollLink}>Read more →</div>
                  </Link>
                ))}
              </div>
            </div>

            <button
              type="button"
              className={`${styles.carouselBtn} ${styles.carouselBtnRight}`}
              onClick={handleNextEssay}
              aria-label="Next essays"
            >
              ›
            </button>
          </div>
        </div>
      </section>

      {/* WHY DIFFERENT */}
      <section className={styles.differenceSection} ref={differenceSectionRef}>
        <div className={styles.differenceTitle}>
          <h2 className={styles.sectionTitleSmall}>
            Why Essay Annotator <br />
            Is Different
          </h2>
        </div>

        <div className={styles.differenceCompareWrap}>
          <div className={styles.differenceCardBad}>
            <div className={styles.iconBadgeMuted}>
              <Sparkles size={26} />
            </div>

            <h3>Generic AI Advice</h3>

            <ul>
              <li>Vague, one-size-fits-all tips</li>
              <li>Not based on real admissions outcomes</li>
              <li>Doesn&apos;t show proven examples</li>
              <li>Hard to know what actually works</li>
            </ul>
          </div>

          <div className={styles.vsCircleSmall}>VS.</div>

          <div className={styles.differenceCardGood}>
            <div className={styles.iconBadgeGreen}>
              <FileCheck size={26} />
            </div>

            <h3>Learning From Real Accepted Essays</h3>

            <ul>
              <li>Based on essays that got students in</li>
              <li>See real responses to real prompts</li>
              <li>Discover what makes essays effective</li>
              <li>Learn and strengthen your unique voice</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection} ref={ctaSectionRef}>
        <div className={styles.bottomPaperDecorLeft}></div>

        <h2 className={styles.ctaTitle}>Ready to improve your essay?</h2>

>>>>>>> feature/Footer
        <p>
          Access a curated database of 200+ real essays accepted into Harvard,
          MIT, Stanford, and other top universities.
        </p>

<<<<<<< HEAD
        <Link to="/login" className={styles.startWritingLink}>
          <button className={styles.primaryBtn}>
            <span>Start Writing</span>
          </button>
        </Link>

        <div className={styles.heroBadges}>
          <div>
            <Search size={18} />
            <span>Find Matches</span>
          </div>
          <div>
            <FileCheck size={18} />
            <span>Real Student Submissions</span>
          </div>
          <div>
            <TrendingUp size={18} />
            <span>Compare & Improve</span>
          </div>
        </div>
      </section>

      <section className={styles.featuredScroll}>
        <h2>Featured Accepted Essays</h2>
        <p className={styles.featuredSubtitle}>
          Explore real essays from top schools and click any card to read more.
        </p>

        <div className={styles.scrollWrapper}>
          <div className={styles.scrollTrack}>
            {scrollingEssays.map((essay, index) => (
              <Link
                to={`/essay/${essay.id}`}
                className={styles.scrollCard}
                key={`${essay.id}-${index}`}
              >
                <div className={styles.cardHeader}>
                  <img
                    src={essay.logo}
                    alt={`${essay.school} logo`}
                    className={styles.schoolLogo}
                  />
                  <h4>{essay.school}</h4>
                </div>

                <p>{essay.title}</p>
                <span>{essay.description}</span>
                <div className={styles.scrollLink}>Read more →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.exampleSection}>
        <div className={`${styles.exampleBox} ${styles.exampleBoxPurple}`}>
          <div className={styles.boxTop}>
            <div className={`${styles.boxIconWrap} ${styles.boxIconPurple}`}>
              <FileText className={styles.boxTopIcon} />
            </div>
            <div>
              <h3>Your Essay</h3>
              <p className={styles.boxSubtitle}>Preview and enhance your essay</p>
            </div>
          </div>

          <div className={`${styles.placeholder} ${styles.large}`}>
            <div className={styles.mockEssay}>
              <div className={styles.mockEssayLineWide} />
              <div className={styles.mockEssayBody}>
                <div className={styles.mockEssayThumbPurple} />
                <div className={styles.mockEssayText}>
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLineShort} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${styles.exampleBox} ${styles.exampleBoxBlue}`}>
          <div className={styles.boxTop}>
            <div className={`${styles.boxIconWrap} ${styles.boxIconBlue}`}>
              <FileCheck className={styles.boxTopIcon} />
            </div>
            <div>
              <h3>Similar Accepted Essays</h3>
              <p className={styles.boxSubtitle}>
                Find and compare similar successful essays
              </p>
            </div>
          </div>

          <div className={`${styles.placeholder} ${styles.large}`}>
            <div className={styles.mockEssay}>
              <div className={styles.mockEssayBody}>
                <div className={styles.mockEssayThumbBlue} />
                <div className={styles.mockEssayText}>
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLineShort} />
                </div>
              </div>

              <div className={styles.mockCardDivider} />

              <div className={styles.mockEssayBody}>
                <div className={styles.mockEssayThumbBlue} />
                <div className={styles.mockEssayText}>
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLine} />
                  <div className={styles.mockEssayLineShort} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.comparison}>
        <h2>Boost Your Admissions Chances Today</h2>
        <p>Learn from real essays that actually got into top schools.</p>

        <div className={styles.compareBox}>
          <div className={styles.bad}>
            <h3>✗ Generic Advice</h3>
            <p>AI gives broad, non-specific feedback</p>
            <ul>
              <li>✗ Vague suggestions</li>
              <li>✗ No real examples</li>
              <li>✗ Hard to apply</li>
            </ul>
          </div>

          <div className={styles.good}>
            <h3>✓ Real Examples</h3>
            <p>See essays that actually got accepted</p>
            <ul>
              <li>✓ 10,000+ essays indexed</li>
              <li>✓ Real successful structures</li>
              <li>✓ Clear improvement path</li>
            </ul>
          </div>
        </div>
=======
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleStartWriting}
        >
          <span>Start Writing</span>
        </button>
>>>>>>> feature/Footer
      </section>
    </div>
  );
}

<<<<<<< HEAD
export default Home;
=======
export default Home;
>>>>>>> feature/Footer
