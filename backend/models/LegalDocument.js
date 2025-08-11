// backend/models/LegalDocument.js
const mongoose = require("mongoose");

// بنية المادة القانونية
const ArticleSchema = new mongoose.Schema({
    articleNumber: { type: String, required: true },
    title: { type: String, required: true },
    text: { type: String, required: true },
    tags: { type: [String], index: true },
    // الحقل الجديد لربط المادة بـ Pinecone
    // index: true هنا كافٍ لإنشاء الفهرس
    pineconeId: { type: String, index: true, unique: true, sparse: true },
}, { _id: false });


const LegalDocumentSchema = new mongoose.Schema(
  {
    celexId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ["regulation", "cjeu_judgment"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    fullText: {
      type: String,
    },
    publicationDate: {
      type: Date,
      required: true,
    },
    keywords: [String],
    
    articles: [ArticleSchema],

    lastVerifiedAt: {
      type: Date,
    },
    needsReview: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// فهرس البحث النصي
LegalDocumentSchema.index({
  title: "text",
  summary: "text",
  keywords: "text",
});

module.exports = mongoose.model("LegalDocument", LegalDocumentSchema);