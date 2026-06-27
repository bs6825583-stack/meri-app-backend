const asyncHandler = require("../utils/asyncHandler");
const Place = require("../models/Place");
const Review = require("../models/Review");
const { deleteImage, processFiles } = require("../services/cloudinaryService");

// @desc   Create a new place (locals/admin only)
// @route  POST /api/places
// @access Private (local, admin)
const addPlace = asyncHandler(async (req, res) => {
  const { name, description, city, address, category, lat, lng, priceRange } = req.body;

  if (!name || !description || !city || !category) {
    res.status(400);
    throw new Error("name, description, city and category are required");
  }

  const images = await processFiles(req.files || []);

  const place = await Place.create({
    name,
    description,
    city,
    address: address || "",
    category,
    priceRange: priceRange || "Low",
    images,
    location: {
      lat: lat ? Number(lat) : null,
      lng: lng ? Number(lng) : null,
    },
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, place });
});

// @desc   Get all places with search / filter / pagination
// @route  GET /api/places?search=&category=&city=&page=&limit=&sort=
// @access Public
const getPlaces = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    city,
    page = 1,
    limit = 20,
    sort = "-createdAt",
  } = req.query;

  const query = { isApproved: true };

  if (category) query.category = category;
  if (city) query.city = new RegExp(city, "i");
  if (search) query.$text = { $search: search };

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [places, total] = await Promise.all([
    Place.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("createdBy", "name role"),
    Place.countDocuments(query),
  ]);

  res.json({
    success: true,
    count: places.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    places,
  });
});

// @desc   Get single place by id (with reviews)
// @route  GET /api/places/:id
// @access Public
const getPlaceById = asyncHandler(async (req, res) => {
  const place = await Place.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },   // ← increment views by 1 each time place is opened
    { new: true }
  ).populate("createdBy", "name role");

  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  const reviews = await Review.find({ place: place._id }).sort("-createdAt");

  res.json({ success: true, place, reviews });
});

// @desc   Update a place (owner or admin)
// @route  PUT /api/places/:id
// @access Private
const updatePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  // Only the creator or an admin can edit
  if (
    place.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("You are not allowed to edit this place");
  }

  const fields = ["name", "description", "city", "address", "category", "priceRange"];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) place[f] = req.body[f];
  });

  if (req.body.lat !== undefined) place.location.lat = Number(req.body.lat);
  if (req.body.lng !== undefined) place.location.lng = Number(req.body.lng);

  // Append any newly uploaded images
  if (req.files && req.files.length) {
    const newImages = await processFiles(req.files);
    place.images.push(...newImages);
  }

  await place.save();
  res.json({ success: true, place });
});

// @desc   Delete a place (owner or admin)
// @route  DELETE /api/places/:id
// @access Private
const deletePlace = asyncHandler(async (req, res) => {
  const place = await Place.findById(req.params.id);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  if (
    place.createdBy.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("You are not allowed to delete this place");
  }

  // Clean up images + reviews
  await Promise.all((place.images || []).map((img) => deleteImage(img)));
  await Review.deleteMany({ place: place._id });
  await place.deleteOne();

  res.json({ success: true, message: "Place deleted" });
});

// @desc   Get places created by the logged-in user (their uploads)
// @route  GET /api/places/mine/list
// @access Private
const getMyPlaces = asyncHandler(async (req, res) => {
  const places = await Place.find({ createdBy: req.user._id }).sort(
    "-createdAt"
  );
  res.json({ success: true, count: places.length, places });
});

module.exports = {
  addPlace,
  getPlaces,
  getPlaceById,
  updatePlace,
  deletePlace,
  getMyPlaces,
};
