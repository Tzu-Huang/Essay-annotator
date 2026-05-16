/**
 * Main Application Component
 *
 * App.jsx controls the main routing of the application.
 * 網址 = 指令，App.jsx = 導航員
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import SignInModal from "./components/SignInModal";
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
  const [showSignInModal, setShowSignInModal] = useState(false);

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar onOpenSignIn={() => setShowSignInModal(true)} />
                <Home onOpenSignIn={() => setShowSignInModal(true)} />
                <Footer />
              </>
            }
          />

          <Route
            path="/login"
            element={
              <>
                <Navbar onOpenSignIn={() => setShowSignInModal(true)} />
                <Login />
                <Footer />
              </>
            }
          />

          <Route
            path="/faqs"
            element={
              <>
                <Navbar onOpenSignIn={() => setShowSignInModal(true)} />
                <FAQsPage />
                <Footer />
              </>
            }
          />

          <Route
            path="/editor"
            element={
              <>
                <Navbar onOpenSignIn={() => setShowSignInModal(true)} />
                <Editor />
              </>
            }
          />

          <Route
            path="/essay/:id"
            element={
              <>
                <Navbar onOpenSignIn={() => setShowSignInModal(true)} />
                <EssayPage />
                <Footer />
              </>
            }
          />

          {/* Compare page 不加 Navbar / Footer */}
          <Route path="/compare/:id" element={<ComparePage />} />

          {/* How it works page 不加 Navbar / Footer */}
          <Route 
            path="/how-it-works" 
            element={
              <>
                <Navbar onOpenSignIn={() => setShowSignInModal(true)} />
                <HowItWorks />

              </>
            }
          />
        </Routes>
        <SignInModal
          isOpen={showSignInModal}
          onClose={() => setShowSignInModal(false)}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
