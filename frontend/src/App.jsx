// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlightDashboard from "./components/FlightDashboard";
import EventReviewDashboard from "./components/EventReviewDashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import ProtectedRoute from "./components/ProtectedRoute";
import LegalManagement from "./pages/LegalManagement";
import AirportManagement from "./pages/AirportManagement"; // ✅ استيراد الصفحة الجديدة

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<FlightDashboard />} />
          <Route path="/events" element={<EventReviewDashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/legal" element={<LegalManagement />} />
          <Route path="/airports" element={<AirportManagement />} /> {/* ✅ إضافة المسار الجديد */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;