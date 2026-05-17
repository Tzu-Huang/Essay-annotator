import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HelpCircle,
  UserCircle2,
  BookOpen,
  Info,
  Sparkles,
  ChevronDown,
  LogOut,
} from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/dog.png";
import styles from "../styles/navbar.module.css";
import { useAuth } from "../hooks/useAuth";

function Navbar({ onOpenSignIn, onLoggedOut }) {
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const { user, logoutUser } = useAuth();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const accountMenuRef = useRef(null);

  // handle the sign out drop down menu
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
    <header className={styles.navbarShell}>
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

          <nav className={styles.leftNavLinks}>
            <Link to="/examples" className={styles.leftNavLink}>
              <span className={styles.leftNavIcon}>
                <BookOpen size={16} strokeWidth={2} />
              </span>
              <span>Example Essays</span>
            </Link>

            <Link to="/how-it-works" className={styles.leftNavLink}>
              <span className={styles.leftNavIcon}>
                <Sparkles size={16} strokeWidth={2} />
              </span>
              <span>How It Works</span>
            </Link>
          </nav>
        </div>
        
        <div className={styles.navbarRight}>
          <nav className={styles.navbarLinks}>
            <Link to="/about" className={styles.navLink}>
              <span className={styles.navLinkIcon}>
                <Info size={16} strokeWidth={2} />
              </span>
              <span>About Us</span>
            </Link>

            <Link to="/faqs" className={styles.navLink}>
              <span className={styles.navLinkIcon}>
                <HelpCircle size={16} strokeWidth={2} />
              </span>
              <span>FAQs</span>
            </Link>

            <div className={styles.navDivider} />

            {user ? (
              <div className={styles.userActions}>
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
                    <span className={styles.username}>{user.name}</span>
                    <img
                      src={user.picture || avatar}
                      alt={user.name}
                      className={styles.avatar}
                    />
                    <span className={styles.accountMenuChevron}>
                      <ChevronDown size={14} strokeWidth={2.2} />
                    </span>
                  </button>

                  {showAccountMenu ? (
                    <div className={styles.accountMenu} role="menu">
                      <button
                        type="button"
                        className={styles.accountMenuItem}
                        onClick={() => {
                          setShowAccountMenu(false);
                          logoutUser();
                          if (!isHomePage) onLoggedOut?.();
                        }}
                      >
                        <LogOut size={15} strokeWidth={2.1} />
                        <span>Log Out</span>
                      </button>
                    </div>
                  ) : null}
                </div>

                {isHomePage ? (
                  <Link to="/editor" className={styles.signInBtn}>
                    Editor
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className={styles.loggedOut}>
                <div className={styles.navLink} aria-disabled="true">
                  <span className={styles.navLinkIcon}>
                    <UserCircle2 size={16} strokeWidth={2} />
                  </span>
                  <span>Profile</span>
                </div>

                <div className={styles.auth}>
                  {user ? (
                    <Link to="/editor" className={styles.signInBtn}>
                      Editor
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className={styles.signInBtn}
                      onClick={onOpenSignIn}
                    >
                      Sign In
                    </button>
                  )}
                </div>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
