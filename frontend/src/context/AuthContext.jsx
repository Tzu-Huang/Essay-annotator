import { useState, createContext } from "react";
import { googleLogout } from "@react-oauth/google";

const STORAGE_KEY = "googleUser";
const ACCESS_TOKEN_KEY = "googleAccessToken";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => sessionStorage.getItem(ACCESS_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch {
      // Clear bad saved data instead of crashing the app on startup.
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  });

  const loginUser = (profile, googleAccessToken = null) => {
    setUser(profile);
    setAccessToken(googleAccessToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    if (googleAccessToken) {
      sessionStorage.setItem(ACCESS_TOKEN_KEY, googleAccessToken);
    } else {
      sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  };

  const logoutUser = () => {
    googleLogout();
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
