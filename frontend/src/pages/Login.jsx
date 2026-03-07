import { useNavigate } from "react-router-dom";

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