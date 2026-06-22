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
            </Link>
          </div>

          {/* PAGE LABEL */}
          {isComparePage && (
            <div className={styles.comparePageLabel}>
              <span className={styles.compareSlash}>/</span>
              <span>Compare-essays</span>
            </div>
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
              <Link to="/how-it-works" className={styles.navLink}>
                How It Works
              </Link>

              <a
                href="https://github.com/Tzu-Huang/Essay-annotator"
                className={styles.navLink}
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>

              <Link to="/faqs" className={styles.navLink}>
                FAQs
              </Link>

              {user ? (
                <div className={styles.userActions}>
                  {!isEditorPage ? (
                    <Link to="/editor" className={styles.signInBtn}>
                      Start Writing
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
