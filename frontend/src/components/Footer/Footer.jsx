import "./Footer.css";
import { FaGithub } from "react-icons/fa";
import logo from "../../assets/logo.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="footer-brand">
          <img src={logo} alt="Essay Annotator logo" className="footer-logo" />
          <span className="footer-title">Essay Annotator</span>
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
        <p>©2026 Essay Annotator</p>

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
