/**
 * Main Application Component
 *
 * App.jsx controls the main routing of the application.
 * 網址 = 指令，App.jsx = 導航員
 */

import { useState } from "react";
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
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInPostLogout, setSignInPostLogout] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  function openSignIn() {
    setSignInPostLogout(false);
    setModalKey((k) => k + 1);
    setShowSignInModal(true);
  }

  function openSignInAfterLogout() {
    setSignInPostLogout(true);
    setModalKey((k) => k + 1);
    setShowSignInModal(true);
  }

  function closeSignIn() {
    setShowSignInModal(false);
    setSignInPostLogout(false);
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar onOpenSignIn={openSignIn} onLoggedOut={openSignInAfterLogout} />
                <Home onOpenSignIn={openSignIn} />
                <Footer />
              </>
            }
          />

          <Route
            path="/login"
            element={
              <>
                <Navbar onOpenSignIn={openSignIn} onLoggedOut={openSignInAfterLogout} />
                <Login />
                <Footer />
              </>
            }
          />

          <Route
            path="/faqs"
            element={
              <>
                <Navbar onOpenSignIn={openSignIn} onLoggedOut={openSignInAfterLogout} />
                <FAQsPage />
                <Footer />
              </>
            }
          />

          <Route
            path="/editor"
            element={
              <>
                <Navbar onOpenSignIn={openSignIn} onLoggedOut={openSignInAfterLogout} />
                <Editor />
              </>
            }
          />

          <Route
            path="/essay/:id"
            element={
              <>
                <Navbar onOpenSignIn={openSignIn} onLoggedOut={openSignInAfterLogout} />
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
                <Navbar onOpenSignIn={openSignIn} onLoggedOut={openSignInAfterLogout} />
                <HowItWorks />
              </>
            }
          />
        </Routes>
        <SignInModal
          key={modalKey}
          isOpen={showSignInModal}
          onClose={closeSignIn}
          postLogout={signInPostLogout}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;
