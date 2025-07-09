import React from "react";

const Header = () => {
  return (
    <header className="main-header">
      <h1>Flight Status Dashboard</h1>
      <p style={{ color: "var(--text-secondary)" }}>
        Real-time tracking of delayed and cancelled flights
      </p>
    </header>
  );
};

export default Header;
