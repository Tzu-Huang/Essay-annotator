import { useState } from "react";
import styles from "../styles/faqs.module.css";
import logo from "../assets/logo.png";

const categories = [
  "All Questions",
  "Getting Started",
  "Essays & Tools",
  "Account & Billing",
  "Privacy & Security",
];

const faqs = [
  {
    question: "What is Essay Annotator?",
    answer:
      "Essay-Annotator is a data-driven platform designed to help students learn how to write effective U.S. college application essays by analyzing real examples and providing structural, non-ghostwriting feedback.",
    category: "Getting Started",
  },
  {
    question: "How does Essay Annotator help me improve my writing?",
    answer:
      "It compares your draft with similar accepted essays and highlights specific areas where the reference essay is stronger, such as reflection, structure, specificity, and storytelling.",
    category: "Essays & Tools",
  },
  {
    question: "Is Essay Annotator free to use?",
    answer:
      "We are currently only open to a few organizations that collaborates with us",
    category: "Account & Billing",
  },
  {
    question: "Where do the essays in the database come from?",
    answer:
      "The database is built from real accepted essays that are organized by school, essay type, topic, and writing pattern.",
    category: "Essays & Tools",
  },
  {
    question: "Can I use Essay Annotator for school applications?",
    answer:
      "Yes. Essay AI is designed to help you understand strong writing patterns and improve your own draft while keeping your voice and ideas original.",
    category: "Getting Started",
  },
  {
    question: "Is my data safe and private?",
    answer:
      "Your draft should be treated as private user content. Avoid sharing sensitive personal information unless necessary.",
    category: "Privacy & Security",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Yes. If subscriptions are enabled, users should be able to manage or cancel their plan from account settings.",
    category: "Account & Billing",
  },
  {
    question: "What types of essays can I write with Essay Annotator?",
    answer:
      "Essay AI can support personal statements, supplemental essays, community essays, leadership essays, diversity essays, and more.",
    category: "Essays & Tools",
  },
];

function FAQsPage() {
  const [activeCategory, setActiveCategory] = useState("All Questions");
  const [openIndex, setOpenIndex] = useState(0);
  const [search, setSearch] = useState("");

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      activeCategory === "All Questions" || faq.category === activeCategory;

    const matchesSearch =
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className={styles.faqPage}>

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <span className={styles.heroPill}>FAQs</span>
          <h1>
            Answers to Your
            <br />
            Most Common Questions
          </h1>
          <p>
            Everything you need to know about Essay Annotator.
            <br />
            Can’t find the answer you’re looking for? Contact us anytime.
          </p>

          <div className={styles.searchBox}>
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for a question..."
            />
          </div>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.questionBubble}>?</div>
          <div className={styles.chatBubble}>•••</div>
          <div className={styles.bookStack} />
          <div className={styles.plant} />
        </div>
      </section>

      <main className={styles.faqMain}>
        <aside className={styles.sidebar}>
          <div className={styles.categoryCard}>
            {categories.map((category) => (
              <button
                key={category}
                className={`${styles.categoryButton} ${
                  activeCategory === category ? styles.categoryActive : ""
                }`}
                onClick={() => {
                  setActiveCategory(category);
                  setOpenIndex(0);
                }}
              >
                <span className={styles.categoryIcon}>▣</span>
                {category}
              </button>
            ))}
          </div>

          <div className={styles.helpCard}>
            <h3>Still need help?</h3>
            <p>Our support team is here for you.</p>
            <button className={styles.primarySupport}>Contact Support</button>
            <button className={styles.secondarySupport}>Live Chat</button>
          </div>
        </aside>

        <section className={styles.faqList}>
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={faq.question}
                className={`${styles.faqItem} ${isOpen ? styles.faqOpen : ""}`}
              >
                <button
                  className={styles.faqQuestion}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                >
                  <span>{faq.question}</span>
                  <span className={styles.chevron}>{isOpen ? "⌃" : "⌄"}</span>
                </button>

                {isOpen && (
                  <div className={styles.faqAnswer}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}

export default FAQsPage;