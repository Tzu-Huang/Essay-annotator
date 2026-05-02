import { useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    // This keeps auth usage tied to the app-level provider in main.jsx.
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
