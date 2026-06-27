const asyncHandler = require("../utils/asyncHandler");
const Category = require("../models/Category");

// @desc   Get all categories
// @route  GET /api/categories
// @access Public
const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort("name");
  res.json({ success: true, count: categories.length, categories });
});

// @desc   Create a category (admin)
// @route  POST /api/categories
// @access Private (admin)
const createCategory = asyncHandler(async (req, res) => {
  const { name, icon, description } = req.body;
  if (!name) {
    res.status(400);
    throw new Error("Category name is required");
  }
  const category = await Category.create({ name, icon, description });
  res.status(201).json({ success: true, category });
});

// @desc   Delete a category (admin)
// @route  DELETE /api/categories/:id
// @access Private (admin)
const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    res.status(404);
    throw new Error("Category not found");
  }
  await category.deleteOne();
  res.json({ success: true, message: "Category deleted" });
});

module.exports = { getCategories, createCategory, deleteCategory };
