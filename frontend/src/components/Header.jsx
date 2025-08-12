// frontend/src/components/Header.jsx
import React from "react";
import { FaBars } from "react-icons/fa";
import { ThemeToggle } from "./ThemeToggle";

const Header = ({ title, toggleSidebar, theme, toggleTheme, actions }) => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 self-start">
        <button
          className="md:hidden text-text-primary text-xl p-2 rounded-lg hover:bg-tertiary"
          onClick={toggleSidebar}
        >
          <FaBars />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary whitespace-nowrap">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-4 w-full md:w-auto">
        {/* Actions slot */}
        {actions}
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </header>
  );
};

export default Header;