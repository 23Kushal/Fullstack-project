import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom'; // useLocation for query params
import { registerUser, resetAuthStatus } from './authSlice';
import { TextField, Button, Container, Typography, Box, CircularProgress, Alert } from '@mui/material';

const RegisterForm = () => {
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation(); // For potential query params like ?registered=true
    const { user, token, status, error } = useSelector((state) => state.auth);

    useEffect(() => {
        // Reset status when component mounts, to clear previous errors/status from other pages
        // or from a previous attempt on this page if it was navigated away from and back.
        dispatch(resetAuthStatus());
    }, [dispatch]);

    useEffect(() => {
        if (status === 'succeeded') {
            // If registration leads to auto-login (token and user are set)
            if (token && user) {
                navigate('/'); // Navigate to dashboard
            } else {
                // If registration was successful but doesn't auto-login (e.g., requires email verification)
                // Or if the API for register just returns a success message without a token immediately
                navigate('/login?registered=true'); // Redirect to login, possibly with a success message
            }
        }
    }, [status, token, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Optionally clear errors on typing
        // if (status === 'failed') {
        //     dispatch(resetAuthStatus());
        // }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Ensure previous errors are cleared before a new submission attempt
        if (status === 'failed') {
           dispatch(resetAuthStatus());
        }
        dispatch(registerUser(formData));
    };

    // Check for registration success message from query params (optional)
    const queryParams = new URLSearchParams(location.search);
    const isRegistered = queryParams.get('registered') === 'true';


    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Register</Typography>
                {isRegistered && status !== 'failed' && ( // Show only if not currently an error
                    <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
                        Registration successful! Please login.
                    </Alert>
                )}
                {status === 'failed' && error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField margin="normal" required fullWidth id="username" label="Username" name="username" autoComplete="username" autoFocus value={formData.username} onChange={handleChange} />
                    <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" value={formData.email} onChange={handleChange} />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" value={formData.password} onChange={handleChange} />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={status === 'loading'}>
                        {status === 'loading' ? <CircularProgress size={24} /> : 'Register'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};
export default RegisterForm;
