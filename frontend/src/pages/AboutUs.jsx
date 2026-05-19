import styles from "../styles/AboutUs.module.css";

function AboutUs() {
  return (
    <main className={styles.aboutPage}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>Our Story</h1>
          <div className={styles.heroLine} />

          <p className={styles.heroScript}>
            Built for students applying
            <br />
            without expensive counselors.
          </p>

            <p className={styles.heroBody}>
            Applying to U.S. colleges can feel confusing, lonely, and expensive. Private
            counseling is often out of reach for many students.
            </p>

            <p className={styles.heroBody}>
            We created Essay Annotator because we have experienced that uncertainty
            ourselves. We hope real accepted essays can help future applicants feel less
            lost.
            </p>
        </div>

        <div className={styles.heroVisual}>
          <div className={styles.notebook}>
            <div className={styles.spiral} />

            <div className={styles.notebookContent}>
              <p className={styles.draftTitle}>college essay</p>

              <div className={styles.flowBox}>no counselor</div>
              <div className={styles.arrow}>↓</div>
              <div className={styles.flowBox}>search online</div>
              <div className={styles.arrow}>↓</div>

              <p className={styles.feedbackText}>
                What makes an
                <br />
                essay strong?
              </p>

              <span className={styles.star}>☆</span>
            </div>
          </div>

          <div className={`${styles.sticky} ${styles.yellowSticky}`}>
            Counselors
            <br />
            were too
            <br />
            expensive.
          </div>

          <div className={`${styles.sticky} ${styles.blueSticky}`}>
            Reliable
            <br />
            examples
            <br />
            were rare.
          </div>
        </div>
      </section>

      {/* Started */}
      <section className={styles.started}>
        <div className={styles.startedImageArea}>
          <div className={styles.imageCard}>
            <span className={styles.pin} />

            <img
              src="/about/student-working.webp"
              alt="Student working on college essay"
              className={styles.imagePlaceholder}
            />
          </div>

          <div className={styles.checkNote}>
            <h3>What we experienced</h3>

            <ul>
              <li>College counseling was expensive</li>
              <li>Reliable examples were hard to find</li>
              <li>Online advice felt too generic</li>
              <li>We didn’t know what made essays strong</li>
            </ul>
          </div>
        </div>

        <div className={styles.startedText}>
          <h2>How Essay Annotator Started</h2>
          <div className={styles.smallLine} />

          <p>
            We started with a simple frustration: students are often told to
            “write a strong essay,” but very few are shown what strong essays
            actually do.
          </p>

          <p>
            During our own application journey, we felt lost between scattered
            online advice, limited resources, and the high cost of private
            college counseling.
          </p>

          <div className={styles.bookDoodle}>
            <span />
            <span />
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className={styles.process}>
        <h2>The path from idea to product</h2>

        <div className={styles.timeline}>
          <div className={styles.timelineLine} />

          <article className={styles.step}>
            <span className={styles.stepNumber}>1</span>
            <div className={styles.stepIcon}>⌕</div>
            <h3>Experience</h3>
            <p>
              We felt how confusing the application process could be.
            </p>
          </article>

          <article className={styles.step}>
            <span className={styles.stepNumber}>2</span>
            <div className={styles.stepIcon}>▱</div>
            <h3>Collect</h3>
            <p>
              We studied accepted essays to understand what worked.
            </p>
          </article>

          <article className={styles.step}>
            <span className={styles.stepNumber}>3</span>
            <div className={styles.stepIcon}>✎</div>
            <h3>Annotate</h3>
            <p>
              We turned strong writing choices into visible insights.
            </p>
          </article>

          <article className={styles.step}>
            <span className={styles.stepNumber}>4</span>
            <div className={styles.stepIcon}>↗</div>
            <h3>Build</h3>
            <p>
              We created a platform for future applicants.
            </p>
          </article>
        </div>
      </section>

      {/* Believe */}
      <section className={styles.believe}>
        <div className={styles.believeTitle}>
          <h2>
            What we
            <br />
            believe
          </h2>
          <div className={styles.believeLine} />
          <span>♡</span>
        </div>

        <div className={styles.valueCards}>
          <article className={styles.valueCard}>
            <span className={styles.cardPinBlue} />
            <h3>Access should not depend on wealth.</h3>
            <p>
              Students deserve helpful guidance even if they cannot afford
              expensive counselors.
            </p>
            <span className={styles.cardDoodle}>☆</span>
          </article>

          <article className={`${styles.valueCard} ${styles.peachCard}`}>
            <span className={styles.cardPinGold} />
            <h3>Real examples teach better than vague advice.</h3>
            <p>
              Accepted essays show how strong stories are shaped, structured,
              and expressed.
            </p>
            <span className={styles.cardDoodle}>♧</span>
          </article>

          <article className={`${styles.valueCard} ${styles.purpleCard}`}>
            <span className={styles.cardPinBlue} />
            <h3>Every student’s story deserves clarity.</h3>
            <p>
              We help students understand what works without copying someone
              else’s voice.
            </p>
            <span className={styles.cardDoodle}>♙</span>
          </article>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.teamImageCard}>
          <img
            src="/about/team-collab.jpg"
            alt="Students working together"
            className={styles.imagePlaceholder}
          />
        </div>

        <div className={styles.ctaCard}>
          <h2>
            Help more students learn from
            <br />
            real accepted essays
          </h2>
          <div className={styles.smallLine} />

          <p>
            Essay Annotator helps future applicants understand successful
            college essays, find stronger writing strategies, and tell their own
            stories with more confidence.
          </p>

          <p>
            Whether you are a student, mentor, or someone who was accepted and
            wants to help others, join us in making college application guidance
            more accessible.
          </p>

          <div className={styles.ctaButtons}>
            <a href="/login" className={styles.primaryBtn}>
              Start Learning
            </a>
            <a href="/join" className={styles.secondaryBtn}>
              Share Your Essay
            </a>
          </div>
        </div>

        <div className={styles.successNote}>
          <span className={styles.gradIcon}>⌂</span>

          <p>
            Accepted
            <br />
            before?
          </p>

          <hr />

          <p>
            Share your essay
            <br />
            to help the next
            <br />
            student feel
            <br />
            less lost.
          </p>

          <span className={styles.heartIcon}>♡</span>
        </div>
      </section>
    </main>
  );
}

export default AboutUs;