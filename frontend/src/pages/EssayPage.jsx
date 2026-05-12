import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import styles from "../styles/EssayPage.module.css";

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop",
];

function EssayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [error, setError] = useState("");
  const [relatedEssays, setRelatedEssays] = useState([]);

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setError("");
        setEssay(null);
        setRelatedEssays([]);

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
        );

        if (!response.ok) {
          throw new Error(`Fail to fetch essay: ${response.status}`);
        }

        const data = await response.json();
        setEssay(data);

        // Find related essays
        const searchResponse = await fetch(`http://44.201.62.0:8000/search`, {
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
            .filter((item) => item.id !== id && item.essay_id !== id)
            .slice(0, 3);

          setRelatedEssays(filtered);
        }
        // find related essays === 

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
    <main className={styles.essayPage}>
      {essay ? (
        <>
          <section className={styles.hero}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              ← Back to Results
            </button>

            <h1 className={styles.title}>
              {essay.generated_title || essay.title || "Untitled Essay"}
            </h1>

            <p className={styles.prompt}>
              {essay.topic}
            </p>

            <div className={styles.meta}>
              <span>•</span>
              <span>{essay.type || "Example Essay"} </span>

              <span>•</span>
              <span>{essay.school || "School not listed"}</span>

              <span>{essay.word_count || essay.words || "-"} words</span>
            </div>
          </section>

          <article className={styles.article}>
            {essay.content.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </article>

          <div className={styles.actionArea}>
            <button className={styles.compareBtn} onClick={handleCompare}>
              ⚡ Compare with My Essay
            </button>
          </div>

          {relatedEssays.length > 0 && (
            <section className={styles.relatedSection}>
              <h2>Posts you may also be interested in</h2>

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
                    src={PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]}
                    alt=""
                  />

                    <div className={styles.relatedBody}>
                      <span>{item.type || item.essay_type || "Example Essay"}</span>

                      <h3>
                        {item.generated_title || "Untitled Essay"}
                      </h3>

                      <p>
                        {item.school || "School not listed"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      ) : (
        <p className={styles.loading}>Loading...</p>
      )}
    </main>
  );
}

export default EssayPage;