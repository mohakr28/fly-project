// frontend/src/components/EventReviewDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import EventReviewCard from "./EventReviewCard";
import { FaClipboardCheck } from "react-icons/fa";
import Header from "./Header";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NoResults = () => (
  <div className="flex flex-col items-center justify-center text-center p-12 bg-secondary rounded-lg">
    <FaClipboardCheck className="text-5xl text-green-500 mb-4" />
    <h2 className="text-xl font-bold text-text-primary">All Clear!</h2>
    <p className="mt-1 text-text-secondary">
      There are no pending events to review at this time.
    </p>
  </div>
);

const EventReviewDashboard = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();

  const fetchPendingEvents = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };

    try {
      const response = await axios.get(`${API_URL}/api/events/pending`, config);
      setPendingEvents(response.data);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPendingEvents();
  }, [fetchPendingEvents]);

  const handleAction = async (eventId, status, isExtraordinary) => {
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };
    try {
      await axios.put(
        `${API_URL}/api/events/${eventId}/update-status`,
        { status, isExtraordinary },
        config
      );
      setPendingEvents((prev) => prev.filter((event) => event._id !== eventId));
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      alert("Failed to update event status. Please try again.");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Header
        title="Event Review"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {loading ? (
        <p className="text-center text-text-secondary">Loading events...</p>
      ) : pendingEvents.length === 0 ? (
        <NoResults />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingEvents.map((event) => (
            <EventReviewCard
              key={event._id}
              event={event}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default EventReviewDashboard;
