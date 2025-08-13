require("dotenv").config(); // Load environment variables first
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Create Express app
const app = express();

// Load environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
// Add this after your existing routes in index.js

// Test database connection
app.get("/api/test-db", async (req, res) => {
  try {
    const User = require("./models/User");
    const count = await User.countDocuments();
    res.json({
      success: true,
      message: "Database connected successfully",
      userCount: count,
      mongoUri: process.env.MONGO_URI ? "Set" : "Not set",
      jwtSecret: process.env.JWT_SECRET ? "Set" : "Not set"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

// Test signup route
app.post("/api/test-signup", async (req, res) => {
  try {
    const testUser = {
      name: "Test User",
      email: "test@example.com",
      password: "password123"
    };
    
    res.json({
      success: true,
      message: "Signup route is accessible",
      testData: testUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Ensure environment variables are loaded
if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ Missing environment variables! Check your .env file.");
  process.exit(1);
}

// CORS Configuration - FIXED
app.use(cors({
  origin: [
    "https://chatbot-sjvh-frontend.vercel.app",
    "http://localhost:3000"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware (Order matters)
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("🔥 MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to the Generative AI Backend!",
    status: "Server is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "OK",
    message: "API is healthy",
    timestamp: new Date().toISOString()
  });
});

// Import and use routes
try {
  const authRoutes = require("./routes/authRoutes");
  const aiRoutes = require("./routes/aiRoutes");
  
  app.use("/api/auth", authRoutes);
  app.use("/api/ai", aiRoutes);
  
  console.log("✅ Routes loaded successfully");
} catch (error) {
  console.error("❌ Error loading routes:", error.message);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error:", err);
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Start the server
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

// For Vercel serverless deployment
module.exports = app;
