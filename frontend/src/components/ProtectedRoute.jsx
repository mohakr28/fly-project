// frontend/src/components/ProtectedRoute.jsx
import React, { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const ProtectedRoute = () => {
  const token = localStorage.getItem("token");

  const [isSidebarCollapsed, setSidebarCollapsed] = useState(
    window.innerWidth < 768
  );
  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  // ... (بقية الكود بدون تغيير)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const contextValue = { toggleSidebar, theme, toggleTheme };

  return (
    // ✅ لا حاجة لكلاسات الألوان هنا، لأنها مطبقة على body في index.css
    <div className="relative min-h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

      <main
        className={`p-6 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        }`}
      >
        <Outlet context={contextValue} />
      </main>

      {!isSidebarCollapsed && window.innerWidth < 768 && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
    </div>
  );
};

export default ProtectedRoute;
