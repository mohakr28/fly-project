// frontend/src/components/Header.jsx
import React from "react";
import { FaBars } from "react-icons/fa";
import { ThemeToggle } from "./ThemeToggle";

const Header = ({ title, toggleSidebar, theme, toggleTheme }) => {
  return (
    <header className="main-header">
      <div className="header-left">
        {/* زر القائمة للجوال */}
        <button className="mobile-nav-toggle" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <h1>{title}</h1>
      </div>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
};

export default Header;
