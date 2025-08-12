import axios from 'axios';

// Configuration
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  TIMEOUT: 30000, // 30 seconds
  AUTH_TOKEN_KEY: 'auth_token'
};

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
      console.error('No response received:', error.request);
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
      const response = await api.post('/auth/signup', { name, email, password });
      return response.data;
    } catch (error) {
      return {
        error: error.response?.data?.message || 'Signup failed',
        details: error.response?.data?.errors
      };
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      localStorage.setItem(API_CONFIG.AUTH_TOKEN_KEY, response.data.token);
      return response.data;
    } catch (error) {
      return {
        error: error.response?.data?.message || 'Login failed',
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
      return {
        error: error.response?.data?.message || 'Failed to fetch user',
        details: error.response?.data?.errors
      };
    }
  }
};

// AI API
export const aiApi = {
  chat: async (prompt) => {
    try {
      const response = await api.post('/ai/chat', { prompt });
      return response.data;
    } catch (error) {
      return {
        error: error.response?.data?.message || 'AI service unavailable',
        solutions: error.response?.data?.solutions || ['Try again later'],
        code: error.response?.data?.errorCode
      };
    }
  },

  generateImage: async (prompt) => {
    try {
      const response = await api.post('/ai/generate/image', { prompt });
      return response.data;
    } catch (error) {
      return {
        error: error.response?.data?.message || 'Image generation failed',
        solutions: error.response?.data?.solutions || ['Try a different prompt'],
        code: error.response?.data?.errorCode
      };
    }
  }
};

// Utility Functions
export const isAuthenticated = () => {
  return !!localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
};

export const getAuthToken = () => {
  return localStorage.getItem(API_CONFIG.AUTH_TOKEN_KEY);
};

// For testing connection
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return {
      error: 'API service unavailable',
      details: error.message
    };
  }
};