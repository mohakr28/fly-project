// frontend/src/pages/LegalManagement.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";
// ✅ 1. استيراد المكون الجديد
import Modal from "../components/Modal";
import { format } from "date-fns";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaExclamationTriangle,
  FaCheckCircle,
  FaSave,
  FaTimes,
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// --- Reusable Components for this page (No changes here) ---

const FormCard = ({ children }) => (
  // تم تبسيط FormCard ليحتوي فقط على المحتوى، لأن العنوان أصبح في رأس النافذة المنبثقة
  <div className="bg-secondary">{children}</div>
);

const FormField = ({ label, name, helpText, children }) => (
  <div>
    <label
      htmlFor={name}
      className="block text-sm font-medium text-text-primary mb-1"
    >
      {label}
    </label>
    {children}
    {helpText && (
      <p className="mt-1.5 text-xs text-text-secondary">{helpText}</p>
    )}
  </div>
);

const initialFormState = {
  _id: null,
  celexId: "",
  documentType: "regulation",
  title: "",
  summary: "",
  publicationDate: "",
  keywords: "",
};

// --- Main Component ---

const LegalManagement = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [documents, setDocuments] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  // ✅ 2. استبدال حالة التحكم بالنموذج
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const token = localStorage.getItem("token");
  const config = { headers: { "x-auth-token": token } };

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/legal/documents`, config);
      setDocuments(res.data);
    } catch (error) {
      console.error("Failed to fetch documents", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // ✅ 3. دالة لإغلاق النافذة وإعادة تعيين الحالات
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDoc(null);
    setFormData(initialFormState);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const dataToSubmit = {
      ...formData,
      keywords: formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
    };

    try {
      if (editingDoc) {
        await axios.put(
          `${API_URL}/api/legal/documents/${editingDoc._id}`,
          dataToSubmit,
          config
        );
      } else {
        await axios.post(
          `${API_URL}/api/legal/documents`,
          dataToSubmit,
          config
        );
      }
      fetchDocuments();
      closeModal(); // إغلاق النافذة بعد النجاح
    } catch (error) {
      alert(error.response?.data?.msg || "An error occurred.");
    }
  };

  const handleEdit = (doc) => {
    setEditingDoc(doc);
    setFormData({
      ...doc,
      publicationDate: format(new Date(doc.publicationDate), "yyyy-MM-dd"),
      keywords: (doc.keywords || []).join(", "),
    });
    setIsModalOpen(true); // فتح النافذة
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      try {
        await axios.delete(`${API_URL}/api/legal/documents/${id}`, config);
        fetchDocuments();
      } catch (error) {
        console.error("Failed to delete document", error);
      }
    }
  };

  const handleMarkReviewed = async (id) => {
    try {
      await axios.put(`${API_URL}/api/legal/mark-reviewed/${id}`, {}, config);
      fetchDocuments();
    } catch (error) {
      console.error("Failed to mark as reviewed", error);
    }
  };

  const openNewForm = () => {
    setEditingDoc(null);
    setFormData(initialFormState);
    setIsModalOpen(true); // فتح النافذة
  };

  const docsToReview = documents.filter((d) => d.needsReview);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-8">
      <Header
        title="Legal Document Management"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* ... (Review section remains the same) ... */}
      {docsToReview.length > 0 && (
        <div className="p-4 bg-yellow-100 dark:bg-yellow-500/20 text-yellow-800 dark:text-yellow-300 rounded-lg">
          <h4 className="font-bold flex items-center gap-2">
            <FaExclamationTriangle /> Documents Need Review
          </h4>
          <p className="text-sm mt-1 mb-3">
            The system detected potential updates for the following documents.
            Please review and then mark as checked.
          </p>
          <ul className="space-y-2">
            {docsToReview.map((doc) => (
              <li
                key={doc._id}
                className="flex justify-between items-center text-sm p-2 bg-secondary rounded-md"
              >
                <span>{doc.title}</span>
                <button
                  className="px-3 py-1 bg-accent text-white font-semibold text-xs rounded-md hover:bg-opacity-90 transition flex items-center gap-1.5"
                  onClick={() => handleMarkReviewed(doc._id)}
                >
                  <FaCheckCircle /> Mark Reviewed
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ 4. زر الإضافة أصبح الآن يفتح النافذة المنبثقة فقط */}
      <button
        onClick={openNewForm}
        className="self-start px-4 py-2 bg-accent text-white font-semibold text-sm rounded-md hover:bg-opacity-90 transition flex items-center gap-2"
      >
        <FaPlus /> Add New Legal Document
      </button>

      {/* ... (Existing Documents table remains the same) ... */}
      <div className="bg-secondary rounded-lg shadow-sm border border-border-color">
        <div className="p-6 border-b border-border-color">
          <h3 className="text-lg font-semibold text-text-primary">
            Existing Documents
          </h3>
          <p className="mt-1 text-sm text-text-secondary">
            A list of all legal documents currently in the system.
          </p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <p className="p-6">Loading documents...</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-primary">
                <tr>
                  <th className="text-left font-semibold text-text-secondary p-3">
                    Title
                  </th>
                  <th className="text-left font-semibold text-text-secondary p-3">
                    Type
                  </th>
                  <th className="text-left font-semibold text-text-secondary p-3">
                    Status
                  </th>
                  <th className="text-left font-semibold text-text-secondary p-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {documents.map((doc) => (
                  <tr key={doc._id}>
                    <td className="p-3 text-text-primary font-medium">
                      {doc.title}
                    </td>
                    <td className="p-3">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 capitalize">
                        {doc.documentType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      {doc.needsReview ? (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-yellow-800 dark:text-yellow-300">
                          <FaExclamationTriangle /> Needs Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-green-800 dark:text-green-300">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleEdit(doc)}
                          title="Edit"
                          className="text-text-secondary hover:text-accent"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          title="Delete"
                          className="text-text-secondary hover:text-red-500"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ✅ 5. عرض النافذة المنبثقة ووضع النموذج بداخلها */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDoc ? "Edit Document" : "Add New Document"}
      >
        <FormCard>
          <form onSubmit={handleFormSubmit}>
            <div className="p-6 space-y-6">
              <FormField
                label="Celex ID *"
                name="celexId"
                helpText="The unique identifier from EUR-Lex. Cannot be changed after creation."
              >
                <input
                  type="text"
                  id="celexId"
                  name="celexId"
                  value={formData.celexId}
                  onChange={handleInputChange}
                  required
                  disabled={!!editingDoc}
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-50"
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Document Type *" name="documentType">
                  <select
                    id="documentType"
                    name="documentType"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                  >
                    <option value="regulation">Regulation</option>
                    <option value="cjeu_judgment">CJEU Judgment</option>
                  </select>
                </FormField>
                <FormField label="Publication Date *" name="publicationDate">
                  <input
                    type="date"
                    id="publicationDate"
                    name="publicationDate"
                    value={formData.publicationDate}
                    onChange={handleInputChange}
                    required
                    className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none dark:[color-scheme:dark]"
                  />
                </FormField>
              </div>

              <FormField label="Title *" name="title">
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </FormField>

              <FormField label="Summary *" name="summary">
                <textarea
                  id="summary"
                  name="summary"
                  rows="4"
                  value={formData.summary}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </FormField>

              <FormField
                label="Keywords"
                name="keywords"
                helpText="Comma-separated keywords."
              >
                <input
                  type="text"
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none"
                />
              </FormField>
            </div>
            <div className="bg-primary px-6 py-4 flex justify-end gap-4 border-t border-border-color">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 bg-tertiary text-text-primary font-semibold text-sm rounded-md hover:bg-border-color transition flex items-center gap-2"
              >
                <FaTimes /> Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-md hover:bg-opacity-90 transition flex items-center gap-2"
              >
                <FaSave /> {editingDoc ? "Update Document" : "Save Document"}
              </button>
            </div>
          </form>
        </FormCard>
      </Modal>
    </div>
  );
};

export default LegalManagement;
