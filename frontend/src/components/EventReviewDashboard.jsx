// frontend/src/components/EventReviewDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import EventReviewCard from "./EventReviewCard";
import { FaSearch } from "react-icons/fa";
import Header from "./Header"; // <-- استيراد الهيدر الجديد

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const NoResults = () => (
  <div className="no-results-pro">
    <FaSearch />
    <h2>All Clear!</h2>
    <p>There are no pending events to review at this time.</p>
  </div>
);

const EventReviewDashboard = () => {
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  // الحصول على السياق
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();

  const fetchPendingEvents = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };

    try {
      const response = await axios.get(`${API_URL}/api/events/pending`, config);
      setPendingEvents(response.data);
    } catch (error) {
      console.error("Error fetching pending events:", error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPendingEvents();
  }, [fetchPendingEvents]);

  const handleAction = async (eventId, status, isExtraordinary) => {
    const token = localStorage.getItem("token");
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };

    try {
      await axios.put(
        `${API_URL}/api/events/${eventId}/update-status`,
        {
          status,
          isExtraordinary,
        },
        config
      );
      setPendingEvents((prevEvents) =>
        prevEvents.filter((event) => event._id !== eventId)
      );
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      if (error.response && error.response.status === 401) {
        navigate("/login");
      } else {
        alert("Failed to update event status. Please try again.");
      }
    }
  };

  return (
    <div className="dashboard-container">
      <Header
        title="Event Review"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {loading ? (
        <div className="event-review-grid">Loading events...</div>
      ) : pendingEvents.length === 0 ? (
        <NoResults />
      ) : (
        <div className="event-review-grid">
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
