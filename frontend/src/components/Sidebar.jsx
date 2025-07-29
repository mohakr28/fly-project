// frontend/src/components/Sidebar.jsx
import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaTachometerAlt,
  FaCalendarCheck,
  FaSignOutAlt,
  FaPlaneDeparture,
  FaUserCog,
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
} from "react-icons/fa";

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <aside className={`sidebar ${isCollapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <FaPlaneDeparture />
        <h2>FlightDeck</h2>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" className="nav-item" title="Flight Monitor">
          <FaTachometerAlt />
          <span>Flight Monitor</span>
        </NavLink>
        <NavLink to="/events" className="nav-item" title="Event Review">
          <FaCalendarCheck />
          <span>Event Review</span>
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <NavLink to="/profile" className="nav-item" title="Settings">
          <FaUserCog />
          <span>Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="nav-item logout-btn"
          title="Logout"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
        {/* زر طي/عرض الشريط الجانبي (لشاشات سطح المكتب فقط) */}
        <button onClick={toggleSidebar} className="nav-item collapse-btn">
          {isCollapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
          <span>{isCollapsed ? "Expand" : "Collapse"}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
