/**
 * Main Application Component
 *
 * App.jsx controls the main routing of the application.
 * 網址 = 指令，App.jsx = 導航員
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import EssayPage from "./pages/EssayPage";
import ComparePage from "./pages/ComparePage";
import FAQsPage from "./pages/FAQsPage";
import HowItWorks from "./pages/HowItWorks";

import "./styles/global.css";
import "./styles/components.css";
import "./styles/background.css";

function App() {
  const bg = "bg-world";

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
                <Footer />
              </>
            }
          />

          <Route
            path="/login"
            element={
              <>
                <Navbar />
                <Login />
                <Footer />
              </>
            }
          />

          <Route
            path="/faqs"
            element={
              <>
                <Navbar />
                <FAQsPage />
                <Footer />
              </>
            }
          />

          <Route
            path="/editor"
            element={
              <>
                <Navbar />
                <Editor />
              </>
            }
          />

          <Route
            path="/essay/:id"
            element={
              <>
                <Navbar />
                <EssayPage />
                <Footer />
              </>
            }
          />

          {/* Compare page 不加 Navbar / Footer */}
          <Route 
            path="/compare/:id" 
            element={
              <>
                <ComparePage />
                <Footer />
              </>
            } 
          />

          {/* How it works page 不加 Navbar / Footer */}
          <Route 
            path="/how-it-works" 
            element={
              <>
                <Navbar />
                <HowItWorks />

              </>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;