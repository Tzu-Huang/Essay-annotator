import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/EssayPage.css";

function EssayPage() {
  const { id } = useParams();
  const [essay, setEssay] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState(null);

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        const response = await fetch(
          http://44.201.62.0:8000/essays/${id}?include_content=true
        );
        const data = await response.json();
        setEssay(data);
      } catch (error) {
        console.error("ERROR:", error);
      }
    };
    fetchEssay();
  }, [id]);
  

  // ✅ 只新增這段（離開頁面清掉 draft）
  useEffect(() => {
    return () => {
      localStorage.removeItem("userDraft");
      localStorage.removeItem("userTopic");
    };
  }, []);

  const handleCompare = async () => {
    const userDraft = localStorage.getItem("userDraft");
    const userTopic = localStorage.getItem("userTopic");

    setComparing(true);
    try {
      const response = await fetch("http://44.201.62.0:8000/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference_id: id,
          user_content: userDraft,
          user_topic: userTopic,
        }),
      });
      const data = await response.json();
      setCompareResult(data.analysis);
    } catch (error) {
      console.error("ERROR:", error);
    } finally {
      setComparing(false);
    }
  };

  return (
    <div className="essay-page">
      {essay ? (
        <>
          <div className="essay-header">
            <button className="back-btn" onClick={() => window.close()}>
              ← Back to Results
            </button>
            <h1 className="title">{essay.topic}</h1>
            <div className="essay-meta">
              <span className="essay-type-badge">{essay.essay_type}</span>
              <span className="essay-words">{essay.word_count} words</span>
            </div>
          </div>

          <div className="essay-body">
            {essay.content.split("\n\n").map((para, i) => (
              <p key={i} className="paragraph">{para}</p>
            ))}
          </div>

          <div className="essay-footer">
            <button
              className={`compare-btn ${comparing ? "loading" : ""}`}
              onClick={handleCompare}
              disabled={comparing}
            >
              {comparing ? (
                <>
                  <span className="spinner" />
                  Comparing...
                </>
              ) : (
                "⚡ Compare with My Essay"
              )}
            </button>
          </div>

          {compareResult && (
            <div className="compare-result">
              <div className="compare-result-header">
                <span>🤖</span>
                <h4>AI Analysis</h4>
              </div>
              <p>{compareResult}</p>
            </div>
          )}
        </>
      ) : (
        <p className="loading">Loading...</p>
      )}
    </div>
  );
}

export default EssayPage;