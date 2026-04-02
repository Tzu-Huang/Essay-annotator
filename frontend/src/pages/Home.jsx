import { Link } from "react-router-dom";
import "../styles/home.css";


function Home() {
  return (
    <div className="home background-image bg-world">

      <div className="hero">
        <h1>
          Learn from Real Accepted Essays — Not just AI Opinions
        </h1>

        <p>
          Upload your essay and discover similar essays
          that got into top U.S. universities.
        </p>

        <Link to="/login">
          <button className="primary-btn">
            start writing
          </button>
        </Link>
      </div>

      <div className="how-it-works">
        <h2>How it works</h2>

        <div className="steps">
          <div className="step">
            <p>upload your draft</p>
          </div>

          <div className="step">
            <p>get top-k similar essays</p>
          </div>

          <div className="step">
            <p>compare structure & improve</p>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Home;