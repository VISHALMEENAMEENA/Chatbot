// src/App.js
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./components/Login";
import Signup from "./components/Signup2";
import Dashboard from "./components/Dashboard";
import MainLayout from "./components/MainLayout";
import { isAuthenticated, logout } from "./auth";

// Protects routes that require login
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
};

// Redirects authenticated users away from login/signup
const PublicRoute = ({ children }) => {
  return !isAuthenticated() ? children : <Navigate to="/chat" replace />;
};

const App = () => {
  const [isAuth, setIsAuth] = useState(isAuthenticated());

  // Function to update auth state
  const updateAuthState = () => {
    const authStatus = isAuthenticated();
    console.log("Updating auth state:", authStatus);
    setIsAuth(authStatus);
  };

  useEffect(() => {
    // Initial auth check
    updateAuthState();

    // Listen for storage changes (for logout from other tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'auth_token') {
        updateAuthState();
      }
    };

    // Custom event listener for auth state changes
    const handleAuthChange = () => {
      updateAuthState();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("authStateChanged", handleAuthChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("authStateChanged", handleAuthChange);
    };
  }, []);

  const handleLogout = () => {
    console.log("Logout initiated");
    logout();
    setIsAuth(false);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  const handleLoginSuccess = () => {
    console.log("Login success callback");
    setIsAuth(true);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('authStateChanged'));
  };

  console.log("App render - isAuth:", isAuth);

  return (
    <Router>
      <Routes>
        {/* Public routes - redirect if authenticated */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login setIsAuth={setIsAuth} onLoginSuccess={handleLoginSuccess} />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup setIsAuth={setIsAuth} onSignupSuccess={handleLoginSuccess} />
            </PublicRoute>
          } 
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Navigate to="/chat" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <MainLayout isAuth={isAuth} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout isAuth={isAuth} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route 
          path="*" 
          element={<Navigate to={isAuth ? "/chat" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
};

export default App;