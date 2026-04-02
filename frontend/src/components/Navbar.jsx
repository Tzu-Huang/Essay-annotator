import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar({ showSearch = true }) {
  return (
    <div className="navbar">

      {/* Left */}
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="Essay Annotator Logo" className="logo-img" />
        </Link>
      </div>

      {/* Center */}
      {showSearch && (
        <div className="search-section">
          <input placeholder="Search ..." />
        </div>
      )}

      {/* Right */}
      <div className="auth">
        <Link to="/login">Sign In</Link>
      </div>

    </div>
  );
}

export default Navbar;