// frontend/src/components/Modal.jsx
import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

const Modal = ({ isOpen, onClose, title, children }) => {
  // للتحكم في إغلاق النافذة عند الضغط على مفتاح "Escape"
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  // لمنع تمرير الصفحة الخلفية عند فتح النافذة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          // الخلفية المعتمة
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
          animate={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          exit={{ backgroundColor: "rgba(0, 0, 0, 0)" }}
          onClick={onClose}
        >
          <motion.div
            // محتوى النافذة المنبثقة
            className="relative w-full max-w-3xl max-h-[90vh] bg-secondary rounded-xl shadow-2xl flex flex-col"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()} // لمنع إغلاق النافذة عند الضغط على المحتوى
          >
            {/* رأس النافذة */}
            <header className="flex items-center justify-between p-5 border-b border-border-color flex-shrink-0">
              <h2 className="text-xl font-bold text-text-primary">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-text-secondary hover:bg-tertiary hover:text-text-primary transition-colors"
                title="Close"
              >
                <FaTimes size={20} />
              </button>
            </header>

            {/* محتوى النموذج (يتم تمريره كـ children) */}
            <div className="overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
