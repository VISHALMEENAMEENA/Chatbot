// src/components/Signup.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signup } from "../auth";
import "./Signup2.css";

const Signup = ({ setIsAuth, onSignupSuccess }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signup(name, email, password);

      if (result.error) {
        setError(result.error);
      } else if (result.token) {
        console.log("Signup successful, redirecting");
        
        // Update parent state
        setIsAuth(true);
        if (onSignupSuccess) {
          onSignupSuccess();
        }
        
        // Navigate to chat
        navigate("/chat", { replace: true });
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setError("An error occurred during signup.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Create Account</h2>
      <form onSubmit={handleSignup}>
        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
        />
        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Create Account"}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
};

export default Signup;