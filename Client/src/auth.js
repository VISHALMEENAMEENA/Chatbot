import axios from "axios";

// Dynamic API URL: use env var in production, fallback to relative path for dev
const API_URL = process.env.REACT_APP_API_URL || "/api/auth";

// Helper function to dispatch auth state changes
const notifyAuthChange = () => {
  window.dispatchEvent(new Event("authStateChanged"));
};

export const signup = async (name, email, password) => {
  try {
    const res = await axios.post(`${API_URL}/signup`, { name, email, password });

    if (res.data.token) {
      console.log("Signup successful, storing token");
      localStorage.setItem("auth_token", res.data.token);
      notifyAuthChange();
    }

    return res.data;
  } catch (error) {
    console.error("Signup Error:", error.response?.data || error.message);
    return {
      error:
        error.response?.data?.msg ||
        error.response?.data?.errors?.[0]?.msg ||
        "Signup failed",
    };
  }
};

export const login = async (email, password) => {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });

    if (res.data.token) {
      console.log("Login successful, storing token");
      localStorage.setItem("auth_token", res.data.token);
      notifyAuthChange();
    }

    return res.data;
  } catch (error) {
    console.error("Login Error:", error.response?.data || error.message);
    return {
      error: error.response?.data?.msg || "Login failed",
    };
  }
};

export const getCurrentUser = async () => {
  const token = localStorage.getItem("auth_token");
  if (!token) return null;

  try {
    const res = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return res.data;
  } catch (error) {
    console.error("Get User Error:", error.response?.data || error.message);

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
