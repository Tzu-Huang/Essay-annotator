import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./useAuth";

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

const REDIRECT_TO_EDITOR_PAGES = new Set(["/", "/login"]);

export function useGoogleSignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginUser } = useAuth();

  return useGoogleLogin({
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

        const profile = await response.json();
        loginUser(profile);
        const destination = REDIRECT_TO_EDITOR_PAGES.has(location.pathname)
          ? "/editor"
          : location.pathname;
        navigate(destination);
      } catch (error) {
        console.error("Google login failed:", error);
      }
    },
    onError: () => {
      console.error("Google login failed");
    },
  });
}
