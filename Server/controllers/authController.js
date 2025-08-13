const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// User Signup
exports.signup = async (req, res) => {
  console.log("📩 Signup Request Received:", req.body);
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array() 
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ 
        success: false,
        message: "User already exists with this email" 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
    });

    await user.save();
    console.log("✅ User saved successfully:", { id: user._id, name: user.name, email: user.email });

    // Generate JWT Token
    const payload = { 
      user: { 
        id: user._id, 
        role: user.role,
        name: user.name,
        email: user.email
      } 
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
    
    console.log("✅ JWT Token Generated for signup");
    
    res.status(201).json({ 
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Signup Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during signup",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// User Login
exports.login = async (req, res) => {
  console.log("📩 Login Request Received:", req.body);
  
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log("❌ Validation errors:", errors.array());
      return res.status(400).json({ 
        success: false,
        message: "Validation failed",
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password mismatch for:", email);
      return res.status(400).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Generate JWT Token
    const payload = { 
      user: { 
        id: user._id, 
        role: user.role,
        name: user.name,
        email: user.email
      } 
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "24h" });
    
    console.log("✅ Login successful for:", email);
    
    res.json({ 
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Fetch a Single User
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
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
    console.error("❌ Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching user",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
