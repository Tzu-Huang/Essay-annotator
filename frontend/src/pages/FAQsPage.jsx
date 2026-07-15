import { useState } from "react";
import { ChevronDown, Mail, Search } from "lucide-react";
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
      {
        question: "Do I need an account to try the platform?",
        answer:
          "Some pages can be explored without signing in, but features that process drafts or save context may require authentication during testing.",
      },
      {
        question: "Who is Essay Annotator built for?",
        answer:
          "It is built for students who want to study strong college application essays and use those examples to revise their own writing more thoughtfully.",
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
      {
        question: "Can I search with a rough idea instead of exact keywords?",
        answer:
          "Yes. Semantic search is designed for rough ideas, themes, and draft fragments, so you do not need to know the exact wording used in the essay database.",
      },
      {
        question: "What should I do after finding a similar essay?",
        answer:
          "Read for structure, specificity, and reflection. The goal is to identify useful writing moves, not to copy the essay's content or voice.",
      },
      {
        question: "Why do some search results feel only loosely related?",
        answer:
          "The system ranks essays by meaning rather than exact phrasing. A result may share a theme, narrative pattern, or emotional arc even when the surface topic is different.",
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
      {
        question: "Can feedback replace a teacher, counselor, or editor?",
        answer:
          "No. Essay Annotator can help you notice patterns and revision opportunities, but human feedback is still important for judgment, context, and personal fit.",
      },
      {
        question: "Will the platform tell me exactly what to write?",
        answer:
          "No. Feedback is framed around revision direction and writing quality. You are responsible for the ideas, examples, and final wording in your essay.",
      },
    ],
  },
];

export default function FAQPage() {
  const [openQuestions, setOpenQuestions] = useState(
    () => new Set([`${faqSections[0].title}-${faqSections[0].questions[0].question}`]),
  );
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const visibleSections = faqSections
    .map((section) => ({
      ...section,
      questions: section.questions.filter((item) => {
        if (!normalizedQuery) return true;
        return `${section.title} ${item.question} ${item.answer}`
          .toLowerCase()
          .includes(normalizedQuery);
      }),
    }))
    .filter((section) => section.questions.length > 0);

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>Help Center</p>
          <h1>Essay Annotator Help Center</h1>
          <p>
            Find clear answers about searching examples, comparing drafts, and
            using feedback responsibly.
          </p>

          <div className={styles.search}>
            <Search aria-hidden="true" size={20} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search questions, topics, or privacy"
            />
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
            {visibleSections.map((section) => (
              <div key={section.title} className={styles.section}>
                <div className={styles.sectionHeader}>
                  <span className={styles.sectionTitle}>{section.title}</span>
                  <span className={styles.sectionCount}>
                    {section.questions.length} articles
                  </span>
                </div>

                <div className={`${styles.questionsPanel} ${styles.open}`}>
                  {section.questions.map((item) => {
                    const questionId = `${section.title}-${item.question}`;
                    const isOpen = openQuestions.has(questionId);

                    return (
                      <div key={item.question} className={styles.questionBlock}>
                        <button
                          className={`${styles.question} ${
                            isOpen ? styles.featured : ""
                          }`}
                          onClick={() =>
                            setOpenQuestions((currentOpenQuestions) => {
                              const nextOpenQuestions = new Set(
                                currentOpenQuestions,
                              );

                              if (nextOpenQuestions.has(questionId)) {
                                nextOpenQuestions.delete(questionId);
                              } else {
                                nextOpenQuestions.add(questionId);
                              }

                              return nextOpenQuestions;
                            })
                          }
                          aria-expanded={isOpen}
                        >
                          <span>{item.question}</span>
                          <span>
                            <ChevronDown aria-hidden="true" size={18} />
                          </span>
                        </button>

                        <div
                          className={`${styles.answer} ${
                            isOpen ? styles.answerOpen : ""
                          }`}
                        >
                          <p>{item.answer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {visibleSections.length === 0 && (
              <div className={styles.emptyState}>
                <h3>No matching questions</h3>
                <p>Try a broader search term or contact us for help.</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.contactBox}>
            <Mail aria-hidden="true" size={22} />
            <h3>Still need help?</h3>
            <p>
              Send us the issue you ran into and include the page where it
              happened.
            </p>
            <button>Contact Us</button>
          </div>

          <div className={styles.noteBox}>
            <h3>Before you submit</h3>
            <p>
              Avoid including private information in drafts during testing.
              Essay Annotator is designed for guidance, not ghostwriting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
