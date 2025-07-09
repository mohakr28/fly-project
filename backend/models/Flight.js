// backend/models/Flight.js
const mongoose = require("mongoose");

// مخطط فرعي لطبقات السحب داخل بيانات الطقس
const CloudLayerSchema = new mongoose.Schema(
  {
    cover: String, // e.g., "FEW", "SCT", "BKN", "OVC"
    height: Number, // In feet AGL
  },
  { _id: false }
);

// مخطط فرعي لبيانات الطقس المفصلة
const WeatherSchema = new mongoose.Schema(
  {
    condition: String, // Raw METAR string
    temperature: Number,
    windSpeed: Number,
    visibility: Number, // In meters
    cloudLayers: [CloudLayerSchema], // Array of cloud layers
  },
  { _id: false }
);

// المخطط الرئيسي للرحلة
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
    aircraftModel: { type: String },
    live: {
      onGround: { type: Boolean, default: true },
      latitude: { type: Number },
      longitude: { type: Number },
      altitude: { type: Number },
      lastUpdated: { type: Date },
    },
    weatherInfo: {
      departure: WeatherSchema,
      arrival: WeatherSchema,
    },
    isWeatherLocked: { type: Boolean, default: false },
    cancellationContext: {
      type: String,
    },
    // قسم الأعلام التحليلية
    analysisFlags: {
      isWeatherSevere: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true, // يضيف حقلي createdAt و updatedAt تلقائيًا
  }
);

// إنشاء فهرس لضمان عدم تكرار نفس الرحلة (بنفس الرقم والوقت المجدول)
FlightSchema.index(
  { flightNumber: 1, scheduledDeparture: 1 },
  { unique: true }
);

module.exports = mongoose.model("Flight", FlightSchema);
