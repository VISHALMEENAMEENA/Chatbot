const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// User Signup
exports.signup = async (req, res) => {
  console.log("📩 Signup Request Received:", req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, role } = req.body; // Accept role from request

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user with role (default to "user" if not provided)
    user = new User({
      name,
      email,
      password: hashedPassword,
      role: role || "user", // Assign role
    });

    await user.save();
    console.log("✅ User saved in DB:", user);


    // Generate JWT Token with role
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    console.log("✅ JWT Token Generated:", token);
    
    res.json({ token });
  } catch (error) {
    console.error("❌ Error in Signup:", error.message);
    res.status(500).send("Server Error");
  }
};

// User Login
exports.login = async (req, res) => {
  console.log("📩 Login Request Received:", req.body);

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found with email:", email);
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log("❌ Password mismatch for user:", email);
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    // Generate JWT Token with role
    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
    
    console.log("✅ Login successful, token:", token);
    res.json({ token });
  } catch (error) {
    console.error("❌ Error in Login:", error.message);
    res.status(500).send("Server Error");
  }
};

// Fetch a Single User
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("❌ Error fetching user:", error.message);
    res.status(500).send("Server Error");
  }
};