// backend/routes/api/legal.js
const express = require("express");
const router = express.Router();
const auth = require("../../middleware/auth");
const LegalDocument = require("../../models/LegalDocument");
const { getPineconeIndex, getOpenAI } = require("../../config/pinecone");

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
    fullText,
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
      fullText,
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
  const { title, summary, publicationDate, keywords, fullText } = req.body;
  try {
    let doc = await LegalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }
    if (title) doc.title = title;
    if (summary) doc.summary = summary;
    if (publicationDate) doc.publicationDate = publicationDate;
    if (keywords) doc.keywords = keywords;
    if (fullText) doc.fullText = fullText;
    doc.needsReview = false;
    await doc.save();
    res.json(doc);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/legal/mark-reviewed/:id
// @desc    Mark a document as reviewed
// @access  Private
router.put("/mark-reviewed/:id", auth, async (req, res) => {
  try {
    const doc = await LegalDocument.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ msg: "Document not found" });
    }
    doc.needsReview = false;
    doc.lastVerifiedAt = new Date();
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

// --- نقطة نهاية البحث الدلالي ---
// @route   POST /api/legal/semantic-search
// @desc    Find relevant articles using semantic search
// @access  Private
router.post("/semantic-search", auth, async (req, res) => {
    const { caseDescription, topK = 3 } = req.body;

    if (!caseDescription) {
        return res.status(400).json({ msg: "A 'caseDescription' string is required." });
    }

    try {
        const openai = getOpenAI();
        const pineconeIndex = getPineconeIndex();

        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: caseDescription,
        });
        
        if (!embeddingResponse?.data?.[0]?.embedding) {
            console.error("Invalid response from OpenAI during search.");
            return res.status(500).json({ msg: "Failed to generate embedding for search query." });
        }

        const queryVector = embeddingResponse.data[0].embedding;

        const queryResult = await pineconeIndex.query({
            vector: queryVector,
            topK: parseInt(topK, 10),
            includeMetadata: false,
        });
        
        const matches = queryResult.matches;
        if (!matches || matches.length === 0) {
            return res.json([]);
        }

        const pineconeIds = matches.map(match => match.id);
        const regulation = await LegalDocument.findOne({ "articles.pineconeId": { $in: pineconeIds } });

        if (!regulation) {
            return res.status(404).json({ msg: "Could not find a regulation containing the matched articles." });
        }
        
        const articlesMap = new Map(regulation.articles.map(a => [a.pineconeId, a]));
        const sortedArticles = pineconeIds.map(id => articlesMap.get(id)).filter(Boolean);

        res.json(sortedArticles);

    } catch (err) {
        console.error("Semantic search error:", err.response ? err.response.data : err.message);
        res.status(500).send("Server Error during semantic search.");
    }
});

module.exports = router;