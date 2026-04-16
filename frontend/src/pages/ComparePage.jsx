import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import "../styles/compare.css";

function ComparePage() {
  const { id } = useParams();
  const userDraft = localStorage.getItem("userDraft") || "";
  const [essay, setEssay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState("");

  useEffect(() => {
    const fetchEssay = async () => {
      try {
        setLoading(true)
        setError("")

        const response = await fetch(
          `http://44.201.62.0:8000/essays/${id}?include_content=true`
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch essay: ${response.status}`)
        }

        const data = await response.json();
        setEssay(data);
      } catch (error) {
        console.error("ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEssay();
  }, [id]);

  const runCompare = async () => {
    try{
      setCompareLoading(true);
      setCompareError("");
      setCompareResult(null);
    
      const response = await fetch(`http://44.201.62.0:8000/compare/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_input: userDraft,
        }),
      });

      const data = await response.json();
      if (!response.ok){
        throw new Error(data?.detail || "Compare failed");
      }

      setCompareResult(data);
    } catch (error) {
      console.error("COMPARE ERROR:", error);
      setCompareError(error.message || "Compare failed.");
    } finally {
      setCompareLoading(false);
    }
  }
  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Compare With This Essay</h1>
          <p>Current essay id: {id}</p>
        </div>
      </div>

      <div className="compare-action">
        <button onClick={runCompare} disabled={compareLoading}>
          {compareLoading ? "Comparing..." : "Run Compare"}
        </button>
      </div>

      {compareError && <p>{compareError}</p>}
      {compareResult && (
        <div className="compare-result">
          <h2>AI Compare Result</h2>
          <pre>{JSON.stringify(compareResult, null, 2)}</pre>
        </div>
      )}

      <div className="layout">
        <section className="doc-shell">
          <div className="doc-paper">
            <h2>User Draft</h2>
            <p>{userDraft || "No user draft found."}</p>
          </div>
        </section>

        <section className="doc-shell">
          <div className="doc-paper">
            <h2>Selected Essay Example</h2>
            {loading ? (
              <p>Loading...</p>
            ) : (
              <p>{essay?.content || "No essay found."}</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default ComparePage;