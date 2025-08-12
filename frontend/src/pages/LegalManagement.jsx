// frontend/src/pages/LegalManagement.jsx
import React, { useState, useEffect, useCallback, useMemo, Fragment } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import Header from "../components/Header";
import Modal from "../components/Modal";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "../components/useDebounce";
import {
  FaPlus, FaEdit, FaTrash, FaExclamationTriangle, FaCheckCircle,
  FaSave, FaTimes, FaChevronDown, FaSearch
} from "react-icons/fa";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const FormCard = ({ children }) => <div className="bg-secondary">{children}</div>;

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
  _id: null, celexId: "", documentType: "regulation", title: "",
  summary: "", publicationDate: "", keywords: "",
};

const StatusButton = ({ onClick, label, value, activeStatus }) => (
    <button
        onClick={() => onClick(value)}
        className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${ activeStatus === value ? "bg-accent text-white" : "bg-primary text-text-secondary hover:bg-tertiary"}`}
    >
        {label}
    </button>
);

const LegalManagement = () => {
  const { toggleSidebar, theme, toggleTheme } = useOutletContext();
  const [documents, setDocuments] = useState([]);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState(initialFormState);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState(null);

  const [filters, setFilters] = useState({ query: "", status: "all" });
  const debouncedQuery = useDebounce(filters.query, 300);

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
      keywords: formData.keywords.split(",").map((k) => k.trim()).filter(Boolean),
    };
    try {
      if (editingDoc) {
        await axios.put(`${API_URL}/api/legal/documents/${editingDoc._id}`, dataToSubmit, config);
      } else {
        await axios.post(`${API_URL}/api/legal/documents`, dataToSubmit, config);
      }
      fetchDocuments();
      closeModal();
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
    setIsModalOpen(true);
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
    setIsModalOpen(true);
  };

  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
        const query = debouncedQuery.toLowerCase();
        const searchMatch = query === "" || 
            doc.title.toLowerCase().includes(query) ||
            doc.celexId.toLowerCase().includes(query);
            
        const statusMatch = filters.status === 'all' ||
            (filters.status === 'review' && doc.needsReview) ||
            (filters.status === 'verified' && !doc.needsReview);

        return searchMatch && statusMatch;
    });
  }, [documents, debouncedQuery, filters.status]);

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      <Header
        title="Legal Document Management"
        toggleSidebar={toggleSidebar}
        theme={theme}
        toggleTheme={toggleTheme}
        actions={
            <button onClick={openNewForm} className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-md hover:bg-opacity-90 transition flex items-center gap-2">
                <FaPlus /> Add New
            </button>
        }
      />

      {/* Control Panel for Legal Docs */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-secondary rounded-lg shadow-sm">
        <div className="relative flex-grow w-full">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
            <input 
                type="search"
                placeholder="Search by title or Celex ID..."
                value={filters.query}
                onChange={e => setFilters(p => ({...p, query: e.target.value}))}
                className="w-full pl-10 pr-4 py-2 bg-primary border border-border-color rounded-md focus:ring-2 focus:ring-accent focus:outline-none"
            />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
            <StatusButton onClick={(value) => setFilters(p => ({...p, status: value}))} label="All" value="all" activeStatus={filters.status} />
            <StatusButton onClick={(value) => setFilters(p => ({...p, status: value}))} label="Needs Review" value="review" activeStatus={filters.status} />
            <StatusButton onClick={(value) => setFilters(p => ({...p, status: value}))} label="Verified" value="verified" activeStatus={filters.status} />
        </div>
      </div>
      
      {/* Existing Documents table */}
      <div className="bg-secondary rounded-lg shadow-sm border border-border-color">
        <div className="overflow-x-auto">
          {isLoading ? (<p className="p-6">Loading documents...</p>) : (
            <table className="w-full text-sm">
              <thead className="bg-primary">
                <tr>
                  <th className="p-3 w-12"></th>
                  <th className="p-3 text-left font-semibold text-text-secondary">Title</th>
                  <th className="p-3 text-left font-semibold text-text-secondary">Type</th>
                  <th className="p-3 text-left font-semibold text-text-secondary">Status</th>
                  <th className="p-3 text-left font-semibold text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color">
                {filteredDocuments.map((doc) => (
                  <Fragment key={doc._id}>
                    <tr>
                      <td className="p-3 text-center">
                        <button onClick={() => setExpandedRow(expandedRow === doc._id ? null : doc._id)} className="p-1 rounded-full hover:bg-tertiary">
                          <motion.div animate={{ rotate: expandedRow === doc._id ? 180 : 0 }}>
                            <FaChevronDown className="text-text-secondary" />
                          </motion.div>
                        </button>
                      </td>
                      <td className="p-3 text-text-primary font-medium">{doc.title}</td>
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 capitalize">
                          {doc.documentType.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        {doc.needsReview ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-yellow-800 dark:text-yellow-300"><FaExclamationTriangle /> Needs Review</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-green-800 dark:text-green-300"><FaCheckCircle /> Verified</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-4">
                          <button onClick={() => handleEdit(doc)} title="Edit" className="text-text-secondary hover:text-accent"><FaEdit /></button>
                          <button onClick={() => handleDelete(doc._id)} title="Delete" className="text-text-secondary hover:text-red-500"><FaTrash /></button>
                        </div>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedRow === doc._id && (
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan="5" className="p-0">
                            <div className="bg-primary p-4 m-2 rounded-md border border-border-light">
                               <h4 className="font-semibold text-text-primary">Summary</h4>
                               <p className="text-text-secondary mb-3">{doc.summary}</p>
                               <h4 className="font-semibold text-text-primary">Keywords</h4>
                               <div className="flex flex-wrap gap-2 mt-1">
                                {doc.keywords.length > 0 ? doc.keywords.map(kw => <span key={kw} className="px-2 py-0.5 text-xs font-medium rounded-full bg-tertiary text-text-secondary">{kw}</span>) : <span className="text-xs text-text-muted">No keywords.</span>}
                               </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                ))}
              </tbody>
            </table>
          )}
          {filteredDocuments.length === 0 && !isLoading && 
            <p className="p-6 text-center text-text-secondary">No documents match your criteria.</p>
          }
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingDoc ? "Edit Document" : "Add New Document"}>
        <FormCard>
          <form onSubmit={handleFormSubmit}>
            <div className="p-6 space-y-6">
              <FormField label="Celex ID *" name="celexId" helpText="The unique identifier from EUR-Lex. Cannot be changed after creation.">
                <input type="text" id="celexId" name="celexId" value={formData.celexId} onChange={handleInputChange} required disabled={!!editingDoc} className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none disabled:opacity-50" />
              </FormField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Document Type *" name="documentType">
                  <select id="documentType" name="documentType" value={formData.documentType} onChange={handleInputChange} required className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none">
                    <option value="regulation">Regulation</option>
                    <option value="cjeu_judgment">CJEU Judgment</option>
                  </select>
                </FormField>
                <FormField label="Publication Date *" name="publicationDate">
                  <input type="date" id="publicationDate" name="publicationDate" value={formData.publicationDate} onChange={handleInputChange} required className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none dark:[color-scheme:dark]" />
                </FormField>
              </div>
              <FormField label="Title *" name="title">
                <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} required className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none" />
              </FormField>
              <FormField label="Summary *" name="summary">
                <textarea id="summary" name="summary" rows="4" value={formData.summary} onChange={handleInputChange} required className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none" />
              </FormField>
              <FormField label="Keywords" name="keywords" helpText="Comma-separated keywords.">
                <input type="text" id="keywords" name="keywords" value={formData.keywords} onChange={handleInputChange} className="w-full bg-primary border border-border-color rounded-md px-3 py-2 focus:ring-2 focus:ring-accent focus:outline-none" />
              </FormField>
            </div>
            <div className="bg-primary px-6 py-4 flex justify-end gap-4 border-t border-border-color">
              <button type="button" onClick={closeModal} className="px-4 py-2 bg-tertiary text-text-primary font-semibold text-sm rounded-md hover:bg-border-color transition flex items-center gap-2">
                <FaTimes /> Cancel
              </button>
              <button type="submit" className="px-4 py-2 bg-accent text-white font-semibold text-sm rounded-md hover:bg-opacity-90 transition flex items-center gap-2">
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