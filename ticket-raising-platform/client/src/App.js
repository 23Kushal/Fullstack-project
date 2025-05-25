import React, { useEffect } from 'react';
import { Routes, Route, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import MainLayout from './components/Layout/MainLayout';
import { Typography } from '@mui/material';

import LoginForm from './features/auth/LoginForm';
import RegisterForm from './features/auth/RegisterForm';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { fetchUserOnLoad } from './features/auth/authSlice';
import TicketList from './features/tickets/TicketList';
import CreateTicketForm from './features/tickets/CreateTicketForm';

// Placeholder Components (adjust as actual components are built)
const HomePage = () => <Typography variant="h4">Home Page / Dashboard</Typography>;
// const TicketListPage = () => <Typography variant="h4">Ticket List</Typography>; // Replaced
// const NewTicketPage = () => <Typography variant="h4">New Ticket Form</Typography>; // Replaced
const TicketDetailPage = () => {
    const { id } = useParams();
    return (<Typography variant="h4">Details for Ticket {id}</Typography>);
};
const AdminUserManagementPage = () => <Typography variant="h4">Admin: User Management</Typography>;
const UnauthorizedPage = () => <Typography variant="h4">403 - Unauthorized</Typography>;
const NotFoundPage = () => <Typography variant="h4">404 Not Found</Typography>;

function App() {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(fetchUserOnLoad());
    }, [dispatch]);

    return (
        <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginForm />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* Routes protected by MainLayout and potentially ProtectedRoute */}
            <Route element={<MainLayout />}>
                {/* Routes requiring generic authentication */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/tickets" element={<TicketList />} />
                    <Route path="/tickets/new" element={<CreateTicketForm />} />
                    <Route path="/tickets/:id" element={<TicketDetailPage />} />
                </Route>

                {/* Routes requiring admin role */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/users" element={<AdminUserManagementPage />} />
                </Route>
                
                {/* Fallback for routes within MainLayout not matched elsewhere */}
                {/* This assumes MainLayout itself doesn't have a path, so it acts as a layout wrapper */}
                {/* If MainLayout was on a path like /app/*, this '*' would be relative to /app */}
                 <Route path="*" element={<NotFoundPage />} /> 
            </Route>
            
            {/* Fallback for any routes not matched at all (e.g. if MainLayout had a path) */}
            {/* <Route path="*" element={<NotFoundPage />} /> */}
            {/* Note: The above global NotFoundPage might be redundant if MainLayout's "*" handles all non-matched cases within its scope.
                For a typical CRA setup where MainLayout is the root wrapper (or part of it), the one inside MainLayout is often sufficient.
                If you have routes completely outside MainLayout, a global one might be needed.
                For this task, the one inside MainLayout's scope is fine.
            */}
        </Routes>
    );
}
export default App;
