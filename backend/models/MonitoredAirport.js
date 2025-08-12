// backend/models/MonitoredAirport.js
const mongoose = require("mongoose");

const MonitoredAirportSchema = new mongoose.Schema(
  {
    icao: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 4,
    },
    iata: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: 3,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("MonitoredAirport", MonitoredAirportSchema);