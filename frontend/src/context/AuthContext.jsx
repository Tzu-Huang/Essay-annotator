import { useState, createContext } from "react";
import { googleLogout } from "@react-oauth/google";

const STORAGE_KEY = "googleUser";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

  const loginUser = (profile) => {
    setUser(profile);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  };

  const logoutUser = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export { AuthContext };
