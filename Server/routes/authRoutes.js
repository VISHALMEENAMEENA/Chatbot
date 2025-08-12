const express = require("express");
const { check } = require("express-validator");
const { signup, login, getUserById } = require("../controllers/authController"); // Import getUserById
const authMiddleware = require("../middleware/authMiddleware"); // Authentication middleware
const roleMiddleware = require("../middleware/roleMiddleware"); // Role-based access middleware
const User = require("../models/User"); // User model

const router = express.Router();

// Debugging: Log request method and body for all requests
router.use((req, res, next) => {
  console.log(`📩 [${req.method}] ${req.url} - Request Body:`, req.body);
  next();
});

router.get("/user/:id", authMiddleware, roleMiddleware('admin'), getUserById); // Ensure only admins can fetch other users

// ✅ Admin-Only Route: Fetch All Users
router.get("/admin/users", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude passwords
    res.json(users);
  } catch (error) {
    console.error("❌ Error fetching users:", error.message);
    res.status(500).send("Server Error");
  }
});

// 🔒 Protected Route: Fetch Logged-in User's Own Data
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error.message);
    res.status(500).send("Server Error");
  }
});

// ✅ Signup Route
router.post(
  "/signup",
  [
    check("name", "Name is required").not().isEmpty(),
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password must be at least 6 characters").isLength({ min: 6 }),
  ],
  signup
);

// ✅ Login Route
router.post(
  "/login",
  [
    check("email", "Please include a valid email").isEmail(),
    check("password", "Password is required").exists(),
  ],
  login
);

module.exports = router;