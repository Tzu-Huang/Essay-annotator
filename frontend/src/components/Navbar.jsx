import { Link, useLocation } from "react-router-dom";
import {
  Search,
  HelpCircle,
  UserCircle2,
  BookOpen,
  Info,
  Sparkles,
} from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/dog.png";
import styles from "../styles/navbar.module.css";

function Navbar() {
  const location = useLocation();
  const isEditorPage = location.pathname === "/editor";

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

        <div className={styles.navbarCenter}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>
              <Search size={16} strokeWidth={2.1} />
            </span>
            <input placeholder="Search prompts, topics, or examples..." />
          </div>
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

            {isEditorPage ? (
              <div className={styles.userInfo}>
                <span className={styles.username}>Olivia Chu</span>
                <img src={avatar} alt="avatar" className={styles.avatar} />
              </div>
            ) : (
              <>
                <Link to="/profile" className={styles.navLink}>
                  <span className={styles.navLinkIcon}>
                    <UserCircle2 size={16} strokeWidth={2} />
                  </span>
                  <span>Profile</span>
                </Link>

                <div className={styles.auth}>
                  <Link to="/login" className={styles.signInBtn}>
                    Sign In
                  </Link>
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