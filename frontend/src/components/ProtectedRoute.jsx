// frontend/src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  // --- إدارة حالة الشريط الجانبي ---
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 992
  );
  const toggleSidebar = () => {
    setSidebarCollapsed((prev) => !prev);
  };

  // --- إدارة حالة السمة (Theme) ---
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // تأثير لمراقبة تغيير حجم الشاشة
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 992px)");
    const handleResize = (e) => {
      setSidebarCollapsed(!e.matches);
    };
    mediaQuery.addEventListener("change", handleResize);
    return () => mediaQuery.removeEventListener("change", handleResize);
  }, []);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // تمرير جميع الحالات والدوال اللازمة عبر context
  const contextValue = { toggleSidebar, theme, toggleTheme };

  return (
    <div
      className={`app-layout ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}
    >
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />
      <main className="main-content">
        <Outlet context={contextValue} />
      </main>
      {!isSidebarCollapsed && (
        <div className="overlay" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default ProtectedRoute;
