import "../styles/howItWorks.css";
import { Upload, Search, Shield, FileText } from "lucide-react";

function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Upload Your Essay",
      description:
        "Upload your draft or paste your essay into our platform.",
      type: "upload",
    },
    {
      number: "2",
      title: "We Analyze It",
      description:
        "Our AI analyzes the theme, structure, tone, and key elements of your essay.",
      type: "analyze",
    },
    {
      number: "3",
      title: "Get Matched Essays",
      description:
        "We find similar essays from successful applicants to inspire your writing.",
      type: "matched",
    },
  ];

  return (
    <div className="how-page">
      <div className="how-wrapper">
        <h1 className="how-heading">How Essay Matching Works</h1>

        <p className="how-subheading">
          Our AI helps you find essays that are similar in theme, structure,
          and tone—so you can learn and get inspired.
        </p>

        <div className="how-steps-panel">
          <div className="how-steps-row">
            {steps.map((step, index) => (
              <div className="how-step-group" key={step.number}>
                <div className="how-step-card">
                  <div className="how-step-number">{step.number}</div>

                  <div className="how-step-visual">
                    {step.type === "upload" && (
                      <div className="upload-visual">
                        <div className="upload-cloud">
                          <Upload size={32} strokeWidth={2.2} />
                        </div>

                        <div className="upload-file">
                          <div className="file-corner" />
                          <div className="file-line" />
                          <div className="file-line short" />
                          <div className="file-line" />
                        </div>
                      </div>
                    )}

                    {step.type === "analyze" && (
                      <div className="analyze-visual">
                        <div className="analyze-paper">
                          <div className="analyze-badge badge-1" />
                          <div className="analyze-badge badge-2" />
                          <div className="analyze-line" />
                          <div className="analyze-line short" />
                          <div className="analyze-line" />
                        </div>

                        <div className="magnifier">
                          <div className="magnifier-circle">
                            <Search size={26} strokeWidth={2.2} />
                          </div>
                          <div className="magnifier-handle" />
                        </div>
                      </div>
                    )}

                    {step.type === "matched" && (
                      <div className="matched-visual">
                        <div className="essay-card purple">
                          <div className="essay-badge">J</div>
                          <div className="essay-line" />
                          <div className="essay-line short" />
                          <div className="essay-line" />
                        </div>

                        <div className="essay-card teal">
                          <div className="essay-badge">J</div>
                          <div className="essay-line" />
                          <div className="essay-line short" />
                          <div className="essay-line" />
                        </div>
                      </div>
                    )}
                  </div>

                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>

                {index < steps.length - 1 && (
                  <div className="how-arrow">→</div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="how-note">
          <Shield size={18} strokeWidth={2.2} />
          <span>
            We value originality. Our matches are meant to inspire, not to be
            copied.
          </span>
        </div>
      </div>
    </div>
  );
}

export default HowItWorks;