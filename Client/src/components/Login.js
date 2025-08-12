// src/components/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../auth";
import "./Login.css";

const Login = ({ setIsAuth, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.error) {
        setError(result.error);
      } else if (result.token) {
        console.log("Login successful, redirecting");
        
        // Update parent state
        setIsAuth(true);
        if (onLoginSuccess) {
          onLoginSuccess();
        }
        
        // Navigate to chat
        navigate("/chat", { replace: true });
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
      
      <p>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};

export default Login;