const express = require("express");
const router = express.Router();
const {
  getCategories,
  createCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { protect } = require("../middleware/authMiddleware");
const { authorize } = require("../middleware/roleMiddleware");

router
  .route("/")
  .get(getCategories)
  .post(protect, authorize("admin"), createCategory);

router.delete("/:id", protect, authorize("admin"), deleteCategory);

module.exports = router;
