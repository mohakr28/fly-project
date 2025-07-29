// frontend/src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FlightDashboard from "./components/FlightDashboard";
import EventReviewDashboard from "./components/EventReviewDashboard";
import Login from "./pages/Login";
import Profile from "./pages/Profile"; // <-- استيراد المكون الجديد
import ProtectedRoute from "./components/ProtectedRoute";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        {/* <Route path="/register" element={<Register />} /> */}

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<FlightDashboard />} />
          <Route path="/events" element={<EventReviewDashboard />} />
          <Route path="/profile" element={<Profile />} />{" "}
          {/* <-- إضافة المسار الجديد */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
