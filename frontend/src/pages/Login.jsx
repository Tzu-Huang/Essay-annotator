import { useNavigate } from "react-router-dom";
import "../styles/login.css";

function Login() {

  const navigate = useNavigate();

  return (
    <div className="login-container">
      <div className="login-card">

        <h2>sign</h2>

        <input type="text" placeholder="account" />
        <input type="password" placeholder="password" />

        <button
          className="primary-btn"
          /*onClick = 按鈕被點擊時要做的事情
            navigate：把網址改成 /editor
          */
          onClick={() => navigate("/editor")}
        >
          sign in
        </button>

        <button className="google-btn">
          continue with Google
        </button>

        <p className="signup-link">
          sign up
        </p>

      </div>
    </div>
  );
}

export default Login;