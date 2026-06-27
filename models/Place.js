const mongoose = require("mongoose");

const placeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Place name is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    address: {
      type: String,
      default: "",
    },
    category: {
      type: String, // e.g. "Nature", "Food", "Adventure", "Shopping"
      required: [true, "Category is required"],
      trim: true,
    },
    images: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: "" }, // for Cloudinary deletion
      },
    ],
    location: {
      lat: { type: Number, default: null },
      lng: { type: Number, default: null },
    },
     priceRange: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Low",
    },
    // Cached rating summary (kept in sync by review controller)
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
},
    // Who uploaded this place (a "local" user)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isApproved: {
      type: Boolean,
      default: true, // set to false if you want admin moderation
    },
  },
  { timestamps: true }
);

// Full-text search index across the important fields
placeSchema.index({
  name: "text",
  description: "text",
  city: "text",
  category: "text",
});

module.exports = mongoose.model("Place", placeSchema);
