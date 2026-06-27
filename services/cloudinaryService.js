const fs = require("fs");
const path = require("path");
const { cloudinary, isCloudinaryConfigured } = require("../config/cloudinary");

/**
 * Converts Multer disk files into stored image objects.
 * - If Cloudinary is configured: uploads each temp file to Cloudinary,
 *   deletes the local temp file, and returns the cloud URL + public_id.
 * - Otherwise: keeps the file locally and returns a /uploads URL.
 *
 * @param {Array} files - req.files from multer
 * @returns {Promise<Array<{url:string, public_id:string}>>}
 */
async function processFiles(files = []) {
  const images = [];

  for (const file of files) {
    if (isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "tourism_app/places",
          transformation: [{ width: 1280, crop: "limit" }],
        });
        images.push({ url: result.secure_url, public_id: result.public_id });
      } finally {
        // remove the local temp file regardless of success
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      }
    } else {
      images.push({ url: `/uploads/${file.filename}`, public_id: "" });
    }
  }

  return images;
}

/**
 * Deletes a stored image from Cloudinary (by public_id) or local disk (by url).
 */
async function deleteImage(image) {
  if (!image) return;
  try {
    if (isCloudinaryConfigured && image.public_id) {
      await cloudinary.uploader.destroy(image.public_id);
      return;
    }
    if (image.url && image.url.startsWith("/uploads/")) {
      const filePath = path.join(__dirname, "..", image.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.error("Image deletion failed:", err.message);
  }
}

module.exports = { processFiles, deleteImage };
