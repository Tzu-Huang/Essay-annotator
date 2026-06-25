import { Link } from "react-router-dom";
<<<<<<< HEAD
import { ArrowLeft, FileQuestion, Home } from "lucide-react";
=======
import { Home, SearchX } from "lucide-react";
>>>>>>> feature/editor

import styles from "../styles/notFound.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
<<<<<<< HEAD
      <section className={styles.content}>
        <div className={styles.badge}>
          <FileQuestion size={22} />
          <span>404</span>
        </div>

        <h1>Page not found</h1>
        <p>
          The page you are looking for does not exist or may have been moved.
        </p>

        <div className={styles.actions}>
          <Link to="/" className={styles.primaryAction}>
            <Home size={18} />
            <span>Go home</span>
          </Link>

          <Link to="/editor" className={styles.secondaryAction}>
            <ArrowLeft size={18} />
            <span>Open editor</span>
          </Link>
        </div>
=======
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
>>>>>>> feature/editor
      </section>
    </main>
  );
}
