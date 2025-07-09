// backend/models/Flight.js
const mongoose = require("mongoose");

const FlightSchema = new mongoose.Schema(
  {
    flightNumber: { type: String, required: true },
    departureAirport: { type: String, required: true },
    arrivalAirport: { type: String, required: true },
    scheduledDeparture: { type: Date, required: true },
    actualDeparture: { type: Date },
    status: {
      type: String,
      enum: ["Delayed", "Cancelled"],
      required: true,
    },
    delayDuration: { type: Number, default: 0 },
    icao24: { type: String },
    live: {
      onGround: { type: Boolean, default: true },
      latitude: { type: Number },
      longitude: { type: Number },
      altitude: { type: Number },
      lastUpdated: { type: Date },
    },
    weatherInfo: {
      departure: {
        condition: String,
        temperature: Number,
        windSpeed: Number,
      },
      arrival: {
        condition: String,
        temperature: Number,
        windSpeed: Number,
      },
    },
    // --- الحقل الأساسي لهذا المنطق ---
    isWeatherLocked: { type: Boolean, default: false },
    cancellationContext: {
      type: String, // e.g., "Possible link to ongoing strike."
    },
  },
  {
    timestamps: true,
  }
);

FlightSchema.index(
  { flightNumber: 1, scheduledDeparture: 1 },
  { unique: true }
);

module.exports = mongoose.model("Flight", FlightSchema);
