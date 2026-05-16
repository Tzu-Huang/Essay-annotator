import { useGoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

export function useGoogleSignIn() {
  const navigate = useNavigate();
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
        navigate("/editor");
      } catch (error) {
        console.error("Google login failed:", error);
      }
    },
    onError: () => {
      console.error("Google login failed");
    },
  });
}
