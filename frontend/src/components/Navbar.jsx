import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Tag,
  Settings,
  Star,
} from "lucide-react";
import logo from "../assets/logo.png";
import avatar from "../assets/dog.png";

function Navbar() {
  const location = useLocation();
  const isEditorPage = location.pathname === "/editor";
  const [isExploreOpen, setIsExploreOpen] = useState(false);

  const exploreItems = [
    {
      label: "Browse Sample Essays",
      to: "/sample-essays",
      icon: <BookOpen size={16} strokeWidth={2} />,
    },
    {
      label: "By School",
      to: "/schools",
      icon: <GraduationCap size={16} strokeWidth={2} />,
    },
    {
      label: "By Topic",
      to: "/topics",
      icon: <Tag size={16} strokeWidth={2} />,
    },
    {
      label: "How Matching Works",
      to: "/how-it-works",
      icon: <Settings size={16} strokeWidth={2} />,
    },
    {
      label: "Success Stories",
      to: "/success-stories",
      icon: <Star size={16} strokeWidth={2} />,
    },
  ];

  const toggleExplore = () => {
    setIsExploreOpen((prev) => !prev);
  };

  return (
    <div className="navbar">
      <div className="navbar-left">
        <div className="logo">
          <Link to="/">
            <img src={logo} alt="Essay Annotator Logo" className="logo-img" />
          </Link>
        </div>

        <div className="explore-dropdown">
          <button
            className={`explore-trigger ${isExploreOpen ? "active" : ""}`}
            onClick={toggleExplore}
            type="button"
          >
            <span className="explore-label">Explore</span>
            <span className={`explore-arrow ${isExploreOpen ? "open" : ""}`}>
              ▾
            </span>
          </button>

          {isExploreOpen && (
            <div className="explore-menu">
              {exploreItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="explore-item"
                  onClick={() => setIsExploreOpen(false)}
                >
                  <span className="explore-item-icon">{item.icon}</span>
                  <span className="explore-item-text">{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="navbar-center">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input placeholder="Search prompts, topics, or examples..." />
        </div>
      </div>

      <div className="auth">
        {isEditorPage ? (
          <div className="user-info">
            <span className="username">Olivia Chu</span>
            <img src={avatar} alt="avatar" className="avatar" />
          </div>
        ) : (
          <Link to="/login">Sign In</Link>
        )}
      </div>
    </div>
  );
}

export default Navbar;