const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

/**
 * Protects routes by verifying the JWT in the Authorization header.
 * Expected header: "Authorization: Bearer <token>"
 * Attaches the authenticated user (without password) to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
    console.log("AUTH HEADER:", req.headers.authorization); // 👈 ADD HERE

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Not authorized, user no longer exists");
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized, token failed or expired");
  }
});

module.exports = { protect };
