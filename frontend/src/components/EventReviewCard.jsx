// frontend/src/components/EventReviewCard.jsx
import React, { useState } from "react";
import { format } from "date-fns";

const EventReviewCard = ({ event, onAction }) => {
  const [showApprovalOptions, setShowApprovalOptions] = useState(false);

  const handleApproveClick = () => {
    setShowApprovalOptions(true);
  };

  const handleDecision = (isExtraordinary) => {
    onAction(event._id, "approved", isExtraordinary);
  };

  const handleReject = () => {
    onAction(event._id, "rejected", null);
  };

  return (
    <div className="event-review-card">
      <h3>{event.summary}</h3>
      <div className="event-meta">
        <span>
          <strong>Entity:</strong> {event.affectedEntity}
        </span>
        <span>
          <strong>Date:</strong>{" "}
          {format(new Date(event.startDate), "dd MMM yyyy")}
        </span>
      </div>
      <a
        href={event.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="event-source-link"
      >
        Read Source Article
      </a>
      <div className="event-actions">
        {showApprovalOptions ? (
          <div className="approval-options">
            <p>Is this an Extraordinary Circumstance?</p>
            <button
              className="action-btn approve-btn"
              onClick={() => handleDecision(true)}
            >
              Yes (e.g., ATC Strike, Security)
            </button>
            <button
              className="action-btn approve-btn"
              onClick={() => handleDecision(false)}
            >
              No (e.g., Airline Staff Strike)
            </button>
          </div>
        ) : (
          <>
            <button
              className="action-btn approve-btn"
              onClick={handleApproveClick}
            >
              Approve
            </button>
            <button className="action-btn reject-btn" onClick={handleReject}>
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EventReviewCard;
