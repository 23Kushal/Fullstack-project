import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
    const { token, user } = useSelector((state) => state.auth);
    const location = useLocation();

    if (!token) {
        // User not logged in, redirect to login page
        // Pass the current location so users can be redirected back after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // User is logged in, but does not have the required role
        // Redirect to an unauthorized page or home page
        return <Navigate to="/unauthorized" state={{ from: location }} replace />; 
        // Or: return <Navigate to="/" replace />; 
    }

    // User is logged in and has the required role (or no specific role is required for this route)
    return <Outlet />; // Render the child route/component
};

export default ProtectedRoute;
