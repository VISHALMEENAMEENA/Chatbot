// src/components/UserList.js
import React, { useState, useEffect } from "react";
import { getToken } from "../auth"; // Import getToken
import "./UserList.css";

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(""); // State for errors

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      setError("");
      const token = getToken(); // Get token

      if (!token) {
        setError("Not authorized to view users.");
        setLoading(false);
        return;
      }

      try {
        // Correct endpoint for fetching all users (admin route)
        const response = await fetch("http://localhost:5000/api/auth/admin/users", {
          headers: {
            // Correct Authorization header format
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
           // Handle specific errors like 403 Forbidden (not admin)
           if (response.status === 403) {
               throw new Error("Access Denied: Admin role required.");
           }
           if (response.status === 401) {
               throw new Error("Authentication failed. Please log in again.");
           }
          throw new Error(`Failed to fetch users (${response.status})`);
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        setError(error.message); // Set specific error message
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []); // Empty dependency array means this runs once on mount

  return (
    <div className="user-list-container">
      <h2>User List (Admin View)</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">{error}</p>}
      {!loading && !error && users.length === 0 && <p>No users found.</p>}
      {!loading && !error && users.length > 0 && (
        <ul>
          {/* Ensure user object has _id, name, and email */}
          {users.map((user) => (
            <li key={user._id}>
              {user.name} ({user.email}) - Role: {user.role}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;