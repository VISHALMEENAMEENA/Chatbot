const axios = require('axios');
const { execSync } = require('child_process');
const GeneratedContent = require('../models/GeneratedContent');


// Configuration
const CONFIG = {
  OLLAMA_HOST: process.env.OLLAMA_HOST || 'http://localhost:11434',
  TIMEOUT: 60000, // 60 seconds
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000 // 1 second
};


// System Check Utilities
const checkSystemHealth = async () => {
  try {
    // 1. Verify Ollama process
    let isRunning;
    if (process.platform === 'win32') {
      isRunning = execSync('tasklist').includes('ollama.exe');
    } else {
      isRunning = execSync('ps aux').includes('ollama serve');
    }


    if (!isRunning) throw new Error("Ollama process not running");


    // 2. Verify API connectivity
    const health = await axios.get(`${CONFIG.OLLAMA_HOST}`, { timeout: 2000 });
    if (health.data !== 'Ollama is running') throw new Error("Invalid Ollama response");


    // 3. Verify model availability
    const models = await axios.get(`${CONFIG.OLLAMA_HOST}/api/tags`, { timeout: 2000 });
    if (!models.data.models.some(m => m.name.includes('mistral'))) {
      throw new Error("Mistral model not loaded");
    }


    return true;
  } catch (error) {
    console.error("[SYSTEM_CHECK_FAILED]", error.message);
    throw error;
  }
};


// Enhanced Error Handler
const handleAIError = (error, context = "AI Generation") => {
  console.error(`[${context.toUpperCase()}_ERROR]`, {
    message: error.message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    response: error.response?.data
  });


  const solutions = [];
  const statusCode = error.response?.status || 500;


  // Common error solutions
  if (error.message.includes('ECONNREFUSED')) {
    solutions.push('Start Ollama service: `ollama serve`');
  }
  if (error.message.includes('model')) {
    solutions.push('Download model: `ollama pull mistral`');
  }
  if (error.message.includes('timeout')) {
    solutions.push('Increase timeout or simplify prompt');
  }


  return {
    statusCode,
    response: {
      success: false,
      error: error.message,
      solutions,
      timestamp: new Date().toISOString()
    }
  };
};


// Text Generation with Enhanced Reliability
exports.generateText = async (req, res) => {
  try {
    const { prompt } = req.body;


    // 1. Input Validation
    if (!prompt?.trim()) {
      return res.status(400).json({ 
        success: false,
        message: "Prompt cannot be empty",
        solutions: ["Provide a non-empty prompt"]
      });
    }


    // 2. System Health Check
    await checkSystemHealth();


    // 3. Request with Retry Mechanism
    let attempt = 0;
    let response;


    while (attempt <= CONFIG.MAX_RETRIES) {
      try {
        console.log(`[ATTEMPT ${attempt}] Sending to Ollama: ${prompt.substring(0, 30)}...`);
        
        response = await axios.post(
          `${CONFIG.OLLAMA_HOST}/api/generate`,
          {
            model: "mistral:latest", // Updated model name here
            prompt: prompt.trim(),
            stream: false,
            options: {
              temperature: 0.7,
              num_ctx: 2048,
              seed: Date.now() // Add variability
            }
          },
          {
            timeout: CONFIG.TIMEOUT,
            headers: { "Content-Type": "application/json" },
            transformRequest: [data => {
              console.debug("[REQUEST]", data);
              return data;
            }],
            transformResponse: [data => {
              console.debug("[RESPONSE]", data.length > 100 ? `${data.substring(0, 100)}...` : data);
              return data;
            }]
          }
        );


        // Validate response structure
        if (response.data?.response) break;


      } catch (error) {
        if (attempt === CONFIG.MAX_RETRIES) throw error;
        attempt++;
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }


    // 4. Handle Empty Responses
    if (!response?.data?.response) {
      console.error("[EMPTY_RESPONSE]", {
        request: { prompt_length: prompt.length },
        response_data: response?.data
      });
      throw new Error("AI service returned empty response");
    }


    // 5. Async Database Logging
    GeneratedContent.create({
      userId: req.user.id,
      type: 'text',
      prompt: prompt,
      data: response.data.response,
      metadata: {
        eval_count: response.data.eval_count,
        duration_ms: response.data.eval_duration / 1e6,
        model: "mistral:latest" // Keep this consistent
      }
    }).catch(err => console.error("[DB_SAFE_ERROR]", err));


    return res.json({
      success: true,
      response: response.data.response,
      metrics: {
        tokens: response.data.eval_count,
        duration: `${(response.data.eval_duration / 1e9).toFixed(2)}s`
      }
    });


  } catch (error) {
    const { statusCode, response: errorResponse } = handleAIError(error, "Text Generation");
    return res.status(statusCode).json(errorResponse);
  }
};


// Image Generation (Updated)
exports.generateImage = async (req, res) => {
  try {
    const { prompt } = req.body;


    // Input validation
    if (!prompt?.trim() || prompt.length < 5) {
      return res.status(400).json({ 
        success: false,
        message: "Prompt must be at least 5 characters"
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
        timeout: CONFIG.TIMEOUT
      }
    );


    if (!response.data?.output_url) {
      throw new Error("Invalid response from DeepAI");
    }


    // Async logging
    GeneratedContent.create({
      userId: req.user.id,
      type: 'image',
      prompt: prompt,
      url: response.data.output_url,
      metadata: {
        service: "DeepAI",
        generation_time: response.data.generation_time
      }
    }).catch(err => console.error("[DB_SAFE_ERROR]", err));


    return res.json({
      success: true,
      imageUrl: response.data.output_url
    });


  } catch (error) {
    const { statusCode, response: errorResponse } = handleAIError(error, "Image Generation");
    return res.status(statusCode).json(errorResponse);
  }
};


// System Status Endpoint
exports.getSystemStatus = async (req, res) => {
  try {
    const [ollamaStatus, modelStatus] = await Promise.all([
      axios.get(`${CONFIG.OLLAMA_HOST}`, { timeout: 2000 })
        .then(r => r.data === 'Ollama is running')
        .catch(() => false),
      axios.get(`${CONFIG.OLLAMA_HOST}/api/tags`, { timeout: 2000 })
        .then(r => r.data.models.some(m => m.name.includes('mistral')))
        .catch(() => false)
    ]);


    return res.json({
      success: true,
      ollama: {
        running: ollamaStatus,
        host: CONFIG.OLLAMA_HOST
      },
      models: {
        mistral: modelStatus,
        loaded: modelStatus ? "mistral:latest" : "none" // Consistent with model name
      },
      timestamp: new Date().toISOString()
    });


  } catch (error) {
    const { statusCode, response: errorResponse } = handleAIError(error, "System Check");
    return res.status(statusCode).json(errorResponse);
  }
};


// Keep other methods (generateVideo, generateAudio) as-is from your original file
