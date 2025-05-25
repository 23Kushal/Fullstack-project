import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice'; // Import the auth reducer

export const store = configureStore({
    reducer: {
        auth: authReducer, // Add auth reducer to the store
        // someFeature: someReducer, // Placeholder
    },
});
