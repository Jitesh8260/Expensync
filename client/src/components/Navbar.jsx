import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // 👈 Import useTheme

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  
  // Check if the user is logged in (token exists)
  const isLoggedIn = localStorage.getItem("token");

  const linkClass = (path) =>
    `${location.pathname === path
      ? "text-[#00B8F4] font-semibold"
      : "text-[#1A202C] dark:text-gray-300 hover:text-[#00B8F4]"
    } transition`;

  return (
    <nav className="bg-white dark:bg-slate-900 shadow-md w-full">
      <div className="max-w-7xl mx-auto px-6 py-2 flex justify-between items-center">
        <Link
          to="/home"
          className="text-xl font-extrabold tracking-tight flex items-center bg-gradient-to-r from-[#001f3f] via-cyan-400 to-cyan-200 bg-clip-text text-transparent"
        >
          <img src="/animations/logo1.png" alt="" className="h-12" /> Expensync
        </Link>

        <div className="flex items-center gap-4 md:gap-6">
          <div className={`md:flex md:items-center md:justify-center ${isOpen ? "block" : "hidden"} md:block`}>
            <ul className="flex flex-col md:flex-row gap-4 md:gap-8 px-4 py-4 md:py-2 text-base font-medium">
              <li><Link to="/home" className={linkClass("/home")}>Home</Link></li>
              <li><Link to="/transactions" className={linkClass("/transactions")}>Transactions</Link></li>
              <li><Link to="/budget" className={linkClass("/budget")}>Budget</Link></li>
              <li><Link to="/charts" className={linkClass("/charts")}>Charts</Link></li>

              {/* Conditionally render Login and Signup based on authentication */}
              {!isLoggedIn ? (
                <>
                  <li><Link to="/login" className={linkClass("/login")}>Login</Link></li>
                  <li><Link to="/signup" className={linkClass("/signup")}>SignUp</Link></li>
                </>
              ) : (
                // Optionally, you can add a Logout button here
                <li>
                  <button
                    onClick={() => {
                      localStorage.removeItem("token");
                      window.location.href = "/login"; // Redirect to login after logout
                    }}
                    className={linkClass("/login")}
                  >
                    Logout
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-xl px-3 py-1 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1A365D] transition"
            title="Toggle Theme"
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-2xl text-[#1A202C] dark:text-gray-300"
          >
            ☰
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
