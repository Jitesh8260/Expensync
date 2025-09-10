import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const defaultTheme = prefersDark ? "dark" : "light";

    // ✅ Pehli hi render pe localStorage me dal do
    localStorage.setItem("theme", defaultTheme);

    return defaultTheme;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme); // for CSS variables
    document.documentElement.classList.toggle("dark", theme === "dark"); // for Tailwind
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);


