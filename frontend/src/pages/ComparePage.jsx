import { useParams } from "react-router-dom";
import "../styles/compare.css";

function ComparePage() {
  const { id } = useParams();

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Compare With This Essay</h1>
          <p>Current essay id: {id}</p>
        </div>
      </div>

      <div className="layout">
        <section className="doc-shell">
          <div className="doc-paper">
            <h2>User Draft</h2>
          </div>
        </section>

        <section className="doc-shell">
          <div className="doc-paper">
            <h2>Selected Essay Example</h2>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ComparePage;