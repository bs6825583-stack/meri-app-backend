const { v2: cloudinary } = require("cloudinary");

/**
 * Cloudinary is OPTIONAL. If credentials are missing the app still runs and
 * falls back to local disk storage for uploads (see uploadMiddleware.js).
 */
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log("✅ Cloudinary configured (cloud image storage)");
} else {
  console.log(
    "ℹ️  Cloudinary not configured — using local disk storage for uploads"
  );
}

module.exports = { cloudinary, isCloudinaryConfigured };
