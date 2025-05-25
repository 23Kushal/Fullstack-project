import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios'; // Or use an adminService

const API_URL_USERS = '/api/users/';
const getConfig = (token) => ({ headers: { 'x-auth-token': token } });

export const fetchUsers = createAsyncThunk('admin/fetchUsers', async (_, { getState, rejectWithValue }) => {
    try {
        const token = getState().auth.token;
        if (!token) return rejectWithValue('No token found');
        const response = await axios.get(API_URL_USERS, getConfig(token));
        return response.data;
    } catch (error) {
        return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to fetch users');
    }
});

export const updateUserRole = createAsyncThunk('admin/updateUserRole', async ({ userId, role }, { getState, rejectWithValue }) => {
    try {
        const token = getState().auth.token;
        if (!token) return rejectWithValue('No token found');
        const response = await axios.put(API_URL_USERS + userId + '/role', { role }, getConfig(token));
        return response.data; // Should be the updated user
    } catch (error) {
        return rejectWithValue(error.response?.data?.msg || error.message || 'Failed to update user role');
    }
});

const adminSlice = createSlice({
    name: 'admin',
    initialState: { users: [], status: 'idle', error: null },
    reducers: {
        resetAdminStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => { 
                state.status = 'loading'; 
                state.error = null; // Clear previous errors
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            .addCase(updateUserRole.pending, (state) => { 
                state.status = 'loading_update'; 
                state.error = null; // Clear previous errors
            }) 
            .addCase(updateUserRole.fulfilled, (state, action) => {
                state.status = 'succeeded_update';
                const index = state.users.findIndex(user => user._id === action.payload._id);
                if (index !== -1) state.users[index] = action.payload;
            })
            .addCase(updateUserRole.rejected, (state, action) => {
                state.status = 'failed_update';
                state.error = action.payload;
            });
    }
});
export const { resetAdminStatus } = adminSlice.actions;
export default adminSlice.reducer;
