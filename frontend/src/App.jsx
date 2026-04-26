/**
 * Main Application Component
 *
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
import Home from "./pages/Home";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import EssayPage from "./pages/EssayPage";
import ComparePage from "./pages/ComparePage";
import FAQsPage from "./pages/FAQsPage";
import ExampleEssayPage from "./pages/ExampleEssayPage";
import HowItWorks from "./pages/HowItWorks";
import "./styles/global.css";
import "./styles/components.css";
import "./styles/background.css";

function App() {
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
      </div>
    </BrowserRouter>
  );
}

export default App;