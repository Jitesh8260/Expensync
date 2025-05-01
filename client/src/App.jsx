import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext"; // 👈 Import ThemeProvider

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddTransaction from "./components/AddTransaction";
import Transactions from "./components/Transactions";
import Budget from "./components/Budget";
import Charts from "./components/Charts";
import Landing from "./pages/Landing";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
        <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/home" element={<Home />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/charts" element={<Charts />} />
          <Route path="/add" element={<AddTransaction />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
