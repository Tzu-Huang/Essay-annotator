import { Link, useLocation } from "react-router-dom";
import {
  HelpCircle,
  UserCircle2,
  BookOpen,
  Info,
  Sparkles,
} from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/dog.png";
import styles from "../styles/navbar.module.css";
import { useAuth } from "../hooks/useAuth";

function Navbar({ onOpenSignIn }) {
  const location = useLocation();
  const isEditorPage = location.pathname === "/editor";
  const isHomePage = location.pathname === "/";
  const { user, logoutUser } = useAuth();

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

            {(isEditorPage || isHomePage) && user ? (
              <div className={styles.userActions}>
                <div className={styles.userInfo}>
                  <span className={styles.username}>{user.name}</span>
                  <img
                    src={user.picture || avatar}
                    alt={user.name}
                    className={styles.avatar}
                  />
                </div>

                <button className={styles.signInBtn} onClick={logoutUser}>
                  Log Out
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
