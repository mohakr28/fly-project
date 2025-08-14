// frontend/src/pages/EventReviewDashboard.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import axios from "axios";
import EventReviewCard from "../components/EventReviewCard";
import { FaClipboardCheck } from "react-icons/fa";
import Header from "../components/Header";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll"; // ✅ 1. استيراد الخطاف

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
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  
  const loaderRef = useRef(null); // ✅ 2. Ref لعنصر التحميل

  const fetchPendingEvents = useCallback(async (page = 1, isLoadMore = false) => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };

    try {
      const params = new URLSearchParams({ page, limit: 9 });
      const response = await axios.get(`${API_URL}/api/events/pending?${params.toString()}`, config);
      
      if (isLoadMore) {
        setPendingEvents(prevEvents => [...prevEvents, ...response.data.events]);
      } else {
        setPendingEvents(response.data.events);
      }

      setPagination({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
      });
    } catch (error) {
      console.error("Error fetching pending events:", error);
      if (error.response?.status === 401) navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchPendingEvents(1, false);
  }, [fetchPendingEvents]);

  const hasNextPage = pagination.currentPage < pagination.totalPages;
  const loadMore = useCallback(() => {
      fetchPendingEvents(pagination.currentPage + 1, true);
  }, [pagination.currentPage, fetchPendingEvents]);

  useInfiniteScroll(loaderRef, loading, hasNextPage, loadMore); // ✅ 3. استخدام الخطاف

  const handleAction = async (eventId, status, isExtraordinary) => {
    const token = localStorage.getItem("token");
    const config = { headers: { "x-auth-token": token } };
    try {
      await axios.put(
        `${API_URL}/api/events/${eventId}/update-status`,
        { status, isExtraordinary },
        config
      );
      // ✅ 4. تحديث القائمة بإعادة تحميل الصفحة الأولى
      fetchPendingEvents(1, false);
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

      {pendingEvents.length === 0 && !loading ? (
        <NoResults />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pendingEvents.map((event) => (
              <EventReviewCard
                key={event._id}
                event={event}
                onAction={handleAction}
              />
            ))}
          </div>
          {/* ✅ 5. عرض مؤشر التحميل والنهاية */}
          <div ref={loaderRef} className="h-10 flex items-center justify-center text-text-secondary">
            {loading && <p>Loading more events...</p>}
            {!loading && !hasNextPage && pendingEvents.length > 0 && <p>You have reached the end.</p>}
          </div>
        </>
      )}
    </div>
  );
};

export default EventReviewDashboard;