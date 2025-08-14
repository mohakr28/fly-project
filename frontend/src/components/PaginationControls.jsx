// frontend/src/components/PaginationControls.jsx
import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PaginationControls = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null; // لا تظهر أي شيء إذا كانت هناك صفحة واحدة فقط
  }

  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-text-primary font-semibold text-sm rounded-md border border-border-color disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tertiary"
      >
        <FaChevronLeft />
        Previous
      </button>

      <span className="text-sm font-medium text-text-secondary">
        Page {currentPage} of {totalPages}
      </span>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-2 px-4 py-2 bg-secondary text-text-primary font-semibold text-sm rounded-md border border-border-color disabled:opacity-50 disabled:cursor-not-allowed hover:bg-tertiary"
      >
        Next
        <FaChevronRight />
      </button>
    </div>
  );
};

export default PaginationControls;