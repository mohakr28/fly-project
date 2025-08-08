// frontend/src/components/Header.jsx
import React from "react";
import { FaBars } from "react-icons/fa";
import { ThemeToggle } from "./ThemeToggle";

const Header = ({ title, toggleSidebar, theme, toggleTheme }) => {
  return (
    // الهيدر الرئيسي مع تنسيقات Tailwind
    <header className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        {/* زر القائمة للجوال - يظهر فقط في شاشات أصغر من md */}
        <button
          className="md:hidden text-text-primary text-xl p-2 rounded-lg hover:bg-tertiary"
          onClick={toggleSidebar}
        >
          <FaBars />
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-text-primary">
          {title}
        </h1>
      </div>
      <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
    </header>
  );
};

export default Header;
