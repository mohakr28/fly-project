// frontend/src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaSignOutAlt,
  FaPlaneDeparture,
  FaUserCog,
  FaGavel,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaMapMarkedAlt,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NavItem = ({ to, title, icon, isCollapsed, notificationCount }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `relative flex items-center gap-4 p-3 rounded-lg font-semibold transition-colors duration-200 ${
        isCollapsed ? "justify-center" : ""
      }
       ${
         isActive
           ? "bg-accent-light text-accent"
           : "text-text-secondary hover:bg-tertiary hover:text-text-primary"
       }`
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
    {notificationCount > 0 && (
      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
        {notificationCount}
      </span>
    )}
  </NavLink>
);

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();
  const [pendingEventsCount, setPendingEventsCount] = useState(0);

  // حجم الأيقونات
  const iconSize = isCollapsed ? 32 : 24;

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const config = { headers: { "x-auth-token": token } };
        const res = await axios.get(`${API_URL}/api/events/pending-count`, config);
        setPendingEventsCount(res.data.count);
      } catch (error) {
        console.error("Failed to fetch notification counts", error);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside
      className={`fixed top-0 left-0 h-screen flex flex-col p-4 z-50 transition-transform duration-300 ease-in-out
                 bg-secondary border-r border-border-color
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
        <FaPlaneDeparture className="text-accent flex-shrink-0" size={iconSize} />
        <h2
          className={`text-xl font-bold whitespace-nowrap text-text-primary transition-opacity duration-200 ${
            isCollapsed ? "opacity-0 w-0" : "opacity-100"
          }`}
        >
          JURAI
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2 flex-grow">
        <NavItem
          to="/"
          title="Flight Monitor"
          icon={<FaTachometerAlt size={iconSize} />}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/events"
          title="Event Review"
          icon={<FaCalendarCheck size={iconSize} />}
          isCollapsed={isCollapsed}
          notificationCount={pendingEventsCount}
        />
        <NavItem
          to="/legal"
          title="Legal Mgmt"
          icon={<FaGavel size={iconSize} />}
          isCollapsed={isCollapsed}
        />
        <NavItem
          to="/airports"
          title="Monitored Airports"
          icon={<FaMapMarkedAlt size={iconSize} />}
          isCollapsed={isCollapsed}
        />
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2">
        <NavItem
          to="/profile"
          title="Settings"
          icon={<FaUserCog size={iconSize} />}
          isCollapsed={isCollapsed}
        />
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 p-3 rounded-lg font-semibold text-text-secondary hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-colors duration-200 ${
            isCollapsed ? "justify-center" : ""
          }`}
          title="Logout"
        >
          <FaSignOutAlt size={iconSize} />
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
            <FaAngleDoubleRight size={iconSize - 4} />
          ) : (
            <FaAngleDoubleLeft size={iconSize - 4} />
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
