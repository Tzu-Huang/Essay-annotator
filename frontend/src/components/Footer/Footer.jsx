import { Link } from "react-router-dom";

import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand Section */}
        <div className="footer-section footer-brand">
          <h2>Essay Annotator</h2>

          <p>
            EssayAnnotator helps students explore successful college essays,
            understand strong writing patterns, and improve their own essays
            through AI-powered comparison.
          </p>

        </div>

        {/* Navigation */}
        <div className="footer-section">
          <h3>Pages</h3>

          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>

            <li>
              <Link to="/how-it-works">How It Works</Link>
            </li>

            <li>
              <Link to="/faqs">FAQs</Link>
            </li>

            <li>
              <Link to="/editor">Editor</Link>
            </li>
          </ul>
        </div>

        {/* Project Info */}
        <div className="footer-section">
          <h3>Project</h3>

          <ul>
            <li>Built with React + FastAPI + OpenAI</li>

            <li>Semantic Essay Retrieval System</li>

            <li>
              Contributors:
              <br />
              Zackery Liu, Amanda Tsai, Olivia Chu
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="footer-bottom">
        © 2026 EssayAnnotator — Built for educational purposes.
      </div>
    </footer>
  );
}

export default Footer;