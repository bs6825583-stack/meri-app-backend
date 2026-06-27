const asyncHandler = require("../utils/asyncHandler");
const Review = require("../models/Review");
const Place = require("../models/Place");

// Recalculates and caches a place's average rating + review count
async function recalcRating(placeId) {
  const stats = await Review.aggregate([
    { $match: { place: placeId } },
    {
      $group: {
        _id: "$place",
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const avg = stats.length ? Math.round(stats[0].avg * 10) / 10 : 0;
  const count = stats.length ? stats[0].count : 0;

  await Place.findByIdAndUpdate(placeId, {
    averageRating: avg,
    numReviews: count,
  });
}

// @desc   Add (or update) a review for a place
// @route  POST /api/places/:placeId/reviews
// @access Private
const addReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { placeId } = req.params;

  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error("Rating must be between 1 and 5");
  }

  const place = await Place.findById(placeId);
  if (!place) {
    res.status(404);
    throw new Error("Place not found");
  }

  // Upsert: one review per user per place
  const review = await Review.findOneAndUpdate(
    { place: placeId, user: req.user._id },
    {
      place: placeId,
      user: req.user._id,
      name: req.user.name,
      rating,
      comment: comment || "",
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await recalcRating(place._id);

  res.status(201).json({ success: true, review });
});

// @desc   Get all reviews for a place
// @route  GET /api/places/:placeId/reviews
// @access Public
const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ place: req.params.placeId }).sort(
    "-createdAt"
  );
  res.json({ success: true, count: reviews.length, reviews });
});

// @desc   Delete own review
// @route  DELETE /api/places/:placeId/reviews/:reviewId
// @access Private
const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error("Review not found");
  }
  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== "admin"
  ) {
    res.status(403);
    throw new Error("You can only delete your own review");
  }
  const placeId = review.place;
  await review.deleteOne();
  await recalcRating(placeId);
  res.json({ success: true, message: "Review deleted" });
});

module.exports = { addReview, getReviews, deleteReview };
