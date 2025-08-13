const express = require("express");
const { check } = require("express-validator");
const { signup, login, getUserById } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const User = require("../models/User");

const router = express.Router();

// Debugging middleware
router.use((req, res, next) => {
  console.log(`📩 [${req.method}] ${req.originalUrl}`);
  console.log("Request body:", req.body);
  console.log("Headers:", req.headers);
  next();
});

// Test route
router.get("/test", (req, res) => {
  res.json({ 
    success: true, 
    message: "Auth routes working ✅",
    timestamp: new Date().toISOString()
  });
});

// ✅ Signup Route
router.post(
  "/signup",
  [
    check("name", "Name is required and should be at least 2 characters")
      .isLength({ min: 2 })
      .trim(),
    check("email", "Please include a valid email")
      .isEmail()
      .normalizeEmail(),
    check("password", "Password must be at least 6 characters")
      .isLength({ min: 6 }),
  ],
  async (req, res) => {
    console.log("🚀 Signup route hit with body:", req.body);
    await signup(req, res);
  }
);

// ✅ Login Route
router.post(
  "/login",
  [
    check("email", "Please include a valid email")
      .isEmail()
      .normalizeEmail(),
    check("password", "Password is required")
      .exists()
      .notEmpty(),
  ],
  async (req, res) => {
    console.log("🚀 Login route hit with body:", req.body);
    await login(req, res);
  }
);

// 🔒 Protected Route: Fetch Current User
router.get("/me", authMiddleware, async (req, res) => {
  try {
    console.log("🔍 Fetching current user for ID:", req.user.id);
    
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }
    
    res.json({
      success: true,
      user: user
    });
  } catch (error) {
    console.error("❌ Error fetching current user:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// 🔒 Admin Route: Get User by ID
router.get("/user/:id", authMiddleware, roleMiddleware('admin'), getUserById);

// 🔒 Admin Route: Get All Users
router.get("/admin/users", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    console.log("🔍 Admin fetching all users");
    
    const users = await User.find().select("-password");
    res.json({
      success: true,
      count: users.length,
      users: users
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
