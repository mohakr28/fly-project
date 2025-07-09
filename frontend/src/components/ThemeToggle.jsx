import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <FaMoon /> : <FaSun />}
    </button>
  );
};
