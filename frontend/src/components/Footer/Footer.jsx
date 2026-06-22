import "./Footer.css";
import { FaGithub } from "react-icons/fa";
import logo from "../../logo/logo.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src={logo} alt="Storyteller logo" className="footer-logo" />
          <span className="footer-title">storyteller</span>
        </div>

        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="#">Portal</a>
          <a href="#">FAQs</a>
          <a href="#">Home</a>
          <a href="#">Contact Us</a>
        </nav>
      </div>

      <div className="footer-line" />

      <div className="footer-bottom">
        <p>©2026 Storyteller</p>

        <div className="footer-links">
          <a href="https://github.com" aria-label="GitHub" className="github-icon">
            <FaGithub aria-hidden="true" />
          </a>
          <a href="/privacy">Terms of Privacy</a>
          <a href="/terms">Terms &amp; Condition</a>
        </div>
      </div>
    </footer>
  );
}
