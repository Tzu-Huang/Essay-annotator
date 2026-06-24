import { Link } from "react-router-dom";
import { Home, SearchX } from "lucide-react";

import styles from "../styles/notFound.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.panel} aria-labelledby="not-found-title">
        <div className={styles.iconWrap} aria-hidden="true">
          <SearchX size={34} strokeWidth={2.2} />
        </div>

        <p className={styles.status}>404</p>
        <h1 id="not-found-title">Page does not exist</h1>
        <p className={styles.message}>
          The page you are looking for may have been moved, deleted, or never
          existed.
        </p>

        <Link to="/" className={styles.homeLink}>
          <Home size={18} strokeWidth={2.2} />
          <span>Back to Home</span>
        </Link>
      </section>
    </main>
  );
}
