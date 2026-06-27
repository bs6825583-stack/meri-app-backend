const mongoose = require("mongoose");

// A single activity inside a day
const activitySchema = new mongoose.Schema(
  {
    time: String, // e.g. "09:00 AM"
    title: String, // e.g. "Visit Baltit Fort"
    description: String,
    location: String,
    estimatedCost: String, // e.g. "PKR 500"
  },
  { _id: false }
);

// A single day of the trip
const daySchema = new mongoose.Schema(
  {
    day: Number, // 1, 2, 3...
    title: String, // e.g. "Arrival & Exploring Karimabad"
    activities: [activitySchema],
  },
  { _id: false }
);

const savedTripSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    days: {
      type: Number,
      required: true,
    },
    budget: {
      type: String, // "low" | "medium" | "high"
      default: "medium",
    },
    preference: {
      type: String, // "adventure" | "family" | "relaxation" | etc.
      default: "general",
    },
    // The structured itinerary returned by Gemini
    overview: String,
    bestTimeToVisit: String,
    estimatedTotalCost: String,
    travelTips: [String],
    itinerary: [daySchema],
    // The raw prompt + model used (helpful for debugging / regeneration)
    meta: {
      model: String,
      generatedAt: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SavedTrip", savedTripSchema);
