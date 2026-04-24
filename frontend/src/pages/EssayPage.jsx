import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/EssayPage.css";
import { Copy, Download, Share2 } from "lucide-react";

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
    return <p className="loading">{error}</p>;
  }

  return (
    <div className="essay-page">
      {essay ? (
        <>
          {/* NAV */}
          <div className="essay-nav">
            <div className="logo">Essay <span>AI</span></div>
            <div className="nav-links">
              <span>Home</span>
              <span>My Essays</span>
              <span>Examples</span>
              <span>About Us</span>
            </div>
          </div>

          {/* HERO */}
          <div className="essay-hero">
            <button className="back-btn" onClick={() => navigate(-1)}>
              ← Back to Results
            </button>

            <h1 title={essay.topic}>
              {essay.topic}
            </h1>

            <div className="meta-row">
              {essay.essay_type && (
                <span className="badge type">{essay.essay_type}</span>
              )}
              {essay.word_count && (
                <span className="badge words">{essay.word_count} words</span>
              )}
            </div>
          </div>

          {/* MAIN */}
          <div className="essay-layout">
            {/* LEFT SIDEBAR */}
            <div className="sidebar">
              <div className="card info-card">
                <h3>Essay Info</h3>

                <div className="info-row">
                  <div className="info-icon">▣</div>
                  <div>
                    <span>Word Count</span>
                    <b>{essay.word_count || essay.words || "-"}</b>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">Aa</div>
                  <div>
                    <span>Type</span>
                    <b>{essay.essay_type || essay.type || "-"}</b>
                  </div>
                </div>

                <div className="info-row">
                  <div className="info-icon">⌂</div>
                  <div>
                    <span>School</span>
                    <b>{essay.school || "-"}</b>
                  </div>
                </div>
              </div>

              <div className="card note-card">
                <h3>Reading Guide</h3>
                <p>This essay example is provided for learning structure, tone, and storytelling techniques.</p>
              </div>
            </div>

            {/* RIGHT CONTENT */}
            <div className="content-card">
              <div className="essay-text">
                {essay.content.split("\n\n").map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              <div className="action-bar">
                <button className="primary-btn" onClick={handleCompare}>
                  ⚡ Compare with My Essay
                </button>

                <div className="secondary-btns">
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
          <div className="feature-strip">
            <div className="feature-item">
              🛡
              <div>
                <b>AI-Powered</b>
                <p>Smart comparison support</p>
              </div>
            </div>

            <div className="feature-item">
              ✦
              <div>
                <b>High Quality</b>
                <p>Curated essay examples</p>
              </div>
            </div>

            <div className="feature-item">
              📖
              <div>
                <b>Learning Focused</b>
                <p>Improve through examples</p>
              </div>
            </div>

            <div className="feature-item">
              🔒
              <div>
                <b>Your Privacy</b>
                <p>Your essay stays secure</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="loading">Loading...</p>
      )}
    </div>
  );
}

export default EssayPage;