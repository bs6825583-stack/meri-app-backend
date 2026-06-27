const asyncHandler = require("../utils/asyncHandler");
const SavedTrip = require("../models/SavedTrip");
const { generateTrip } = require("../services/geminiService");

// @desc   Generate an AI trip (does NOT save automatically)
// @route  POST /api/trips/generate
// @access Private
// @body   { destination, days, budget, preference, travelers, extraNotes }
const generateTripHandler = asyncHandler(async (req, res) => {
  const { destination, days, budget, preference, travelers, extraNotes } =
    req.body;

  if (!destination || !days) {
    res.status(400);
    throw new Error("destination and days are required");
  }

  const numDays = Math.min(14, Math.max(1, parseInt(days, 10) || 1));

  const trip = await generateTrip({
    destination: String(destination).trim(),
    days: numDays,
    budget: budget || "medium",
    preference: preference || "general",
    travelers,
    extraNotes,
  });

  res.json({ success: true, data: trip });
});

// @desc   Save a trip for the logged-in user
// @route  POST /api/trips/save
// @access Private
// @body   the trip object (usually the one returned from /generate) + budget/preference
const saveTrip = asyncHandler(async (req, res) => {
  const {
    destination,
    days,
    budget,
    preference,
    overview,
    bestTimeToVisit,
    estimatedTotalCost,
    travelTips,
    itinerary,
    meta,
  } = req.body;

  if (!destination || !itinerary || !Array.isArray(itinerary)) {
    res.status(400);
    throw new Error("A valid trip with an itinerary array is required");
  }

  const saved = await SavedTrip.create({
    user: req.user._id,
    destination,
    days: days || itinerary.length,
    budget: budget || "medium",
    preference: preference || "general",
    overview: overview || "",
    bestTimeToVisit: bestTimeToVisit || "",
    estimatedTotalCost: estimatedTotalCost || "",
    travelTips: travelTips || [],
    itinerary,
    meta: meta || { generatedAt: new Date() },
  });

  res.status(201).json({ success: true, data: { trip: saved } });
});

// @desc   Get all saved trips for the logged-in user
// @route  GET /api/trips/saved
// @access Private
const getSavedTrips = asyncHandler(async (req, res) => {
  const trips = await SavedTrip.find({ user: req.user._id }).sort(
    "-createdAt"
  );
  res.json({ success: true, data: { count: trips.length, trips } });
});

// @desc   Get a single saved trip by id
// @route  GET /api/trips/:id
// @access Private
const getTripById = asyncHandler(async (req, res) => {
  const trip = await SavedTrip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error("Trip not found");
  }
  if (trip.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not allowed to view this trip");
  }
  res.json({ success: true, data: trip });
});

// @desc   Delete a saved trip
// @route  DELETE /api/trips/:id
// @access Private
const deleteTrip = asyncHandler(async (req, res) => {
  const trip = await SavedTrip.findById(req.params.id);
  if (!trip) {
    res.status(404);
    throw new Error("Trip not found");
  }
  if (trip.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("You are not allowed to delete this trip");
  }
  await trip.deleteOne();
  res.json({ success: true, data: { message: "Trip deleted" } });
});

module.exports = {
  generateTripHandler,
  saveTrip,
  getSavedTrips,
  getTripById,
  deleteTrip,
};
