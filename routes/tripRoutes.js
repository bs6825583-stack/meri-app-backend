const express = require("express");
const router = express.Router();
const {
  generateTripHandler,
  saveTrip,
  getSavedTrips,
  getTripById,
  deleteTrip,
} = require("../controllers/tripController");
const { protect } = require("../middleware/authMiddleware");

// All trip routes require login
router.use(protect);

router.post("/generate-ai", generateTripHandler);
router.post("/save", saveTrip);
router.get("/saved", getSavedTrips);
router.route("/:id").get(getTripById).delete(deleteTrip);

module.exports = router;
