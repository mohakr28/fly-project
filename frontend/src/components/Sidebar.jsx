// frontend/src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaSignOutAlt,
  FaPlaneDeparture,
  FaUserCog,
  FaGavel,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

// مكون NavItem المعاد استخدامه
const NavItem = ({ to, title, icon, isCollapsed }) => (
  <NavLink
    to={to}
    className={
      ({ isActive }) =>
        `flex items-center gap-4 p-3 rounded-lg font-semibold transition-colors duration-200 ${
          isCollapsed ? "justify-center" : ""
        }
       ${
         isActive
           ? "bg-accent-light text-accent" // ✅ سيتم التبديل تلقائيًا
           : "text-text-secondary hover:bg-tertiary hover:text-text-primary"
       }` // ✅ سيتم التبديل تلقائيًا
    }
    title={title}
  >
    {icon}
    <span
      className={`${
        isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
      } transition-all duration-200`}
    >
      {title}
    </span>
  </NavLink>
);

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out
                 bg-secondary border-r border-border-color // ✅ استخدام الأسماء العامة
                 ${isCollapsed ? "w-20" : "w-64"}
                 md:translate-x-0 
                 ${
                   isCollapsed && window.innerWidth < 768
                     ? "-translate-x-full"
                     : "translate-x-0"
                 }`}
    >
      {/* Header */}
      <div
        className={`flex items-center gap-3 px-2 pb-5 mb-5 border-b border-border-color ${
          isCollapsed ? "justify-center" : ""
        }`}
      >
        <FaPlaneDeparture className="text-accent text-2xl flex-shrink-0" />
        <h2
          className={`text-xl font-bold whitespace-nowrap text-text-primary transition-opacity duration-200 ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          }`}
        >
          FlightDeck
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-grow">
        <NavItem
          to="/"
          title="Flight Monitor"
          icon={<FaTachometerAlt size={20} />}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/events"
          title="Event Review"
          icon={<FaCalendarCheck size={20} />}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/legal"
          title="Legal Mgmt"
          icon={<FaGavel size={20} />}
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2">
        <NavItem
          to="/profile"
          title="Settings"
          icon={<FaUserCog size={20} />}
          isCollapsed={isCollapsed}
        />
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 p-3 rounded-lg font-semibold text-text-secondary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title="Logout"
        >
          <FaSignOutAlt size={20} />
          <span
            className={`${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            } transition-all duration-200`}
          >
            Logout
          </span>
        </button>

        {/* Desktop Collapse Button */}
        <button
          onClick={toggleSidebar}
          className={`hidden md:flex items-center gap-4 p-3 rounded-lg font-semibold text-text-secondary hover:bg-tertiary transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          {isCollapsed ? (
            <FaAngleDoubleRight size={20} />
          ) : (
            <FaAngleDoubleLeft size={20} />
          )}
          <span
            className={`${
              isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
            } transition-all duration-200`}
          >
            {isCollapsed ? "Expand" : "Collapse"}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
