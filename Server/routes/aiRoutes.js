const express = require("express");
const router = express.Router();
const axios = require("axios");
const { checkSystemHealth } = require("../utils/healthCheck");
const authMiddleware = require("../middleware/authMiddleware"); // still used for image generation

// Test route to confirm backend connection
router.post("/test", (req, res) => {
  res.json({ success: true, message: "Test route working ✅" });
});

// Configuration
const OLLAMA_HOST = process.env.OLLAMA_HOST || "http://localhost:11434";
const TIMEOUT = 30000; // 30 seconds

// Health Check Middleware
const healthCheck = async (req, res, next) => {
  try {
    await checkSystemHealth();
    next();
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "AI service unavailable",
      error: error.message,
      solutions: [
        "Check if Ollama is running",
        "Verify models are downloaded (ollama list)",
        "Restart the Ollama service"
      ]
    });
  }
};

// ✅ Public Chat Endpoint (no auth required)
router.post("/chat", healthCheck, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Prompt is required",
        errorCode: "MISSING_PROMPT"
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT);

    const response = await axios.post(`${OLLAMA_HOST}/api/generate`, {
      model: "mistral:latest",
      prompt: prompt.trim(),
      stream: false,
      options: {
        temperature: 0.7,
        num_ctx: 2048
      }
    }, {
      signal: controller.signal,
      timeout: TIMEOUT
    });

    clearTimeout(timeout);

    console.log("Full Ollama response data:", response.data);

    if (!response.data?.response) {
      console.error("Empty Ollama response:", response.data);
      return res.status(502).json({
        success: false,
        message: "AI service returned empty response",
        errorCode: "EMPTY_RESPONSE"
      });
    }

    res.json({
      success: true,
      response: response.data.response,
      model: "mistral:latest",
      metrics: {
        tokens: response.data.eval_count,
        duration: `${(response.data.eval_duration / 1e9).toFixed(2)}s`
      }
    });

  } catch (error) {
    console.error("Chat Error:", error);

    let statusCode = 500;
    let errorCode = "AI_SERVICE_ERROR";
    let message = "Chat processing failed";
    let solutions = ["Try again later", "Simplify your prompt"];

    if (error.code === "ECONNREFUSED") {
      statusCode = 503;
      errorCode = "OLLAMA_DOWN";
      message = "AI service unavailable";
      solutions = ["Start Ollama service", "Check connection"];
    } else if (error.code === "ECONNABORTED") {
      statusCode = 504;
      errorCode = "TIMEOUT";
      message = "Request timed out";
      solutions = ["Try a shorter prompt", "Wait and retry"];
    }

    res.status(statusCode).json({
      success: false,
      message,
      errorCode,
      solutions,
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
});

// Image Generation (still protected with auth)
router.post("/generate/image", authMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt?.trim() || prompt.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Prompt must be at least 5 characters",
        errorCode: "INVALID_PROMPT"
      });
    }

    if (!process.env.DEEPAI_API_KEY) {
      throw new Error("DeepAI API key not configured");
    }

    const response = await axios.post(
      "https://api.deepai.org/api/text2img",
      { text: prompt },
      {
        headers: { "api-key": process.env.DEEPAI_API_KEY },
        timeout: 45000
      }
    );

    if (!response.data?.output_url) {
      throw new Error("Invalid response from DeepAI");
    }

    res.json({
      success: true,
      imageUrl: response.data.output_url,
      generationTime: response.data.generation_time
    });

  } catch (error) {
    console.error("Image Generation Error:", error);
    res.status(500).json({
      success: false,
      message: "Image generation failed",
      errorCode: "IMAGE_GENERATION_ERROR",
      solutions: [
        "Check your API key",
        "Try a different prompt",
        "Wait and retry"
      ]
    });
  }
});

module.exports = router;
