const express = require("express");
const { upload } = require("../middleware/uploadMiddleware");
const User = require("../models/User");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  googleLogin, 
  facebookLogin,
  deleteAccount,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/google", googleLogin);   // ← yeh route add karo

router.get("/profile", protect, getProfile);
router.put("/profile", protect, upload.single("avatar"), updateProfile);
router.delete("/account", protect, deleteAccount);
router.post("/facebook", facebookLogin);
// PUT /api/auth/remove-avatar
router.put('/remove-avatar', protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: '' },
      { new: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
module.exports = router;
