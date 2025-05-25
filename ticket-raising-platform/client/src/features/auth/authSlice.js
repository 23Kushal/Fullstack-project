import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from './authService';

// Helper function to get user from token (can be expanded)
const getUserFromToken = (token) => {
    if (token) {
        try {
            // In a real app, you might decode the token to get basic user info
            // or fetch user details from the server. For now, we'll just indicate
            // a user exists if a token is present.
            // The actual user object will be populated by login or getMe.
            return { tokenPresent: true }; // Placeholder
        } catch (e) {
            return null;
        }
    }
    return null;
};

const initialState = {
    user: null, // Will hold user object { id, username, email, role } after login/getMe
    token: localStorage.getItem('token') || null,
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// Async Thunks
export const registerUser = createAsyncThunk(
    'auth/registerUser',
    async (userData, thunkAPI) => {
        try {
            const data = await authService.register(userData);
            // Assuming register service already stored token in localStorage
            // Optionally, fetch user details after registration if API returns full user object
            // Or if API only returns token, then call getMe
            if (data.token) {
                 const userDetails = await authService.getMe(data.token); // Fetch user details
                 return { token: data.token, user: userDetails };
            }
            return data; // Should include token and potentially user
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.errors && error.response.data.errors[0] && error.response.data.errors[0].msg) ||
                            (error.response && error.response.data && error.response.data.msg) ||
                            error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const loginUser = createAsyncThunk(
    'auth/loginUser',
    async (userData, thunkAPI) => {
        try {
            const data = await authService.login(userData); // data should contain { token }
            // authService.login already stores token in localStorage
            if (data.token) {
                const userDetails = await authService.getMe(data.token); // Fetch user details
                return { token: data.token, user: userDetails };
            }
            // If login doesn't return token or user immediately, adjust accordingly
            return data; // This should include the user object and token
        } catch (error) {
             const message = (error.response && error.response.data && error.response.data.errors && error.response.data.errors[0] && error.response.data.errors[0].msg) ||
                            (error.response && error.response.data && error.response.data.msg) ||
                            error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Thunk to fetch user details if token exists (e.g., on app load)
export const fetchUserOnLoad = createAsyncThunk(
    'auth/fetchUserOnLoad',
    async (_, thunkAPI) => {
        const token = thunkAPI.getState().auth.token;
        if (token) {
            try {
                const userDetails = await authService.getMe(token);
                return { user: userDetails };
            } catch (error) {
                const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
                authService.logout(); // Token might be invalid, so log out
                return thunkAPI.rejectWithValue(message);
            }
        }
        return thunkAPI.rejectWithValue('No token found');
    }
);


const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logoutUser: (state) => {
            authService.logout(); // Clears token from localStorage
            state.user = null;
            state.token = null;
            state.status = 'idle';
            state.error = null;
        },
        resetAuthStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(registerUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.token = action.payload.token;
                state.user = action.payload.user; // Assuming payload is { token, user }
                state.error = null;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.user = null;
                state.token = null; // Ensure token is cleared on failed registration
            })
            // Login
            .addCase(loginUser.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.token = action.payload.token;
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
                state.user = null;
                state.token = null; // Ensure token is cleared on failed login
            })
            // Fetch User On Load
            .addCase(fetchUserOnLoad.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchUserOnLoad.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.user = action.payload.user;
                state.error = null;
            })
            .addCase(fetchUserOnLoad.rejected, (state, action) => {
                state.status = 'failed';
                // Keep token if exists? No, if fetch fails, token might be invalid.
                // authService.logout() is called in thunk for this case.
                state.user = null;
                state.token = null; 
                state.error = action.payload === 'No token found' ? null : action.payload; // Don't show error if just no token
            });
    },
});

export const { logoutUser, resetAuthStatus } = authSlice.actions;
export default authSlice.reducer;
