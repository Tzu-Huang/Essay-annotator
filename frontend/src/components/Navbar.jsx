import { Link, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import avatar from "../assets/dog.png";

function Navbar() {
  const location = useLocation();

  // 判斷是不是 editor 頁面
  const isEditorPage = location.pathname === "/editor";

  return (
    <div className="navbar">

      {/* Left */}
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="Essay Annotator Logo" className="logo-img" />
        </Link>
      </div>

      {/* Center */}
      <div className="search-box">
        <span className="search-icon">🔍</span>
        <input placeholder="Search prompts, topics, or examples..." />
      </div>

      {/* Right（重點🔥） */}
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