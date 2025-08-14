// frontend/src/components/SearchableSelect.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaChevronDown, FaTimes } from "react-icons/fa";

const SearchableSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);
  
  // Clear search term when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
    }
  }, [isOpen]);

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };
  
  const handleClear = (e) => {
    e.stopPropagation(); // Prevent the dropdown from opening
    onChange(options[0] || ""); // Reset to the first option, typically "All"
  };

  return (
    <div className="relative w-full md:w-auto" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full min-w-[200px] px-3 py-2 bg-primary border border-border-color rounded-md text-text-secondary focus:ring-2 focus:ring-accent focus:outline-none"
      >
        <span className={value && value !== "All" ? "text-text-primary" : ""}>
          {value || placeholder}
        </span>
        <div className="flex items-center">
            {value && value !== "All" && (
                <FaTimes onClick={handleClear} className="mr-2 text-text-muted hover:text-text-primary"/>
            )}
            <motion.div animate={{ rotate: isOpen ? 180 : 0 }}>
              <FaChevronDown />
            </motion.div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-10 w-full mt-2 bg-secondary border border-border-color rounded-md shadow-lg"
          >
            <div className="p-2">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </div>
            </div>
            <ul className="max-h-60 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <li
                    key={option}
                    onClick={() => handleSelect(option)}
                    className="px-3 py-2 text-sm text-text-primary rounded-md cursor-pointer hover:bg-tertiary"
                  >
                    {option}
                  </li>
                ))
              ) : (
                <li className="px-3 py-2 text-sm text-text-secondary text-center">
                  No results found
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchableSelect;