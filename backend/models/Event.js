// backend/models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: [
        "Strike",
        "Protest",
        "SystemOutage",
        "Weather",
        "Security",
        "Other",
      ],
      default: "Other", // الافتراضي هو "Other" ليتم تصنيفه لاحقًا
    },
    // The entity affected, e.g., "SAS", "Lufthansa", "Copenhagen Airport"
    affectedEntity: {
      type: String,
      required: true,
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    source: {
      type: String, // e.g., "NewsAPI", "Manual Entry"
      required: true,
    },
    // --- الحقول الجديدة ---
    status: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "pending_approval",
      required: true,
    },
    sourceUrl: {
      type: String, // الرابط المباشر للمقال الإخباري
      unique: true, // لضمان عدم إضافة نفس المقال مرتين
      required: true,
    },
    isExtraordinary: {
      type: Boolean,
      default: null, // يظل null حتى يقرر الموظف. true = ظرف استثنائي، false = ليس كذلك.
    },
    // ----------------------
  },
  {
    timestamps: true,
  }
);

// لمنع التكرار بناءً على الكيان المتأثر ونفس رابط المصدر
EventSchema.index({ affectedEntity: 1, sourceUrl: 1 }, { unique: true });

module.exports = mongoose.model("Event", EventSchema);
