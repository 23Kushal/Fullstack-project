import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import ticketService from './ticketService';

const initialState = {
    tickets: [],
    currentTicket: null,
    comments: [],
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
    error: null,
};

// Async Thunks
export const createTicket = createAsyncThunk(
    'tickets/createTicket',
    async (ticketData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            return await ticketService.createTicket(ticketData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchTickets = createAsyncThunk(
    'tickets/fetchTickets',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            return await ticketService.getTickets(token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchTicketById = createAsyncThunk(
    'tickets/fetchTicketById',
    async (ticketId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            return await ticketService.getTicketById(ticketId, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const updateExistingTicket = createAsyncThunk(
    'tickets/updateExistingTicket',
    async ({ ticketId, ticketData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            return await ticketService.updateTicket(ticketId, ticketData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const deleteExistingTicket = createAsyncThunk(
    'tickets/deleteExistingTicket',
    async (ticketId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            await ticketService.deleteTicket(ticketId, token);
            return ticketId; // Return the ID for removal from state
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const addCommentToTicket = createAsyncThunk(
    'tickets/addCommentToTicket',
    async ({ ticketId, commentData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            return await ticketService.addComment(ticketId, commentData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const fetchCommentsForTicket = createAsyncThunk(
    'tickets/fetchCommentsForTicket',
    async (ticketId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.token;
            return await ticketService.getComments(ticketId, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.msg) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);


const ticketSlice = createSlice({
    name: 'tickets',
    initialState,
    reducers: {
        clearCurrentTicketAndComments: (state) => {
            state.currentTicket = null;
            state.comments = [];
            state.status = 'idle'; // Reset status for current ticket view
            state.error = null;
        },
        resetTicketStatus: (state) => {
            state.status = 'idle';
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Create Ticket
            .addCase(createTicket.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(createTicket.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.tickets.push(action.payload); // Add to tickets list
                state.currentTicket = action.payload; // Optionally set as current
            })
            .addCase(createTicket.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Fetch Tickets
            .addCase(fetchTickets.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(fetchTickets.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.tickets = action.payload;
            })
            .addCase(fetchTickets.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Fetch Ticket By ID
            .addCase(fetchTicketById.pending, (state) => {
                state.status = 'loading';
                state.currentTicket = null; // Clear previous before fetching
                state.comments = [];      // Clear previous comments
            })
            .addCase(fetchTicketById.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.currentTicket = action.payload;
            })
            .addCase(fetchTicketById.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Update Ticket
            .addCase(updateExistingTicket.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(updateExistingTicket.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const index = state.tickets.findIndex(ticket => ticket._id === action.payload._id);
                if (index !== -1) {
                    state.tickets[index] = action.payload;
                }
                if (state.currentTicket && state.currentTicket._id === action.payload._id) {
                    state.currentTicket = action.payload;
                }
            })
            .addCase(updateExistingTicket.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Delete Ticket
            .addCase(deleteExistingTicket.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(deleteExistingTicket.fulfilled, (state, action) => { // action.payload is ticketId
                state.status = 'succeeded';
                state.tickets = state.tickets.filter(ticket => ticket._id !== action.payload);
                if (state.currentTicket && state.currentTicket._id === action.payload) {
                    state.currentTicket = null;
                    state.comments = [];
                }
            })
            .addCase(deleteExistingTicket.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload;
            })
            // Add Comment
            .addCase(addCommentToTicket.pending, (state) => {
                // state.status = 'loading'; // Or a specific comment loading status
            })
            .addCase(addCommentToTicket.fulfilled, (state, action) => {
                // state.status = 'succeeded';
                state.comments.push(action.payload);
            })
            .addCase(addCommentToTicket.rejected, (state, action) => {
                // state.status = 'failed';
                state.error = action.payload; // Or a specific comment error status
            })
            // Fetch Comments
            .addCase(fetchCommentsForTicket.pending, (state) => {
                // state.status = 'loading'; // Or a specific comment loading status
                state.comments = []; // Clear before fetching
            })
            .addCase(fetchCommentsForTicket.fulfilled, (state, action) => {
                // state.status = 'succeeded';
                state.comments = action.payload;
            })
            .addCase(fetchCommentsForTicket.rejected, (state, action) => {
                // state.status = 'failed';
                state.error = action.payload; // Or a specific comment error status
            });
    },
});

export const { clearCurrentTicketAndComments, resetTicketStatus } = ticketSlice.actions;
export default ticketSlice.reducer;
