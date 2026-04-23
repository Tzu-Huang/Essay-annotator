import { Link } from "react-router-dom";
import {
  FileText,
  FileCheck,
  Upload,
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
        <h1>
          Get Into Top Colleges <br />
          By Learning From <span>200+ Real Accepted Essays</span>
        </h1>

        <p>
          Access a curated database of 200+ real essays accepted into Harvard,
          MIT, Stanford, and other top universities.
        </p>

        <Link to="/login">
          <button className={styles.primaryBtn}>Start Writing</button>
        </Link>

        <div className={styles.heroBadges}>
          <div>✓ 200+ accepted essays</div>
          <div>✓ Harvard, MIT, Stanford</div>
          <div>✓ Real student submissions</div>
          <div>✓ Compare & improve</div>
        </div>
      </section>

      <section className={styles.exampleSection}>
        <div className={styles.exampleBox}>
          <h3>Your Essay</h3>
          <p className={styles.boxSubtitle}>Essay Preview</p>

          <div className={`${styles.placeholder} ${styles.large}`}>
            <FileText className={styles.placeholderSvg} />
          </div>
        </div>

        <div className={styles.arrow}>→</div>

        <div className={styles.exampleBox}>
          <h3>Similar Accepted Essays</h3>
          <p className={styles.boxSubtitle}>Matched Essays</p>

          <div className={`${styles.placeholder} ${styles.large}`}>
            <FileCheck className={styles.placeholderSvg} />
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <h2>See How It Works</h2>

        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Upload className={styles.stepSvg} />
            </div>
            <h3>1. Upload Essay</h3>
            <p>Paste your draft or upload a file</p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <Search className={styles.stepSvg} />
            </div>
            <h3>2. Find Matches</h3>
            <p>We find essays accepted by top schools</p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepIcon}>
              <TrendingUp className={styles.stepSvg} />
            </div>
            <h3>3. Improve</h3>
            <p>Compare structure, tone, storytelling</p>
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
                to={`/example/${essay.id}`}
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
      </section>
    </div>
  );
}

export default Home;