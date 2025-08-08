// backend/routes/api/legal.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const LegalDocument = require("../../models/LegalDocument");
// ✅ ==== السطر المفقود الذي يجب إضافته ====
const { runVerificationJob } = require("../../services/legalService");
// ===========================================

// --- GET Endpoints (Read) ---

// @route   GET /api/legal/documents
// @desc    Get all legal documents
// @access  Private
router.get("/documents", auth, async (req, res) => {
  try {
    const documents = await LegalDocument.find().sort({ publicationDate: -1 });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// ✅ --- GET Endpoint (Read Single) ---
// @route   GET /api/legal/documents/:id
// @desc    Get a single legal document by its ID
// @access  Private
router.get("/documents/:id", auth, async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    // Handle cases where the ID format is invalid
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Document not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/legal/review-needed
// @desc    Get documents that need manual review
// @access  Private
router.get("/review-needed", auth, async (req, res) => {
  try {
    const documents = await LegalDocument.find({ needsReview: true });
    res.json(documents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- POST Endpoint (Create) ---
// @route   POST /api/legal/documents
// @desc    Create a new legal document
// @access  Private
router.post("/documents", auth, async (req, res) => {
  const {
    celexId,
    documentType,
    title,
    summary,
    publicationDate,
    keywords,
    fullText, // ✅
  } = req.body;
  try {
    let doc = await LegalDocument.findOne({ celexId });
    if (doc) {
      return res
        .status(400)
        .json({ msg: "Document with this Celex ID already exists." });
    }
    doc = new LegalDocument({
      celexId,
      documentType,
      title,
      summary,
      publicationDate,
      keywords,
      fullText, // ✅
    });
    await doc.save();
    res.status(201).json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- PUT Endpoints (Update) ---

// @route   PUT /api/legal/documents/:id
// @desc    Update a legal document
// @access  Private
router.put("/documents/:id", auth, async (req, res) => {
  const { title, summary, publicationDate, keywords, fullText } = req.body; // ✅
  try {
    let doc = await LegalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }
    // Update fields
    if (title) doc.title = title;
    if (summary) doc.summary = summary;
    if (publicationDate) doc.publicationDate = publicationDate;
    if (keywords) doc.keywords = keywords;
    if (fullText) doc.fullText = fullText; // ✅

    // When a doc is manually updated, it's considered "reviewed"
    doc.needsReview = false;

    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/legal/mark-reviewed/:id
// @desc    Mark a document as reviewed (set needsReview to false)
// @access  Private
router.put("/mark-reviewed/:id", auth, async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }
    doc.needsReview = false;
    doc.lastVerifiedAt = new Date(); // Also update verification date
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- DELETE Endpoint ---
// @route   DELETE /api/legal/documents/:id
// @desc    Delete a legal document
// @access  Private
router.delete("/documents/:id", auth, async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }
    await LegalDocument.findByIdAndDelete(req.params.id);
    res.json({ msg: "Document removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// --- Context Endpoint for AI (No Change) ---
// @route   POST /api/legal/context
// @desc    Get relevant legal context based on case keywords
// @access  Private
router.post("/context", auth, async (req, res) => {
  const { caseKeywords } = req.body;
  if (
    !caseKeywords ||
    !Array.isArray(caseKeywords) ||
    caseKeywords.length === 0
  ) {
    return res
      .status(400)
      .json({ msg: "Please provide an array of caseKeywords." });
  }
  try {
    const searchString = caseKeywords.join(" ");
    const relevantJudgments = await LegalDocument.find({
      $text: { $search: searchString },
      documentType: "cjeu_judgment",
    }).limit(5);

    const mainRegulation = await LegalDocument.findOne({
      documentType: "regulation",
    });

    res.json({ mainRegulation, relevantJudgments });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;