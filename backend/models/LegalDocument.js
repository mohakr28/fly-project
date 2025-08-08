// backend/models/LegalDocument.js
const mongoose = require("mongoose");

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
    // ✅ --- الحقل الجديد ---
    fullText: {
      type: String,
    },
    // ----------------------
    publicationDate: {
      type: Date,
      required: true,
    },
    keywords: [String],

    // الحقول الجديدة للتحقق الآلي
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

// فهرس للبحث النصي
LegalDocumentSchema.index({
  title: "text",
  summary: "text",
  keywords: "text",
});

module.exports = mongoose.model("LegalDocument", LegalDocumentSchema);