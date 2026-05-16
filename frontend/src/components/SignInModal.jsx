import { useEffect } from "react";
import { X } from "lucide-react";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import styles from "../styles/signInModal.module.css";

function SignInModal({ isOpen, onClose }) {
  const googleSignIn = useGoogleSignIn();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleEscape(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.signInOverlay} onClick={onClose}>
      <div
        className={styles.signInModal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="homepage-sign-in-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.signInClose}
          onClick={onClose}
          aria-label="Close sign in"
        >
          <X size={18} strokeWidth={2.2} />
        </button>

        <p className={styles.signInEyebrow}>Essay workspace</p>
        <h2 id="homepage-sign-in-title" className={styles.signInTitle}>
          Get personalized feedback
        </h2>
        <p className={styles.signInText}>
          Sign in with Google to save drafts, open the editor, and come back to
          your essays at anytime.
        </p>

        <button
          type="button"
          className={styles.signInGoogleBtn}
          onClick={() => {
            onClose();
            googleSignIn();
          }}
        >
          <span className={styles.googleMark} aria-hidden="true">
            G
          </span>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default SignInModal;
