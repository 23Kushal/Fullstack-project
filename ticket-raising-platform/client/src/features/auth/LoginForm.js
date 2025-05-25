import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser, resetAuthStatus } from './authSlice';
import { TextField, Button, Container, Typography, Box, CircularProgress, Alert } from '@mui/material';

const LoginForm = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, token, status, error } = useSelector((state) => state.auth);

    useEffect(() => {
        // Reset status when component mounts or form changes, to clear previous errors
        // Only reset if the status is failed, to avoid clearing loading/succeeded too early
        if (status === 'failed') {
            dispatch(resetAuthStatus());
        }
    }, [dispatch, status]); // Add status to dependency array to react to its changes

    useEffect(() => {
        if (token && user) { // Successfully logged in
            navigate('/');
        }
    }, [token, user, navigate]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Optionally, dispatch resetAuthStatus here if you want errors to clear on typing
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
        dispatch(loginUser(formData));
    };

    return (
        <Container maxWidth="xs">
            <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography component="h1" variant="h5">Login</Typography>
                {status === 'failed' && error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                    <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={formData.email} onChange={handleChange} />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={formData.password} onChange={handleChange} />
                    <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }} disabled={status === 'loading'}>
                        {status === 'loading' ? <CircularProgress size={24} /> : 'Login'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};
export default LoginForm;
