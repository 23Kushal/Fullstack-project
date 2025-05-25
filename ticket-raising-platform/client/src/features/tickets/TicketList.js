import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link as RouterLink } from 'react-router-dom';
import { fetchTickets, resetTicketStatus } from './ticketSlice';
import TicketListItem from './TicketListItem';
import { Container, Typography, Box, CircularProgress, Alert, Button, Grid } from '@mui/material';

const TicketList = () => {
    const dispatch = useDispatch();
    // Use a more specific selector if your slice has different status/error for list vs. detail
    const { tickets, status, error } = useSelector((state) => state.tickets); 
    // const { token } = useSelector((state) => state.auth); // Token is mainly for thunks via getState

    useEffect(() => {
        // Reset general ticket status (e.g., if navigating from a failed ticket detail view)
        // but be careful not to reset if it's loading the list itself.
        // This might be better handled by resetting status on unmount of other components.
        // For now, let's reset if status is 'failed' from a previous operation.
        if (status === 'failed') {
            dispatch(resetTicketStatus());
        }
        // The thunk will get the token from getState, so no need to pass it here.
        // Also, ProtectedRoute should ensure user is authenticated before reaching here.
        dispatch(fetchTickets());
    }, [dispatch]); // Removed status from dependency to prevent re-fetch loops

    if (status === 'loading' && tickets.length === 0) { // Show loading only if no tickets are displayed yet
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }
    
    if (status === 'failed' && !error) { // Handles cases where fetchTickets might fail without a specific error message
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    Failed to load tickets. Please try again later.
                </Alert>
            </Container>
        );
    }

    if (status === 'failed' && error) {
        const errorMessage = typeof error === 'string' ? error : (error.message || 'Failed to load tickets.');
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>{errorMessage}</Alert>
            </Container>
        );
    }
    
    return (
        <Container maxWidth="lg"> {/* Changed to lg for potentially more space */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 3 }}>
                <Typography variant="h4" component="h1">My Tickets</Typography>
                <Button variant="contained" color="primary" component={RouterLink} to="/tickets/new">
                    Create New Ticket
                </Button>
            </Box>
            {tickets && tickets.length > 0 ? (
                <Grid container spacing={3}> {/* Increased spacing a bit */}
                    {tickets.map((ticket) => (
                        // Changed to take up more space on smaller screens, but allow multiple on larger.
                        <Grid item xs={12} sm={6} md={4} key={ticket._id}> 
                            <TicketListItem ticket={ticket} />
                        </Grid>
                    ))}
                </Grid>
            ) : (
                status !== 'loading' && ( // Avoid "No tickets found" while initial load might be happening
                    <Typography sx={{ mt: 4, textAlign: 'center' }}>
                        No tickets found. Why not create one?
                    </Typography>
                )
            )}
        </Container>
    );
};
export default TicketList;
