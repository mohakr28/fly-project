// frontend/src/components/EventReviewCard.jsx
import React, { useState } from "react";
import { format } from "date-fns";
import { FaCheck, FaTimes, FaExternalLinkAlt } from "react-icons/fa";

const EventReviewCard = ({ event, onAction }) => {
  const [showApprovalOptions, setShowApprovalOptions] = useState(false);

  const handleApproveClick = () => setShowApprovalOptions(true);
  const handleDecision = (isExtraordinary) =>
    onAction(event._id, "approved", isExtraordinary);
  const handleReject = () => onAction(event._id, "rejected", null);

  return (
    <div className="bg-secondary rounded-lg shadow-sm flex flex-col border border-border-color">
      <div className="p-4 flex-grow">
        <h3 className="font-bold text-text-primary mb-2 leading-tight">
          {event.summary}
        </h3>
        <div className="flex justify-between text-xs text-text-secondary mb-3">
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
          className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"
        >
          Read Source Article <FaExternalLinkAlt />
        </a>
      </div>

      <div className="p-3 bg-primary border-t border-border-color mt-auto">
        {showApprovalOptions ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-text-primary text-center mb-1">
              Is this an Extraordinary Circumstance?
            </p>
            <button
              className="w-full px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
              onClick={() => handleDecision(true)}
            >
              Yes (e.g., ATC Strike, Security)
            </button>
            <button
              className="w-full px-4 py-2 text-sm font-bold text-white bg-yellow-600 rounded-md hover:bg-yellow-700 transition"
              onClick={() => handleDecision(false)}
            >
              No (e.g., Airline Staff Strike)
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-green-600 rounded-md hover:bg-green-700 transition"
              onClick={handleApproveClick}
            >
              <FaCheck /> Approve
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-md hover:bg-red-700 transition"
              onClick={handleReject}
            >
              <FaTimes /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventReviewCard;
