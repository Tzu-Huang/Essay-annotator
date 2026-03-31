import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import EssayPage from "./pages/EssayPage";
import "./App.css";   

function App() {

  const bg = "bg-world"; 

  return (
    <BrowserRouter>

      <div className={`background-image ${bg}`}>

        <Routes>
          <Route path="/" element={<><Navbar /><Home /></>} />
          <Route path="/login" element={<><Navbar /><Login /></>} />
          <Route path="/editor" element={<><Navbar /><Editor /></>} />
          <Route path="/essay/:id" element={<EssayPage />} />

        </Routes>

      </div>

    </BrowserRouter>
  );
}

export default App;