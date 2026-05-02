import { useState } from "react";
import styles from "../styles/faqs.module.css";

const faqSections = [
  {
    title: "Getting Started",
    questions: [
      {
        question: "What is Essay Annotator?",
        answer:
          "Essay Annotator helps students learn from real college essay examples by comparing drafts, surfacing similar essays, and giving structured feedback.",
      },
      {
        question: "Is Essay Annotator free to use?",
        answer:
          "For now, the platform is designed for limited student testing. Some features may be adjusted as the project develops.",
      },
      {
        question: "How does Essay Annotator help me improve my writing?",
        answer:
          "It does not rewrite your essay for you. Instead, it shows what strong essays do well so you can improve your own structure, specificity, reflection, and storytelling.",
      },
    ],
  },
  {
    title: "Using the Platform",
    questions: [
      {
        question: "How do I search for essay examples?",
        answer:
          "You can search by topic, prompt, theme, or draft content. The system uses semantic search, so it looks for meaning rather than only matching keywords.",
      },
      {
        question: "Can I compare my draft with a selected essay?",
        answer:
          "Yes. After selecting an example essay, you can compare your draft against it and receive focused suggestions based on content and writing quality.",
      },
      {
        question: "What kinds of essays are included?",
        answer:
          "The database is focused on college application essays, including personal statements and school-specific supplemental essays.",
      },
    ],
  },
  {
    title: "Feedback & Privacy",
    questions: [
      {
        question: "Does Essay Annotator write my essay for me?",
        answer:
          "No. The goal is not ghostwriting. The platform is built to help students learn from examples and improve their own thinking and writing.",
      },
      {
        question: "Do you store my drafts?",
        answer:
          "During testing, drafts may be processed to generate results. You should avoid submitting private information that you do not want processed.",
      },
      {
        question: "Why are the results sometimes imperfect?",
        answer:
          "The system depends on the essay database, embeddings, and AI-generated comparison logic. It is meant to guide revision, not replace human judgment.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openSection, setOpenSection] = useState(0);
  const [openQuestion, setOpenQuestion] = useState(0);

  const handleSectionClick = (index) => {
    setOpenSection(openSection === index ? null : index);
    setOpenQuestion(0);
  };

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div>
          <h1>Essay Annotator Help Center</h1>
          <p>Ask us anything. We’re here to help.</p>

          <div className={styles.search}>
            <input placeholder="Search for help..." />
            <button>Search</button>
          </div>
        </div>

        <div className={styles.illustration}>
          <div className={styles.imageCard}>
            <div className={styles.paper}>
              <span></span>
              <span></span>
              <span></span>
            </div>
            <div className={styles.highlight}></div>
            <div className={styles.avatar}></div>
            <div className={styles.chatBubble}>?</div>
          </div>
        </div>
      </section>

      <div className={styles.main}>
        <div>
          <h2>FAQs</h2>
          <p className={styles.subtitle}>
            Quick answers about how Essay Annotator works.
          </p>

          <div className={styles.card}>
            {faqSections.map((section, sectionIndex) => (
              <div key={section.title} className={styles.section}>
                <button
                  className={styles.sectionHeader}
                  onClick={() => handleSectionClick(sectionIndex)}
                >
                  <span className={styles.sectionTitle}>
                    {section.title}
                  </span>

                  <span className={styles.toggleIcon}>
                    {openSection === sectionIndex ? "−" : "+"}
                  </span>
                </button>

                <div
                  className={`${styles.questionsPanel} ${
                    openSection === sectionIndex ? styles.open : ""
                  }`}
                >
                  {section.questions.map((item, questionIndex) => (
                    <div key={item.question} className={styles.questionBlock}>
                      <button
                        className={`${styles.question} ${
                          openQuestion === questionIndex &&
                          openSection === sectionIndex
                            ? styles.featured
                            : ""
                        }`}
                        onClick={() =>
                          setOpenQuestion(
                            openQuestion === questionIndex ? null : questionIndex
                          )
                        }
                      >
                        <span>{item.question}</span>
                        <span>{openQuestion === questionIndex ? "−" : "+"}</span>
                      </button>

                      <div
                        className={`${styles.answer} ${
                          openQuestion === questionIndex &&
                          openSection === sectionIndex
                            ? styles.answerOpen
                            : ""
                        }`}
                      >
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.sidebar}>
          <h3>Categories</h3>

          {faqSections.map((section, index) => (
            <button
              key={section.title}
              className={openSection === index ? styles.activeCategory : ""}
              onClick={() => handleSectionClick(index)}
            >
              {section.title}
            </button>
          ))}

          <div className={styles.contactBox}>
            <h4>Still need questions?</h4>
            <p>We respond within 24 hours</p>
            <button>Contact Us</button>
          </div>
        </div>
      </div>
    </div>
  );
}