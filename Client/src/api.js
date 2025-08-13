import axios from 'axios';

// Configuration - FIXED
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'https://chatbot-kspv.vercel.app/api',
  TIMEOUT: 30000, // 30 seconds
  AUTH_TOKEN_KEY: 'auth_token'
};

console.log('API Configuration:', {
  BASE_URL: API_CONFIG.BASE_URL,
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL
});

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for CORS
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Making request to:', config.baseURL + config.url);
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log('API Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.message,
      url: error.config?.url,
      data: error.response?.data
    });

    if (error.response) {
      // Handle specific status codes
      switch (error.response.status) {
        case 401:
          console.error('Unauthorized - Redirecting to login');
          localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
          window.location.href = '/login';
          break;
        case 403:
          console.error('Forbidden - Insufficient permissions');
          break;
        case 404:
          console.error('API endpoint not found');
          break;
        case 500:
          console.error('Server error');
          break;
        default:
          console.error('API request failed');
      }
    } else if (error.request) {
      console.error('No response received - Network or CORS issue:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  signup: async (name, email, password) => {
    try {
      console.log('Attempting signup...');
      const response = await api.post('/auth/signup', { name, email, password });
      console.log('Signup successful:', response.data);
      
      if (response.data.token) {
        localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Signup failed:', error);
      return {
        error: error.response?.data?.message || error.response?.data?.msg || 'Signup failed',
        details: error.response?.data?.errors
      };
    }
  },

  login: async (email, password) => {
    try {
      console.log('Attempting login...');
      const response = await api.post('/auth/login', { email, password });
      console.log('Login successful:', response.data);
      
      if (response.data.token) {
        localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, response.data.token);
      }
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      return {
        error: error.response?.data?.message || error.response?.data?.msg || 'Login failed',
        details: error.response?.data?.errors
      };
    }
  },

  logout: () => {
    localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Get current user failed:', error);
      return {
        error: error.response?.data?.message || error.response?.data?.msg || 'Failed to fetch user',
        details: error.response?.data?.errors
      };
    }
  }
};

// AI API
export const aiApi = {
  chat: async (prompt) => {
    try {
      console.log('Sending chat request...');
      const response = await api.post('/ai/chat', { prompt });
      console.log('Chat response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('AI chat failed:', error);
      return {
        error: error.response?.data?.message || error.response?.data?.msg || 'AI service unavailable',
        solutions: error.response?.data?.solutions || ['Try again later'],
        code: error.response?.data?.errorCode
      };
    }
  },

  generateImage: async (prompt) => {
    try {
      console.log('Sending image generation request...');
      const response = await api.post('/ai/generate/image', { prompt });
      console.log('Image generation response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('Image generation failed:', error);
      return {
        error: error.response?.data?.message || error.response?.data?.msg || 'Image generation failed',
        solutions: error.response?.data?.solutions || ['Try a different prompt'],
        code: error.response?.data?.errorCode
      };
    }
  }
};

// Utility Functions
export const isAuthenticated = () => {
  const token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
  if (!token) return false;
  
  try {
    // Decode JWT to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Date.now() / 1000;
    
    if (payload.exp < now) {
      console.log('Token expired');
      localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
      return false;
    }
    
    return true;
  } catch (error) {
    console.log('Invalid token format');
    localStorage.removeItem(API_CONFIG.AUTH_TOKEN_KEY);
    return false;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
};

// For testing connection
export const checkApiHealth = async () => {
  try {
    console.log('Checking API health...');
    const response = await api.get('/health');
    console.log('Health check successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      error: 'API service unavailable',
      details: error.message,
      status: 'unhealthy'
    };
  }
};
