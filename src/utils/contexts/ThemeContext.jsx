import { createContext, useEffect, useState } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    const darkMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const mode = darkMediaQuery.matches ? "dark" : "light";
    setTheme(mode);
    document.querySelector("body").className = mode;
    document.documentElement.style.setProperty("color-scheme", mode);
    darkMediaQuery.addEventListener("change", (e) => {
      setTheme(e.matches ? "dark" : "light");
    });
  }, []);

  const toggleTheme = () => {
    const mode = theme === "dark" ? "light" : "dark";
    document.querySelector("body").className = mode;
    document.documentElement.style.setProperty("color-scheme", mode);
    setTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
