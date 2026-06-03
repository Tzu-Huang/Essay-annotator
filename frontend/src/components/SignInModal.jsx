import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGoogleSignIn } from "../hooks/useGoogleSignIn";
import google_icon from "../assets/google_icon.png";
import styles from "../styles/signInModal.module.css";

const AUTO_REDIRECT_SECONDS = 5;
const CLOSE_ANIM_MS = 160;

function SignInModal({ isOpen, onClose, postLogout = false }) {
  const googleSignIn = useGoogleSignIn();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(AUTO_REDIRECT_SECONDS);
  const [mounted, setMounted] = useState(isOpen);
  const closing = mounted && !isOpen;
  const closeTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen || !mounted) return;

    closeTimerRef.current = setTimeout(() => {
      setMounted(false);
    }, CLOSE_ANIM_MS);

    return () => clearTimeout(closeTimerRef.current);
  }, [isOpen, mounted]);

  useEffect(() => {
    if (!mounted) {
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
  }, [mounted, onClose]);

  // Auto-redirect countdown when shown after logout.
  // The component is remounted via `key` on each logout, so countdown
  // initializes fresh from useState without any synchronous setState here.
  useEffect(() => {
    if (!isOpen || !postLogout) {
      return undefined;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          navigate("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, postLogout, navigate, onClose]);

  if (!mounted) {
    return null;
  }

  function handleGoHome() {
    onClose();
    navigate("/");
  }

  if (postLogout) {
    return (
      <div
        className={`${styles.signInOverlay} ${closing ? styles.signInOverlayClosing : ""}`}
        onClick={handleGoHome}
      >
        <div
          className={`${styles.signInModal} ${closing ? styles.signInModalClosing : ""}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="homepage-sign-in-title"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            className={styles.signInClose}
            onClick={handleGoHome}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2.2} />
          </button>

          <p className={styles.signInEyebrow}>See you next time</p>
          <h2 id="homepage-sign-in-title" className={styles.signInTitle}>
            You&rsquo;ve been signed out
          </h2>
          <p className={styles.signInText}>
            Redirecting to home in {countdown}s&hellip;
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
            Sign back in with Google
          </button>

          <button
            type="button"
            className={styles.homeBtn}
            onClick={handleGoHome}
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${styles.signInOverlay} ${closing ? styles.signInOverlayClosing : ""}`}
      onClick={onClose}
    >
      <div
        className={`${styles.signInModal} ${closing ? styles.signInModalClosing : ""}`}
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
          <img
            src={google_icon}
            className={styles.googleMark}
            alt=""
            aria-hidden="true"
          />
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default SignInModal;
