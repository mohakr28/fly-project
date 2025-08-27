// frontend/src/App.jsx
import React, { Suspense, lazy } from "react"; // ✅ 1. استيراد Suspense و lazy
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

// ✅ 2. تعريف المكونات باستخدام React.lazy
const FlightDashboard = lazy(() => import("./pages/FlightDashboard"));
const EventReviewDashboard = lazy(() => import("./components/EventReviewDashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const LegalManagement = lazy(() => import("./pages/LegalManagement"));
const AirportManagement = lazy(() => import("./pages/AirportManagement"));

// مكون بسيط لعرض مؤشر التحميل
const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="text-xl font-semibold text-text-secondary">Loading...</div>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* ✅ 3. تغليف المسارات المحمية بـ Suspense */}
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <FlightDashboard />
              </Suspense>
            }
          />
          <Route
            path="/events"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <EventReviewDashboard />
              </Suspense>
            }
          />
          <Route
            path="/profile"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Profile />
              </Suspense>
            }
          />
          <Route
            path="/legal"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <LegalManagement />
              </Suspense>
            }
          />
          <Route
            path="/airports"
            element={
              <Suspense fallback={<LoadingFallback />}>
                <AirportManagement />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;