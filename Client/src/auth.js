import axios from "axios";

// Dynamic API URL: use your deployed backend URL
const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/auth`
  : "https://chatbot-kspv.vercel.app/api/auth";

console.log('Auth API URL:', API_URL);

// Helper function to dispatch auth state changes
const notifyAuthChange = () => {
  window.dispatchEvent(new Event("authStateChanged"));
};

export const signup = async (name, email, password) => {
  try {
    console.log('Signup attempt to:', `${API_URL}/signup`);
    const res = await axios.post(`${API_URL}/signup`, 
      { name, email, password },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    if (res.data.token) {
      console.log("Signup successful, storing token");
      localStorage.setItem("auth_token", res.data.token);
      notifyAuthChange();
    }
    
    console.log('Signup response:', res.data);
    return res.data;
  } catch (error) {
    console.error("Signup Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    return {
      error:
        error.response?.data?.message ||
        error.response?.data?.msg ||
        error.response?.data?.errors?.[0]?.msg ||
        "Signup failed. Please try again.",
    };
  }
};

export const login = async (email, password) => {
  try {
    console.log('Login attempt to:', `${API_URL}/login`);
    const res = await axios.post(`${API_URL}/login`, 
      { email, password },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      }
    );
    
    if (res.data.token) {
      console.log("Login successful, storing token");
      localStorage.setItem("auth_token", res.data.token);
      notifyAuthChange();
    }
    
    console.log('Login response:', res.data);
    return res.data;
  } catch (error) {
    console.error("Login Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      url: error.config?.url
    });
    
    return {
      error: 
        error.response?.data?.message || 
        error.response?.data?.msg || 
        "Login failed. Please check your credentials.",
    };
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    console.log('No auth token found');
    return null;
  }

  try {
    console.log('Getting current user from:', `${API_URL}/me`);
    const res = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('Get user response:', res.data);
    return res.data;
  } catch (error) {
    console.error("Get User Error:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    if (error.response?.status === 401 || error.response?.status === 404) {
      console.log("Token invalid, logging out");
      logout();
    }
    return null;
  }
};

export const isAuthenticated = () => {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    return false;
  }
  
  try {
    // Decode JWT to check expiration
    const payload = JSON.parse(atob(token.split(".")[1]));
    const now = Date.now() / 1000;
    
    if (payload.exp < now) {
      console.log("Token expired");
      localStorage.removeItem("auth_token");
      return false;
    }
    
    return true;
  } catch (error) {
    console.log("Invalid token format");
    localStorage.removeItem("auth_token");
    return false;
  }
};

export const logout = () => {
  console.log("Logging out user");
  localStorage.removeItem("auth_token");
  notifyAuthChange();
};

export const getToken = () => {
  return localStorage.getItem("auth_token");
};

// Test connection function
export const testConnection = async () => {
  try {
    console.log('Testing connection to:', API_URL.replace('/auth', '/health'));
    const response = await axios.get(API_URL.replace('/auth', '/health'), {
      timeout: 10000
    });
    console.log('Connection test successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data 
    };
  }
};
