// utils/healthCheck.js
const axios = require('axios');
const { execSync } = require('child_process');

// Configuration - adjust as needed or import from a config file
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';

// Health check function for the AI service (Ollama)
const checkSystemHealth = async () => {
  try {
    // 1. Verify Ollama process is running
    let isRunning;
    if (process.platform === 'win32') {
      isRunning = execSync('tasklist').toString().includes('ollama.exe');
    } else {
      isRunning = execSync('ps aux').toString().includes('ollama serve');
    }

    if (!isRunning) {
      throw new Error("Ollama process not running");
    }

    // 2. Verify API connectivity
    const health = await axios.get(`${OLLAMA_HOST}`, { timeout: 2000 });
    if (health.data !== 'Ollama is running') {
      throw new Error("Invalid Ollama response");
    }

    // 3. Verify model availability (if needed)
    const models = await axios.get(`${OLLAMA_HOST}/api/tags`, { timeout: 2000 });
    if (!models.data.models.some(m => m.name.includes('mistral'))) {
      throw new Error("Mistral model not loaded");
    }

    return true;
  } catch (error) {
    console.error("[SYSTEM_CHECK_FAILED]", error.message);
    throw error;
  }
};

module.exports = { checkSystemHealth };
