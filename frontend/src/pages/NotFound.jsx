import { Link } from "react-router-dom";
import { ArrowLeft, FileQuestion, Home } from "lucide-react";

import styles from "../styles/notFound.module.css";

export default function NotFound() {
  return (
    <main className={styles.page}>
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
      </section>
    </main>
  );
}
