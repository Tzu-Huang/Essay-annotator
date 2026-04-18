import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/EssayPage.css";

function ExampleEssayPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [essay, setEssay] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setError("");
        setEssay(null);

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
        );

        if (!response.ok) {
          throw new Error(`Fail to fetch essay: ${response.status}`);
        }

        const data = await response.json();
        setEssay(data);
      } catch (error) {
        console.error("ERROR:", error);
        setError(error.message || "Something went wrong");
      }
    };

    fetchEssay();
  }, [id]);

  if (error) {
    return <p className="loading">{error}</p>;
  }

  return (
    <div className="essay-page">
      {essay ? (
        <>
          <div className="essay-header">
            <button className="back-btn" onClick={() => navigate("/")}>
              ← Back to Home
            </button>

            <h1 className="title">{essay.topic}</h1>

            <div className="essay-meta">
              <span className="essay-type-badge">{essay.essay_type}</span>
              <span className="essay-words">{essay.word_count} words</span>
            </div>
          </div>

          <div className="essay-body">
            {essay.content?.split("\n\n").map((para, i) => (
              <p key={i} className="paragraph">
                {para}
              </p>
            ))}
          </div>

          <div className="essay-footer">
            <button className="compare-btn" onClick={() => navigate("/login")}>
              Start Writing
            </button>
          </div>
        </>
      ) : (
        <p className="loading">Loading...</p>
      )}
    </div>
  );
}

export default ExampleEssayPage;