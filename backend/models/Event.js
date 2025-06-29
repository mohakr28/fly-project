// backend/models/Event.js
const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    eventType: {
      type: String,
      enum: ["Strike", "Protest", "SystemOutage", "Other"],
      required: true,
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
      type: String, // e.g., "Statistics Denmark API", "News Article"
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Event", EventSchema);
