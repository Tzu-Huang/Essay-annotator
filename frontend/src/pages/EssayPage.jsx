import { useParams, useNavigate } from "react-router-dom";
<<<<<<< HEAD
import { useEffect, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";
import styles from "../styles/EssayPage.module.css";

=======
import { useEffect, useState, useRef } from "react";
import styles from "../styles/EssayPage.module.css";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
];

>>>>>>> feature/Footer
function EssayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [error, setError] = useState("");
<<<<<<< HEAD

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setError("");

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
=======
  const [relatedEssays, setRelatedEssays] = useState([]);
  const cardRef = useRef(null);

  useEffect(() => {
    let currentY = 0;
    let targetY = 0;
    let animationFrame;

    const handleScroll = () => {
      targetY = window.scrollY * 0.1;
    };

    const animate = () => {
      currentY += (targetY - currentY) * 0.15;

      if (cardRef.current) {
        cardRef.current.style.transform = `translateY(${currentY}px)`;
      }

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("scroll", handleScroll);
    animate();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(animationFrame);
    };
  }, []);
  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setError("");
        setEssay(null);
        setRelatedEssays([]);

        // generate_title=true triggers OpenAI title generation for the main essay <h1>
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/essays/${id}?include_content=true`,
>>>>>>> feature/Footer
        );

        if (!response.ok) {
          throw new Error(`Fail to fetch essay: ${response.status}`);
        }

        const data = await response.json();
        setEssay(data);
<<<<<<< HEAD
=======

        // Find related essays
        const searchResponse = await fetch(`${import.meta.env.VITE_API_URL}/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topK: 4,
            essay_types: ["all"],
            topic: data.topic || "",
            content: data.content || "",
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const results = searchData.results || searchData || [];

          const filtered = results
            .filter((item) => item.parent_id !== id)
            .slice(0, 3);

          setRelatedEssays(filtered);
        }
        // find related essays ===
>>>>>>> feature/Footer
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
<<<<<<< HEAD
=======
  const heroImage =
    essay?.hero_image ||
    "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1600&auto=format&fit=crop";
>>>>>>> feature/Footer

  if (error) {
    return <p className={styles.loading}>{error}</p>;
  }

  return (
<<<<<<< HEAD
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
=======
    <main className={styles.essayPage}>
      {essay ? (
        <>
          <section
            className={styles.hero}
            style={{
              backgroundImage: `linear-gradient(
                90deg,
                rgba(248, 248, 253, 0.86) 0%,
                rgba(248, 248, 253, 0.82) 42%,
                rgba(248, 248, 253, 0.25) 100%
              ), url(${heroImage})`,
            }}
          >
>>>>>>> feature/Footer
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back to Results
            </button>

<<<<<<< HEAD
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
=======
            <h1 className={styles.title}>
              {essay.generated_title || essay.title || "Untitled Essay"}
            </h1>

            <p className={styles.prompt}>{essay.topic}</p>

            <div className={styles.meta}>
              <span>•</span>
              <span>{essay.type || "Example Essay"} </span>

              {essay.school && essay.school.toLowerCase() !== "none" && (
                <>
                  <span>•</span>
                  <span>{essay.school}</span>
                </>
              )}

              <span>•</span>
              <span>{essay.word_count || essay.words || "-"} words</span>
            </div>
          </section>

          <div className={styles.contentLayout}>
            <article className={styles.article}>
              {essay.content.split("\n\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </article>

            <aside className={styles.sideColumn}>
              <section className={styles.ctaCard} ref={cardRef}>
                <h2>Ready to write your own essay?</h2>

                <p>Compare your essay with real successful examples.</p>

                <button className={styles.ctaBtn} onClick={handleCompare}>
                  Compare with My Essay
                </button>
              </section>
            </aside>
          </div>

          {relatedEssays.length > 0 && (
            <section className={styles.relatedSection}>
              <h2>You may also enjoy these essays related to this topic</h2>

              <div className={styles.relatedList}>
                {relatedEssays.map((item, index) => (
                  <button
                    key={item.id || item.essay_id || index}
                    className={styles.relatedCard}
                    onClick={() => {
                      const nextId = item.parent_id;

                      navigate(`/essay/${nextId}`);

                      window.scrollTo({
                        top: 0,
                        behavior: "smooth",
                      });
                    }}
                  >
                    <img
                      className={styles.relatedImage}
                      src={
                        PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]
                      }
                      alt=""
                    />

                    <div className={styles.relatedBody}>
                      <span>
                        {item.type || item.essay_type || "Example Essay"}
                      </span>

                      <h3>{item.generated_title || "Untitled Essay"}</h3>

                      {item.school == "none" && <p>Common App</p>}

                      {item.school != "none" && <p>{item.school}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
>>>>>>> feature/Footer
        </>
      ) : (
        <p className={styles.loading}>Loading...</p>
      )}
<<<<<<< HEAD
    </div>
=======
    </main>
>>>>>>> feature/Footer
  );
}

export default EssayPage;