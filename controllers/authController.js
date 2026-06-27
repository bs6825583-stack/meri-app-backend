const crypto = require("crypto");
const asyncHandler = require("../utils/asyncHandler");
const generateToken = require("../utils/generateToken");
const User = require("../models/User");
const { sendEmail } = require("../services/emailService");
const { processFiles } = require("../services/cloudinaryService");
const { default: fetch } = require("node-fetch"); // agar already import nahi hai

// Build a safe public user object (no password)
const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
  createdAt: user.createdAt,
});

// @desc   Register a new user
// @route  POST /api/auth/register
// @access Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error("Please provide name, email and password");
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  // Only allow tourist/local on signup; admin must be set manually.
  const safeRole = ["tourist", "local"].includes(role) ? role : "tourist";

  const user = await User.create({ name, email, password, role: safeRole });

  res.status(201).json({
    success: true,
    token: generateToken(user._id),
    user: publicUser(user),
  });
});

// @desc   Login user
// @route  POST /api/auth/login
// @access Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password"
  );

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  res.json({
    success: true,
    token: generateToken(user._id),
    user: publicUser(user),
  });
});

// @desc   Get current user profile
// @route  GET /api/auth/profile
// @access Private
const getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, user: publicUser(req.user) });
});

// @desc   Update profile (name / avatar)
// @route  PUT /api/auth/profile
// @access Private
const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  if (req.body.name) user.name = req.body.name;
  if (req.body.password) user.password = req.body.password; // re-hashed by pre-save

  // Agar nayi photo upload hui hai to use Cloudinary pe bhej kar URL save karo
  if (req.file) {
    const uploaded = await processFiles([req.file]);
    user.avatar = uploaded[0].url;
  } else if (req.body.avatar !== undefined) {
    user.avatar = req.body.avatar;
  }

  await user.save();
  res.json({ success: true, user: publicUser(user) });
});

// @desc   Forgot password — generate reset token and email it
// @route  POST /api/auth/forgot-password
// @access Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error("Please provide your email");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way to avoid leaking which emails exist.
  if (!user) {
    return res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const clientUrl =
    process.env.CLIENT_URL && process.env.CLIENT_URL !== "*"
      ? process.env.CLIENT_URL
      : `http://localhost:${process.env.PORT || 5000}`;
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request",
      text: `You requested a password reset. Use this token to reset your password: ${resetToken}\n\nOr open: ${resetUrl}\n\nThis link expires in 15 minutes.`,
      html: `<p>You requested a password reset.</p>
             <p>Your reset token: <b>${resetToken}</b></p>
             <p>Or click: <a href="${resetUrl}">${resetUrl}</a></p>
             <p>This link expires in 15 minutes.</p>`,
    });

    res.json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
      // Returned only in development for easy testing:
      ...(process.env.NODE_ENV !== "production" && { resetToken }),
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    res.status(500);
    throw new Error("Email could not be sent");
  }
});

// @desc   Reset password using token
// @route  POST /api/auth/reset-password/:token
// @access Public
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const { token } = req.params;

  if (!password) {
    res.status(400);
    throw new Error("Please provide a new password");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error("Invalid or expired reset token");
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  res.json({
    success: true,
    message: "Password reset successful",
    token: generateToken(user._id),
    user: publicUser(user),
  });
});
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Google token is required");
  }

  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { email, name, picture } = payload;

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      avatar: picture,
      password: crypto.randomBytes(20).toString("hex"), // random password
      role: "tourist",
    });
  }

  res.json({
    success: true,
    data: {
      token: generateToken(user._id),
      role: user.role,
      ...publicUser(user),
    },
  });
});

const facebookLogin = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    res.status(400);
    throw new Error("Facebook token is required");
  }

  // Facebook se user ka data verify karte hue fetch karo
  const fbResponse = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
  );
  const fbData = await fbResponse.json();

  if (fbData.error) {
    res.status(401);
    throw new Error("Invalid Facebook token");
  }

  const { email, name, picture } = fbData;

  if (!email) {
    res.status(400);
    throw new Error("Facebook account has no email associated");
  }

  let user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    user = await User.create({
      name,
      email: email.toLowerCase(),
      avatar: picture?.data?.url || "",
      password: crypto.randomBytes(20).toString("hex"),
      role: "tourist",
    });
  }

  res.json({
    success: true,
    data: {
      token: generateToken(user._id),
      role: user.role,
      ...publicUser(user),
    },
  });
});


const deleteAccount = asyncHandler(async (req, res) => {
  const user = req.user;
  await user.deleteOne();
  res.json({ success: true, message: "Account deleted successfully" });
});
module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleLogin,    // ← yeh add karo
  deleteAccount,  
  facebookLogin,// ← yeh add karo

};
