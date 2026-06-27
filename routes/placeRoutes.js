const express = require("express");
const router = express.Router();
const {
  addPlace,
  getPlaces,
  getPlaceById,
  updatePlace,
  deletePlace,
  getMyPlaces,
} = require("../controllers/placeController");
const {
  addReview,
  getReviews,
  deleteReview,
} = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");
const { upload } = require("../middleware/uploadMiddleware");

// Places
router
  .route("/")
  .get(getPlaces)
  .post(protect, authorize("local", "admin"), upload.array("images", 6), addPlace);

router.get("/mine/list", protect, getMyPlaces);

router
  .route("/:id")
  .get(getPlaceById)
  .put(protect, upload.array("images", 6), updatePlace)
  .delete(protect, deletePlace);

// Reviews (nested under a place)
router
  .route("/:placeId/reviews")
  .get(getReviews)
  .post(protect, addReview);

router.delete("/:placeId/reviews/:reviewId", protect, deleteReview);

module.exports = router;
