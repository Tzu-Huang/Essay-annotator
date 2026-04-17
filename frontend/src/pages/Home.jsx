import { Link } from "react-router-dom";
import "../styles/home.css";

function Home() {
  return (
    <div className="home">

      {/* HERO */}
      <section className="hero">
        <h1>
          Get Into Top Colleges <br />
          By Learning From <span>200+ Real Accepted Essays</span>
        </h1>

        <p>
          Access a curated database of 200+ real essays accepted into Harvard,
          MIT, Stanford, and other top universities.
        </p>

        <Link to="/login">
          <button className="primary-btn">Start Writing</button>
        </Link>

        <div className="hero-badges">
          <div>✓ 200+ accepted essays</div>
          <div>✓ Harvard, MIT, Stanford</div>
          <div>✓ Real student submissions</div>
          <div>✓ Compare & improve</div>
        </div>
      </section>

      {/* EXAMPLE */}
      <section className="example-section">
        <div className="example-box">
          <h3>Your Essay</h3>
          <div className="placeholder large">Essay Preview</div>
        </div>

        <div className="arrow">→</div>

        <div className="example-box">
          <h3>Similar Accepted Essays</h3>
          <div className="placeholder large">Matched Essays</div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-it-works">
        <h2>See How It Works</h2>

        <div className="steps">
          <div className="step">
            <h3>1. Upload Essay</h3>
            <p>Paste your draft or upload a file</p>
          </div>

          <div className="step">
            <h3>2. Find Matches</h3>
            <p>We find essays accepted by top schools</p>
          </div>

          <div className="step">
            <h3>3. Improve</h3>
            <p>Compare structure, tone, storytelling</p>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="featured">
        <h2>Featured Accepted Essays</h2>

        <div className="cards">
          <div className="card">
            <h4>Harvard</h4>
            <p>Personal Growth</p>
            <span>Strong narrative arc and emotional depth</span>
            <button className="link-btn">View Analysis →</button>
          </div>

          <div className="card">
            <h4>MIT</h4>
            <p>Passion for Research</p>
            <span>Clear intellectual curiosity and impact</span>
            <button className="link-btn">View Analysis →</button>
          </div>

          <div className="card">
            <h4>Stanford</h4>
            <p>Unique Perspective</p>
            <span>Distinct voice and personal storytelling</span>
            <button className="link-btn">View Analysis →</button>
          </div>
        </div>
      </section>

      {/* COMPARISON / CTA */}
      <section className="comparison">
        <h2>Boost Your Admissions Chances Today</h2>
        <p>Learn from real essays that actually got into top schools.</p>

        <div className="compare-box">
          <div className="bad">
            <h3>✗ Generic Advice</h3>
            <p>AI gives broad, non-specific feedback</p>
            <ul>
              <li>✗ Vague suggestions</li>
              <li>✗ No real examples</li>
              <li>✗ Hard to apply</li>
            </ul>
          </div>

          <div className="good">
            <h3>✓ Real Examples</h3>
            <p>See essays that actually got accepted</p>
            <ul>
              <li>✓ 10,000+ essays indexed</li>
              <li>✓ Real successful structures</li>
              <li>✓ Clear improvement path</li>
            </ul>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;