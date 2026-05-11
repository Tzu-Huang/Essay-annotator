import { Navigate, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import styles from "../styles/login.module.css";
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
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2>Sign In</h2>

        <input type="text" placeholder="account" />
        <input type="password" placeholder="password" />

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
      </div>
    </div>
  );
}

export default Login;