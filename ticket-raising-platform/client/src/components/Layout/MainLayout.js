import React from 'react';
import { Outlet, Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../features/auth/authSlice';
import { AppBar, Toolbar, Typography, Button, Container, Box } from '@mui/material';

const MainLayout = () => {
    const { user, token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        dispatch(logoutUser());
        navigate('/login');
    };

    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6" component={RouterLink} to="/" sx={{ flexGrow: 1, color: 'inherit', textDecoration: 'none' }}>
                        Ticket Platform
                    </Typography>
                    {token && user ? (
                        <>
                            <Typography sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}> 
                                {/* Hide username on extra small screens if it causes overflow */}
                                Welcome, {user.username}!
                            </Typography>
                            <Button color="inherit" component={RouterLink} to="/">Dashboard</Button>
                            <Button color="inherit" component={RouterLink} to="/tickets/new">New Ticket</Button>
                            {user.role === 'admin' && (
                                <Button color="inherit" component={RouterLink} to="/admin/users">Admin Users</Button>
                            )}
                            <Button color="inherit" onClick={handleLogout}>Logout</Button>
                        </>
                    ) : (
                        <>
                            <Button color="inherit" component={RouterLink} to="/login">Login</Button>
                            <Button color="inherit" component={RouterLink} to="/register">Register</Button>
                        </>
                    )}
                </Toolbar>
            </AppBar>
            <Container sx={{ mt: 4 }}>
                <Outlet /> {/* Child routes will render here */}
            </Container>
        </>
    );
};
export default MainLayout;
