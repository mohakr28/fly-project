// frontend/src/components/EventReviewDashboard.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EventReviewCard from "./EventReviewCard";
import { FaSearch } from "react-icons/fa";

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

  const fetchPendingEvents = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/events/pending`);
      setPendingEvents(response.data);
    } catch (error) {
      console.error("Error fetching pending events:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingEvents();
  }, [fetchPendingEvents]);

  const handleAction = async (eventId, status, isExtraordinary) => {
    try {
      await axios.put(`${API_URL}/api/events/${eventId}/update-status`, {
        status,
        isExtraordinary,
      });
      // Remove the event from the list for immediate UI feedback
      setPendingEvents((prevEvents) =>
        prevEvents.filter((event) => event._id !== eventId)
      );
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      alert("Failed to update event status. Please try again.");
    }
  };

  if (loading) {
    return <div className="event-review-grid">Loading events...</div>;
  }

  if (pendingEvents.length === 0) {
    return <NoResults />;
  }

  return (
    <div className="event-review-grid">
      {pendingEvents.map((event) => (
        <EventReviewCard
          key={event._id}
          event={event}
          onAction={handleAction}
        />
      ))}
    </div>
  );
};

export default EventReviewDashboard;
