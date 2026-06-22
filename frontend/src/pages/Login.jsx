import { Navigate, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
<<<<<<< HEAD
import styles from "../styles/login.module.css";
=======
import "../styles/login.css";
>>>>>>> feature/Footer
import { useAuth } from "../hooks/useAuth";

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

function Login() {
  const navigate = useNavigate();
  const { user, loginUser } = useAuth();

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(GOOGLE_USERINFO_URL, {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to load Google profile");
        }

        // Google returns the profile data we want to reuse across the app.
        const profile = await response.json();
        loginUser(profile);
        navigate("/editor");
      } catch (error) {
        console.error("Google login failed:", error);
      }
    },
    onError: () => {
      console.log("Google login failed");
    },
  });

  if (user) {
    return <Navigate to="/editor" replace />;
  }

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
<<<<<<< HEAD
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
=======
    <div className="login-container">
      <div className="login-card">
>>>>>>> feature/Footer
        <h2>Sign In</h2>

        <input type="text" placeholder="account" />
        <input type="password" placeholder="password" />

<<<<<<< HEAD
        <button
          className={styles.primaryBtn}
          onClick={() => navigate("/editor")}
        >
          Sign In
        </button>

        <button className={styles.googleBtn} onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className={styles.signupLink}>Sign Up</p>
=======
        <button className="primary-btn" onClick={() => navigate("/editor")}>
          Sign In
        </button>

        <button className="google-btn" onClick={handleGoogleLogin}>
          Continue with Google
        </button>

        <p className="signup-link">Sign Up</p>
>>>>>>> feature/Footer
      </div>
    </div>
  );
}

<<<<<<< HEAD
export default Login;
=======
export default Login;
>>>>>>> feature/Footer
