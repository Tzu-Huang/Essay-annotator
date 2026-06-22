/**
 * Main Application Component
 *
<<<<<<< HEAD
 * This component sets up the overall structure of the app,
 * including routing and layout.
 *
 * It uses React Router to define different pages based on the URL,
 * and renders the corresponding components (Home, Login, Editor, EssayPage).
 *
 * controls navigation and determines what page is displayed.
 * 網址 = 指令   App.jsx = 導航員
 */

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
=======
 * App.jsx controls the main routing of the application.
 * 網址 = 指令，App.jsx = 導航員
 */

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import SignInModal from "./components/SignInModal";
import Footer from "./components/Footer/Footer";

>>>>>>> feature/Footer
import Home from "./pages/Home";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import EssayPage from "./pages/EssayPage";
import ComparePage from "./pages/ComparePage";
import FAQsPage from "./pages/FAQsPage";
<<<<<<< HEAD
import ExampleEssayPage from "./pages/ExampleEssayPage";
import HowItWorks from "./pages/HowItWorks";
=======
import HowItWorks from "./pages/HowItWorks";

>>>>>>> feature/Footer
import "./styles/global.css";
import "./styles/components.css";
import "./styles/background.css";

function App() {
<<<<<<< HEAD
  const bg = "bg-world";

  return (
    <BrowserRouter>
      <div className={`background-image ${bg}`}>
        <Routes>
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/faqs" element={<><Navbar /><FAQsPage /></>} />

          {/* 
          當網址符合 /editor
            → Router render <Editor />
            → React 呼叫 Editor()
            → return JSX
            → 畫面出現*/}
          <Route path="/editor" element={<><Navbar /><Editor /></>} />

          <Route path="/essay/:id" element={<EssayPage />} />
          <Route path="/compare/:id" element={<><ComparePage /></>} />
          <Route path="/example/:id" element={<ExampleEssayPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
        </Routes>
=======
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
>>>>>>> feature/Footer
      </div>
    </BrowserRouter>
  );
}

<<<<<<< HEAD
export default App;
=======
export default App;
>>>>>>> feature/Footer
