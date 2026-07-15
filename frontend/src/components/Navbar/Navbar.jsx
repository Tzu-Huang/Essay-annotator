import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";

import logo from "../../assets/logo.png";
import avatar from "../../assets/dog.png";

import styles from "./navbar.module.css";

import { useAuth } from "../../hooks/useAuth";

function Navbar({
  onOpenSignIn,
  onLoggedOut,
  variant = "default",
  annotationsEnabled,
  setAnnotationsEnabled,
  handleResetView,
  handleCompare,
  compareLoading,
}) {
  const isComparePage = variant === "compare";

  const location = useLocation();
  const isEditorPage = location.pathname === "/editor";

  const { user, logoutUser } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  useEffect(() => {
    if (!showAccountMenu) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!accountMenuRef.current?.contains(event.target)) {
        setShowAccountMenu(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setShowAccountMenu(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showAccountMenu]);

  return (
    <header
      className={`${styles.navbarShell} ${
        isComparePage ? styles.compareNavbarShell : ""
      }`}
    >
      <div className={styles.navbar}>
        <div className={styles.navbarLeft}>
          <div className={styles.logo}>
            <Link to="/">
              <img
                src={logo}
                alt="Essay Annotator Logo"
                className={styles.logoImg}
              />
              <span className={styles.logoText}>Essay Annotator</span>
            </Link>
          </div>

          {/* PAGE LABEL */}
          {isComparePage && (
            <div className={styles.comparePageLabel}>
              <span className={styles.compareSlash}>/</span>
              <span>Compare-essays</span>
            </div>
          )}

          {!isComparePage && (
            <>
              <div className={`${styles.navDivider} ${styles.navDividerLeft}`} />
              <a href="/#how-it-works" className={`${styles.navLink} ${styles.navLinkPill}`}>
                How It Works
              </a>
            </>
          )}
        </div>

        {isComparePage ? (
          <div className={styles.compareNavbarActions}>
            <button
              type="button"
              className={styles.ghostButton}
              onClick={() => setAnnotationsEnabled((prev) => !prev)}
            >
              <span
                className={`${styles.statusDot} ${
                  annotationsEnabled ? styles.statusOn : styles.statusOff
                }`}
              />

              <span>
                {annotationsEnabled ? " Annotations On" : " Annotations Off"}
              </span>
            </button>

            <button
              type="button"
              className={styles.ghostButton}
              onClick={handleResetView}
            >
              Show Original
            </button>

            <button
              type="button"
              className={`${styles.primaryButton} ${
                compareLoading ? styles.primaryButtonLoading : ""
              }`}
              onClick={handleCompare}
              disabled={compareLoading}
            >
              {compareLoading ? "Loading Suggestions..." : "Load Suggestions"}
            </button>
          </div>
        ) : (
          <div className={styles.navbarRight}>
            <nav className={styles.navbarLinks}>
              <Link to="/faqs" className={styles.navLink}>
                FAQs
              </Link>

              <a
                href="https://github.com/Tzu-Huang/Essay-annotator"
                className={`${styles.navLink} ${styles.navLinkGit}`}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
              >
                <svg
                  className={styles.githubIcon}
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span className={styles.githubText}>GitHub</span>
              </a>

              {user ? (
                <div className={styles.userActions}>
                  {!isEditorPage ? (
                    <Link to="/editor" className={styles.signInBtn}>
                      Get Started
                    </Link>
                  ) : null}

                  <div className={styles.accountMenuWrap} ref={accountMenuRef}>
                    <button
                      type="button"
                      className={styles.userInfo}
                      onClick={() =>
                        setShowAccountMenu((currentValue) => !currentValue)
                      }
                      aria-expanded={showAccountMenu}
                      aria-haspopup="menu"
                    >
                      <img
                        src={user.picture || avatar}
                        alt={user.name}
                        className={styles.avatar}
                      />
                    </button>

                    {showAccountMenu ? (
                      <div className={styles.accountMenu} role="menu">
                        <button
                          type="button"
                          className={styles.accountMenuItem}
                          onClick={() => {
                            setShowAccountMenu(false);
                            logoutUser();
                            onLoggedOut?.();
                          }}
                          role="menuitem"
                        >
                          <LogOut size={15} strokeWidth={2.1} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className={styles.auth}>
                  <button
                    type="button"
                    className={styles.signInBtn}
                    onClick={onOpenSignIn}
                  >
                    Sign In
                  </button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
