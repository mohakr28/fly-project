import React from "react";
import { FaSun, FaMoon } from "react-icons/fa";

export const ThemeToggle = ({ theme, toggleTheme }) => {
  return (
    <button
      // ✅ تم استبدال الكلاس القديم بكلاسات Tailwind لتصميم الزر
      className="p-2 rounded-full text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors duration-200"
      onClick={toggleTheme}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? <FaMoon size={18} /> : <FaSun size={18} />}
    </button>
  );
};
