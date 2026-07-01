import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileCheck, Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import styles from "../styles/home.module.css";
import { useAuth } from "../hooks/useAuth";
import HeroMockup from "../components/HeroMockup";

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
  const heroImageRef = useRef(null);
  const howWrapperRef = useRef(null);
  const howItWorksRef = useRef(null);
  const howLeftRef = useRef(null);
  const howRightRef = useRef(null);
  const stepFlashRef = useRef(null);
  const stepEyebrowRef = useRef(null);
  const eyebrowDotRef = useRef(null);
  const stepNumRef = useRef(null);
  const stepTitleRef = useRef(null);
  const stepAccentLineRef = useRef(null);
  const stepDescRef = useRef(null);
  const stepBadgeRef = useRef(null);
  const cardGlowRef = useRef(null);
  const stepDotRefs = useRef([]);
  const stackedCardRefs = useRef([]);
  const terminalLineRef = useRef(null);
  const terminalDoneRef = useRef(null);
  const scanBarsRef = useRef([]);
  const scanFillRef = useRef(null);
  const scanNumRef = useRef(null);
  const hudToneRef = useRef(null);
  const hudHookRef = useRef(null);
  const hudMetricOneRef = useRef(null);
  const hudMetricTwoRef = useRef(null);
  const hudMetricThreeRef = useRef(null);
  const compareSectionRef = useRef(null);
  const compareIntroRef = useRef(null);
  const analysisDemoRef = useRef(null);
  const featuredRef = useRef(null);
  const differenceSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);


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

      // Hero image — fades up on load
      gsap.from(heroImageRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.85,
        ease: "power3.out",
        delay: 0.3,
      });

      // Compare section — staggered two-column entrance
      const compareTl = gsap.timeline({
        scrollTrigger: {
          trigger: compareSectionRef.current,
          start: "top 80%",
          toggleActions: "play reverse play reverse",
        },
      });
      compareTl
        .from(compareIntroRef.current, {
          opacity: 0,
          x: -32,
          duration: 0.78,
          ease: "power2.out",
        })
        .from(
          analysisDemoRef.current,
          {
            opacity: 0,
            y: 48,
            scale: 0.96,
            duration: 0.85,
            ease: "power2.out",
            transformOrigin: "center top",
          },
          0.14
        );

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

  useEffect(() => {
    const STEPS = [
      {
        title: "Paste your draft",
        desc: "Essay Annotator maps your voice, structure, and story from the first line. Paste any draft — rough or polished.",
        badge: "Any draft, any stage",
        color: "#4a6bc8",
        badgeBg: "#dde4f8",
        glowColor: "rgba(74,107,200,0.14)",
        bgClass: styles.howStepBg0,
        bgNum: "01",
      },
      {
        title: "Find similar accepted essays",
        desc: "We surface accepted essays that mirror your topic, tone, and structure — not just keywords.",
        badge: "200+ real essays indexed",
        color: "#2d8a6e",
        badgeBg: "#ddf2ea",
        glowColor: "rgba(45,138,110,0.14)",
        bgClass: styles.howStepBg1,
        bgNum: "02",
      },
      {
        title: "Learn what works",
        desc: "See the exact patterns that make accepted essays land, highlighted directly on your own writing.",
        badge: "Tone, hooks, voice — all mapped",
        color: "#675ce6",
        badgeBg: "#dddcee",
        glowColor: "rgba(122,75,200,0.14)",
        bgClass: styles.howStepBg2,
        bgNum: "03",
      },
    ];

    const POSITIONS = {
      "-2": { x: -44, y: -84, rot: -13, scale: 0.74, blur: 12, opacity: 0.16, z: 1 },
      "-1": { x: -20, y: -42, rot: -6, scale: 0.88, blur: 5, opacity: 0.4, z: 2 },
      "0": { x: 0, y: 0, rot: 0, scale: 1, blur: 0, opacity: 1, z: 5 },
      "1": { x: -20, y: 42, rot: 6, scale: 0.88, blur: 5, opacity: 0.4, z: 2 },
      "2": { x: -44, y: 84, rot: 13, scale: 0.74, blur: 12, opacity: 0.16, z: 1 },
    };

    let currentStep = -1;
    let currentTitleLine = null;
    let termTimer = null;
    let scanTimer = null;
    let hudPulse = null;
    let hudCount = null;

    const buildTitleLine = (text) => {
      const line = document.createElement("div");
      line.className = styles.titleLine;
      text.split(" ").forEach((word, i, arr) => {
        const span = document.createElement("span");
        span.className = styles.titleWord;
        span.textContent = word;
        line.appendChild(span);
        if (i < arr.length - 1) line.appendChild(document.createTextNode(" "));
      });
      return line;
    };

    const setTitleInstant = (text) => {
      const el = stepTitleRef.current;
      if (!el) return;
      el.innerHTML = "";
      const line = buildTitleLine(text);
      el.appendChild(line);
      gsap.set(line, { opacity: 1 });
      currentTitleLine = line;
    };

    const animateTitle = (newText) => {
      const el = stepTitleRef.current;
      if (!el) return;
      el.querySelectorAll(`.${styles.titleLine}`).forEach((l) => {
        gsap.killTweensOf(l);
        if (l !== currentTitleLine) l.remove();
      });
      if (currentTitleLine) gsap.set(currentTitleLine, { opacity: 1 });
      const oldLine = currentTitleLine;
      const newLine = buildTitleLine(newText);
      el.appendChild(newLine);
      gsap.set(newLine, { opacity: 0 });
      const tl = gsap.timeline({
        onComplete: () => {
          if (oldLine && oldLine.parentNode) oldLine.remove();
          currentTitleLine = newLine;
        },
      });
      if (oldLine) tl.to(oldLine, { opacity: 0, duration: 0.22, ease: "power1.in" }, 0);
      tl.to(newLine, { opacity: 1, duration: 0.36, ease: "power2.out" }, 0.16);
    };

    const updateCards = (step, animate) => {
      stackedCardRefs.current.forEach((card, i) => {
        if (!card) return;
        const offset = Math.max(-2, Math.min(2, i - step));
        const p = POSITIONS[String(offset)];
        card.style.zIndex = p.z;
        if (animate) {
          gsap.to(card, {
            x: p.x, y: p.y, rotation: p.rot, scale: p.scale,
            opacity: p.opacity, filter: `blur(${p.blur}px)`,
            duration: 0.55, ease: "power3.out",
          });
        } else {
          gsap.set(card, {
            x: p.x, y: p.y, rotation: p.rot, scale: p.scale,
            opacity: p.opacity, filter: `blur(${p.blur}px)`,
          });
        }
      });
    };

    const runTerminal = () => {
      if (termTimer) clearInterval(termTimer);
      const msgs = ["Reading essay...", "Parsing structure...", "Mapping voice..."];
      let mi = 0;
      const line = terminalLineRef.current;
      const done = terminalDoneRef.current;
      if (!line || !done) return;
      done.classList.remove(styles.stackTermDoneShow);
      line.innerHTML = `${msgs[0]}<span class="${styles.stackTermCursor}"></span>`;
      termTimer = setInterval(() => {
        mi++;
        if (mi >= msgs.length) {
          clearInterval(termTimer);
          line.innerHTML = `${msgs[msgs.length - 1]}<span class="${styles.stackTermCursor}"></span>`;
          setTimeout(() => done.classList.add(styles.stackTermDoneShow), 400);
          return;
        }
        line.innerHTML = `${msgs[mi]}<span class="${styles.stackTermCursor}"></span>`;
      }, 900);
    };

    const runScanner = () => {
      if (scanTimer) clearInterval(scanTimer);
      const bars = scanBarsRef.current.filter(Boolean);
      if (scanFillRef.current) scanFillRef.current.style.width = "0%";
      if (scanNumRef.current) scanNumRef.current.textContent = "0%";
      bars.forEach((b) => { b.style.transition = "none"; b.style.width = "0%"; });
      let prog = 0;
      setTimeout(() => {
        bars.forEach((b) => {
          b.style.transition = "width 1.4s cubic-bezier(0.22,1,0.36,1)";
          b.style.width = `${b.dataset.w || 0}%`;
        });
      }, 200);
      scanTimer = setInterval(() => {
        prog = Math.min(100, prog + 2);
        if (scanFillRef.current) scanFillRef.current.style.width = `${prog}%`;
        if (scanNumRef.current) scanNumRef.current.textContent = `${prog}%`;
        if (prog >= 100) clearInterval(scanTimer);
      }, 44);
    };

    const runHUD = () => {
      if (hudPulse) clearInterval(hudPulse);
      if (hudCount) clearInterval(hudCount);
      const tone = hudToneRef.current;
      const hook = hudHookRef.current;
      const m1 = hudMetricOneRef.current;
      const m2 = hudMetricTwoRef.current;
      const m3 = hudMetricThreeRef.current;
      if (!tone) return;
      if (m1) m1.textContent = "0";
      if (m2) m2.textContent = "0";
      if (m3) m3.textContent = "0%";
      tone.classList.remove(styles.stackHudHlOn);
      if (hook) hook.classList.remove(styles.stackHudHlAltOn);

      const pulse = () => {
        tone.classList.add(styles.stackHudHlOn);
        hook?.classList.remove(styles.stackHudHlAltOn);
        setTimeout(() => {
          hook?.classList.add(styles.stackHudHlAltOn);
          tone.classList.remove(styles.stackHudHlOn);
        }, 1400);
      };
      pulse();
      hudPulse = setInterval(pulse, 2800);

      let v1 = 0, v2 = 0, v3 = 0;
      hudCount = setInterval(() => {
        if (v1 < 4) { v1++; if (m1) m1.textContent = String(v1); }
        if (v2 < 3) { v2++; if (m2) m2.textContent = String(v2); }
        if (v3 < 87) { v3++; if (m3) m3.textContent = `${v3}%`; }
        if (v1 >= 4 && v2 >= 3 && v3 >= 87) clearInterval(hudCount);
      }, 28);
    };

    const goToStep = (step, instant) => {
      if (step === currentStep) return;
      const s = STEPS[step];

      stackedCardRefs.current.forEach((card) => { if (card) gsap.killTweensOf(card); });

      if (howItWorksRef.current) {
        howItWorksRef.current.className = `${styles.howSection} ${s.bgClass}`;
      }

      if (stepEyebrowRef.current) stepEyebrowRef.current.style.color = s.color;
      if (eyebrowDotRef.current) eyebrowDotRef.current.style.background = s.color;

      stepDotRefs.current.forEach((dot, i) => {
        if (!dot) return;
        dot.style.background = i <= step ? s.color : "rgba(0,0,0,0.12)";
        dot.style.width = i === step ? "44px" : "28px";
      });

      if (instant) { setTitleInstant(s.title); } else { animateTitle(s.title); }

      if (stepNumRef.current) {
        stepNumRef.current.textContent = s.bgNum;
        stepNumRef.current.style.color = s.color;
        if (!instant) {
          gsap.fromTo(stepNumRef.current, { scale: 1.5, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(2)" });
        }
      }

      if (stepFlashRef.current && !instant) {
        stepFlashRef.current.style.background = s.color;
        gsap.fromTo(stepFlashRef.current, { opacity: 0.08 }, { opacity: 0, duration: 1.0, ease: "power2.out" });
      }

      if (stepAccentLineRef.current) {
        stepAccentLineRef.current.style.background = s.color;
        if (instant) gsap.set(stepAccentLineRef.current, { width: 48 });
        else gsap.fromTo(stepAccentLineRef.current, { width: 0 }, { width: 48, duration: 0.4, ease: "power2.out", delay: 0.28 });
      }

      if (!instant) {
        const activeDot = stepDotRefs.current[step];
        if (activeDot) gsap.fromTo(activeDot, { scaleX: 0.3 }, { scaleX: 1, duration: 0.55, ease: "elastic.out(1.4, 0.5)" });
      }

      const desc = stepDescRef.current;
      const badge = stepBadgeRef.current;
      if (desc && badge) {
        gsap.killTweensOf([desc, badge]);
        gsap.set(desc, { opacity: 0 });
        gsap.set(badge, { opacity: 0 });
        setTimeout(() => {
          desc.textContent = s.desc;
          badge.textContent = s.badge;
          badge.style.background = s.badgeBg;
          badge.style.color = s.color;
          gsap.fromTo(desc, { opacity: 0, x: instant ? 0 : 22 }, { opacity: 1, x: 0, duration: 0.5, ease: "power2.out" });
          gsap.fromTo(badge, { opacity: 0, scale: 0.93, y: 4 }, { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: "power2.out", delay: instant ? 0 : 0.12 });
        }, instant ? 0 : 180);
      }

      if (cardGlowRef.current) {
        cardGlowRef.current.style.background = `radial-gradient(ellipse at center, ${s.glowColor} 0%, transparent 70%)`;
      }

      updateCards(step, !instant);

      if (step === 0) runTerminal();
      if (step === 1) runScanner();
      if (step === 2) runHUD();

      currentStep = step;
    };

    const enterSection = () => {
      if (howLeftRef.current) gsap.to(howLeftRef.current, { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" });
      if (howRightRef.current) gsap.to(howRightRef.current, { opacity: 1, y: 0, scale: 1, duration: 0.72, ease: "back.out(1.2)", delay: 0.1 });
    };

    // Initialize positions and state
    updateCards(0, false);

    const s0 = STEPS[0];
    if (stepEyebrowRef.current) stepEyebrowRef.current.style.color = s0.color;
    if (eyebrowDotRef.current) eyebrowDotRef.current.style.background = s0.color;
    if (stepDotRefs.current[0]) stepDotRefs.current[0].style.background = s0.color;
    if (stepNumRef.current) { stepNumRef.current.textContent = s0.bgNum; stepNumRef.current.style.color = s0.color; }
    if (stepAccentLineRef.current) { stepAccentLineRef.current.style.background = s0.color; gsap.set(stepAccentLineRef.current, { width: 48 }); }
    if (stepBadgeRef.current) {
      stepBadgeRef.current.style.background = s0.badgeBg;
      stepBadgeRef.current.style.color = s0.color;
      stepBadgeRef.current.textContent = s0.badge;
      gsap.set(stepBadgeRef.current, { opacity: 1, scale: 1, y: 0 });
    }
    if (stepDescRef.current) { stepDescRef.current.textContent = s0.desc; gsap.set(stepDescRef.current, { opacity: 1, x: 0 }); }
    if (cardGlowRef.current) { cardGlowRef.current.style.background = `radial-gradient(ellipse at center, ${s0.glowColor} 0%, transparent 70%)`; }
    if (howItWorksRef.current) howItWorksRef.current.className = `${styles.howSection} ${s0.bgClass}`;
    setTitleInstant(s0.title);

    if (howLeftRef.current) gsap.set(howLeftRef.current, { opacity: 0, y: 28 });
    if (howRightRef.current) gsap.set(howRightRef.current, { opacity: 0, y: 28, scale: 0.93 });

    // Scroll listener — matches mockup HTML exactly
    let lastStep = -99;
    let hasEntered = false;

    const onScroll = () => {
      if (!howWrapperRef.current) return;
      const wrapper = howWrapperRef.current;
      const rect = wrapper.getBoundingClientRect();
      const totalScroll = wrapper.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;
      const inSection = scrolled >= 0 && scrolled <= totalScroll;

      if (!inSection) {
        if (scrolled < 0) lastStep = -99;
        return;
      }

      const step = Math.min(2, Math.floor((scrolled / totalScroll) * 3));
      if (step !== lastStep) {
        const isFirst = lastStep === -99;
        goToStep(step, isFirst);
        if (isFirst && !hasEntered) {
          enterSection();
          hasEntered = true;
        }
        lastStep = step;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (termTimer) clearInterval(termTimer);
      if (scanTimer) clearInterval(scanTimer);
      if (hudPulse) clearInterval(hudPulse);
      if (hudCount) clearInterval(hudCount);
    };
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
            makes them work.Start 
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

        <HeroMockup ref={heroImageRef} onOpenSignIn={onOpenSignIn} />
      </section>

      {/* HOW IT WORKS - Animated Scroll */}
      <div className={styles.howWrapper} id="how-it-works" ref={howWrapperRef}>
        <section className={styles.howSection} ref={howItWorksRef}>
          <div className={styles.stepFlash} ref={stepFlashRef} />
          <div className={styles.howInner}>
            {/* LEFT PANEL */}
            <div className={styles.howLeft} ref={howLeftRef}>
              <div className={styles.stepDots}>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={styles.stepDot}
                    ref={(el) => { stepDotRefs.current[i] = el; }}
                  />
                ))}
              </div>
              <div className={styles.stepEyebrow} ref={stepEyebrowRef}>
                <span className={styles.eyebrowDotAnim} ref={eyebrowDotRef} />
                How it works
              </div>
              <div className={styles.stepTitleWrapper}>
                <span className={styles.stepNum} ref={stepNumRef}>01</span>
                <h2 className={styles.stepTitle} ref={stepTitleRef} />
              </div>
              <div className={styles.stepAccentLine} ref={stepAccentLineRef} />
              <p className={styles.stepDesc} ref={stepDescRef} />
              <div className={styles.stepBadge} ref={stepBadgeRef} />
            </div>

            {/* RIGHT PANEL */}
            <div className={styles.howRight} ref={howRightRef}>
              <div className={styles.cardsStage}>
                <div className={styles.cardGlowAnim} ref={cardGlowRef} />

                {/* Card 0: Terminal */}
                <div
                  className={`${styles.howCard} ${styles.stackTerminal}`}
                  ref={(el) => { stackedCardRefs.current[0] = el; }}
                >
                  <div className={styles.stackTerminalBar}>
                    <div className={`${styles.stackTdot} ${styles.stackTdotR}`} />
                    <div className={`${styles.stackTdot} ${styles.stackTdotY}`} />
                    <div className={`${styles.stackTdot} ${styles.stackTdotG}`} />
                    <span className={styles.stackTermLabel}>essay_draft.txt</span>
                  </div>
                  <div className={styles.stackTermLine}>
                    <span style={{ color: "#8aabde" }}>$</span> annotate --input draft.txt
                  </div>
                  <div
                    className={`${styles.stackTermLine} ${styles.stackTermHighlight}`}
                    ref={terminalLineRef}
                  >
                    Reading essay...<span className={styles.stackTermCursor} />
                  </div>
                  <div className={styles.stackTermDone} ref={terminalDoneRef}>
                    ✓ 482 words parsed
                  </div>
                </div>

                {/* Card 1: Scanner */}
                <div
                  className={`${styles.howCard} ${styles.stackScanner}`}
                  ref={(el) => { stackedCardRefs.current[1] = el; }}
                >
                  <div className={styles.stackScHead}>
                    <span className={styles.stackScTitle}>Match Engine</span>
                    <span className={styles.stackScLive}>
                      <span className={styles.stackLiveDot} /> Live
                    </span>
                  </div>
                  <div className={styles.stackScBody}>
                    {[{ w: 84 }, { w: 79 }, { w: 76 }].map((bar, i) => (
                      <div key={i} className={styles.stackScItem}>
                        <div className={`${styles.stackScRank} ${styles[`stackRank${i + 1}`]}`}>
                          {i + 1}
                        </div>
                        <div className={styles.stackScBarWrap}>
                          <div
                            className={styles.stackScBar}
                            data-w={bar.w}
                            ref={(el) => { scanBarsRef.current[i] = el; }}
                          />
                        </div>
                        <div className={styles.stackScPct}>{bar.w}%</div>
                      </div>
                    ))}
                    <div className={styles.stackScProg}>
                      <span className={styles.stackScProgLabel}>Scanning 200+ essays</span>
                      <div className={styles.stackScProgTrack}>
                        <div className={styles.stackScProgFill} ref={scanFillRef} />
                      </div>
                      <span className={styles.stackScProgNum} ref={scanNumRef}>0%</span>
                    </div>
                  </div>
                </div>

                {/* Card 2: HUD */}
                <div
                  className={`${styles.howCard} ${styles.stackHud}`}
                  ref={(el) => { stackedCardRefs.current[2] = el; }}
                >
                  <div className={styles.stackHudHead}>
                    <span className={styles.stackHudTitle}>Insight HUD</span>
                    <span className={styles.stackHudBadge}>3 patterns found</span>
                  </div>
                  <div className={styles.stackHudBody}>
                    <p className={styles.stackHudText}>
                      <span className={styles.stackHudHl} ref={hudToneRef}>
                        Born in New York,
                      </span>{" "}
                      I have lived abroad most of my life.{" "}
                      <span className={styles.stackHudHlAlt} ref={hudHookRef}>
                        Shanghai for 8 years
                      </span>{" "}
                      and Taiwan making up the rest...
                    </p>
                    <div className={styles.stackHudMetrics}>
                      <div className={styles.stackMetric}>
                        <div className={styles.stackMVal} ref={hudMetricOneRef}>0</div>
                        <div className={styles.stackMLabel}>Tone shifts</div>
                      </div>
                      <div className={styles.stackMetric}>
                        <div className={styles.stackMVal} ref={hudMetricTwoRef}>0</div>
                        <div className={styles.stackMLabel}>Strong hooks</div>
                      </div>
                      <div className={styles.stackMetric}>
                        <div className={styles.stackMVal} ref={hudMetricThreeRef}>0%</div>
                        <div className={styles.stackMLabel}>Voice match</div>
                      </div>
                    </div>
                    <div className={styles.stackHudTags}>
                      <span className={styles.htagYellow}>Tone shift</span>
                      <span className={styles.htagBlue}>Strong hook</span>
                      <span className={styles.htagGreen}>Voice marker</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* COMPARE */}
      <section className={styles.compareSection} ref={compareSectionRef}>
        <div className={styles.compareIntro} ref={compareIntroRef}>
          <h2 className={styles.sectionTitle}>
            See What Makes <br />
            Strong Essays Work
          </h2>

          <p>
            Compare your draft with real accepted essays and discover what makes
            stronger writing stand out.
          </p>
        </div>

        <div className={styles.analysisDemo} ref={analysisDemoRef}>
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

              <p className={styles.analysisText}>
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
                  The sample essay is stronger as it turns a general idea
                  into a vivid, sensory image that pulls readers in.
                </span>
                <Link to="/editor" onClick={() => window.scrollTo(0, 0)}>See full analysis</Link>
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

        <p>
          Access a curated database of 200+ real essays accepted into Harvard,
          MIT, Stanford, and other top universities.
        </p>

        <button
          type="button"
          className={styles.primaryBtn}
          onClick={handleStartWriting}
        >
          <span>Start Writing</span>
        </button>
      </section>
    </div>
  );
}

export default Home;
