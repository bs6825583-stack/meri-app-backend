const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for a given user id.
 * @param {string} userId - The MongoDB _id of the user.
 * @returns {string} signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
};

module.exports = generateToken;
