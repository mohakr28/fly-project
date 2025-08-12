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
  console.log("LOG: [GET /api/legal/documents] Request to fetch all legal documents.");
  try {
    const documents = await LegalDocument.find().sort({ publicationDate: -1 });
    console.log(`LOG: [GET /api/legal/documents] Found ${documents.length} documents.`);
    res.json(documents);
  } catch (err) {
    console.error("ERROR: [GET /api/legal/documents] Server Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /api/legal/documents/:id
// @desc    Get a single legal document by its ID
// @access  Private
router.get("/documents/:id", auth, async (req, res) => {
  const docId = req.params.id;
  console.log(`LOG: [GET /api/legal/documents/${docId}] Request to fetch a single document.`);
  try {
    const doc = await LegalDocument.findById(docId);
    if (!doc) {
      console.warn(`LOG: [GET /api/legal/documents/${docId}] Document not found.`);
      return res.status(404).json({ msg: "Document not found" });
    }
    console.log(`LOG: [GET /api/legal/documents/${docId}] Document found: ${doc.celexId}`);
    res.json(doc);
  } catch (err) {
    console.error(`ERROR: [GET /api/legal/documents/${docId}] Server Error:`, err.message);
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
  console.log("LOG: [GET /api/legal/review-needed] Request to fetch documents needing review.");
  try {
    const documents = await LegalDocument.find({ needsReview: true });
    console.log(`LOG: [GET /api/legal/review-needed] Found ${documents.length} documents for review.`);
    res.json(documents);
  } catch (err) {
    console.error("ERROR: [GET /api/legal/review-needed] Server Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// --- POST Endpoint (Create) ---
// @route   POST /api/legal/documents
// @desc    Create a new legal document
// @access  Private
router.post("/documents", auth, async (req, res) => {
  console.log("LOG: [POST /api/legal/documents] Request to create a new document. Body:", req.body);
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
      console.warn(`LOG: [POST /api/legal/documents] Document with Celex ID ${celexId} already exists.`);
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
    console.log(`LOG: [POST /api/legal/documents] Document created successfully with ID: ${doc._id}`);
    res.status(201).json(doc);
  } catch (err) {
    console.error("ERROR: [POST /api/legal/documents] Server Error:", err.message);
    res.status(500).send("Server Error");
  }
});

// --- PUT Endpoints (Update) ---

// @route   PUT /api/legal/documents/:id
// @desc    Update a legal document
// @access  Private
router.put("/documents/:id", auth, async (req, res) => {
  const docId = req.params.id;
  console.log(`LOG: [PUT /api/legal/documents/${docId}] Request to update document. Body:`, req.body);
  const { title, summary, publicationDate, keywords, fullText } = req.body;
  try {
    let doc = await LegalDocument.findById(docId);
    if (!doc) {
      console.warn(`LOG: [PUT /api/legal/documents/${docId}] Document not found.`);
      return res.status(404).json({ msg: "Document not found" });
    }
    if (title) doc.title = title;
    if (summary) doc.summary = summary;
    if (publicationDate) doc.publicationDate = publicationDate;
    if (keywords) doc.keywords = keywords;
    if (fullText) doc.fullText = fullText;
    doc.needsReview = false;
    await doc.save();
    console.log(`LOG: [PUT /api/legal/documents/${docId}] Document updated successfully.`);
    res.json(doc);
  } catch (err) {
    console.error(`ERROR: [PUT /api/legal/documents/${docId}] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /api/legal/mark-reviewed/:id
// @desc    Mark a document as reviewed
// @access  Private
router.put("/mark-reviewed/:id", auth, async (req, res) => {
  const docId = req.params.id;
  console.log(`LOG: [PUT /api/legal/mark-reviewed/${docId}] Request to mark document as reviewed.`);
  try {
    const doc = await LegalDocument.findById(docId);
    if (!doc) {
      console.warn(`LOG: [PUT /api/legal/mark-reviewed/${docId}] Document not found.`);
      return res.status(404).json({ msg: "Document not found" });
    }
    doc.needsReview = false;
    doc.lastVerifiedAt = new Date();
    await doc.save();
    console.log(`LOG: [PUT /api/legal/mark-reviewed/${docId}] Document marked as reviewed.`);
    res.json(doc);
  } catch (err) {
    console.error(`ERROR: [PUT /api/legal/mark-reviewed/${docId}] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// --- DELETE Endpoint ---
// @route   DELETE /api/legal/documents/:id
// @desc    Delete a legal document
// @access  Private
router.delete("/documents/:id", auth, async (req, res) => {
  const docId = req.params.id;
  console.log(`LOG: [DELETE /api/legal/documents/${docId}] Request to delete document.`);
  try {
    const doc = await LegalDocument.findById(docId);
    if (!doc) {
      console.warn(`LOG: [DELETE /api/legal/documents/${docId}] Document not found.`);
      return res.status(404).json({ msg: "Document not found" });
    }
    await LegalDocument.findByIdAndDelete(docId);
    console.log(`LOG: [DELETE /api/legal/documents/${docId}] Document deleted successfully.`);
    res.json({ msg: "Document removed" });
  } catch (err) {
    console.error(`ERROR: [DELETE /api/legal/documents/${docId}] Server Error:`, err.message);
    res.status(500).send("Server Error");
  }
});

// --- نقطة نهاية البحث الدلالي ---
// @route   POST /api/legal/semantic-search
// @desc    Find relevant articles using semantic search
// @access  Private
router.post("/semantic-search", auth, async (req, res) => {
    const { caseDescription, topK = 3 } = req.body;
    console.log(`LOG: [POST /api/legal/semantic-search] Received semantic search request. TopK: ${topK}. Case: "${caseDescription}"`);

    if (!caseDescription) {
        console.warn("LOG: [POST /api/legal/semantic-search] Bad request: 'caseDescription' is required.");
        return res.status(400).json({ msg: "A 'caseDescription' string is required." });
    }

    try {
        const openai = getOpenAI();
        const pineconeIndex = getPineconeIndex();

        console.log("LOG: [Semantic Search] Generating embedding for query...");
        const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: caseDescription,
        });
        
        if (!embeddingResponse?.data?.[0]?.embedding) {
            console.error("LOG: [Semantic Search] Invalid response from OpenAI during embedding generation.");
            return res.status(500).json({ msg: "Failed to generate embedding for search query." });
        }

        const queryVector = embeddingResponse.data[0].embedding;
        console.log("LOG: [Semantic Search] Embedding generated. Querying Pinecone...");

        const queryResult = await pineconeIndex.query({
            vector: queryVector,
            topK: parseInt(topK, 10),
            includeMetadata: false, // Metadata is not needed as we fetch from DB
        });
        
        console.log("LOG: [Semantic Search] Pinecone query successful. Raw matches:", queryResult.matches);
        const matches = queryResult.matches;
        if (!matches || matches.length === 0) {
            console.log("LOG: [Semantic Search] No relevant articles found in Pinecone.");
            return res.json([]);
        }

        const pineconeIds = matches.map(match => match.id);
        console.log(`LOG: [Semantic Search] Matched Pinecone IDs: ${pineconeIds.join(', ')}. Fetching from DB...`);
        
        // Find the regulation that contains ANY of the matched articles
        const regulation = await LegalDocument.findOne({ "articles.pineconeId": { $in: pineconeIds } });

        if (!regulation) {
            console.warn("LOG: [Semantic Search] Could not find a regulation in DB containing the matched Pinecone IDs.");
            return res.status(404).json({ msg: "Could not find a regulation containing the matched articles." });
        }
        
        // Create a map for efficient lookup and sort the results based on Pinecone's relevance order
        const articlesMap = new Map(regulation.articles.map(a => [a.pineconeId, a]));
        const sortedArticles = pineconeIds.map(id => articlesMap.get(id)).filter(Boolean); // filter(Boolean) removes any nulls if an ID was not found

        console.log(`LOG: [Semantic Search] Successfully found and sorted ${sortedArticles.length} articles. Sending response.`);
        res.json(sortedArticles);

    } catch (err) {
        console.error("ERROR: [Semantic Search] An error occurred:", err.response ? err.response.data : err.message);
        res.status(500).send("Server Error during semantic search.");
    }
});

module.exports = router;