import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import ticketReducer from '../features/tickets/ticketSlice'; // This was added/ensured
import adminReducer from '../features/admin/adminSlice';   // This was added/ensured

export const store = configureStore({
    reducer: {
        auth: authReducer,
        tickets: ticketReducer, // This line ensures state.tickets is managed
        admin: adminReducer,   // This line ensures state.admin is managed
    },
});