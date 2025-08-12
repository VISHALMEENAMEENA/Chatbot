require("dotenv").config(); // Load environment variables

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const aiRoutes = require("./routes/aiRoutes"); // ✅ Import AI routes

const app = express();

// Middleware (Order matters)
app.use(express.json()); // Parse JSON body first
app.use(cors()); // Enable CORS

// Load environment variables
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

// Ensure environment variables are loaded
if (!MONGO_URI || !JWT_SECRET) {
  console.error("❌ Missing environment variables! Check your .env file.");
  process.exit(1);
}

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("🔥 MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/ai", aiRoutes); // ✅ Now it will work

// Default route
app.get("/", (req, res) => {
  res.send("Welcome to the Generative AI Backend!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
