// src/components/Navbar.js
import React from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = ({ isAuth, onLogout }) => {
  const handleLogout = () => {
    console.log("Navbar: Logout clicked");
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <nav className="navbar">
      <Link to={isAuth ? "/chat" : "/login"}>
        <h1>My AI App</h1>
      </Link>

      <div className="nav-buttons">
        {isAuth ? (
          <>
            
            <Link to="/dashboard">
              <button>Dashboard</button>
            </Link>
            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login">
              <button>Login</button>
            </Link>
            <Link to="/signup">
              <button>Signup</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;