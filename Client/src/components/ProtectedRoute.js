// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../auth'; // Use your auth check function

const ProtectedRoute = () => {
    const auth = isAuthenticated(); // Check if the user is authenticated

    // If authenticated, render the child routes (Outlet)
    // Otherwise, redirect to the login page
    return auth ? <Outlet /> : <Navigate to="/login" />;
};

export default ProtectedRoute;