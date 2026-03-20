import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Editor from "./pages/Editor";
import "./App.css";   

function App() {

  const bg = "bg-world"; 
  // 改成 bg-us 就會換圖

  return (
    <BrowserRouter>

      <div className={`background-image ${bg}`}>

        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/editor" element={<Editor />} />
        </Routes>

      </div>

    </BrowserRouter>
  );
}
export default App;