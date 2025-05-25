import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTicketById, fetchCommentsForTicket, clearCurrentTicketAndComments, deleteExistingTicket, resetTicketStatus } from './ticketSlice';
import CommentList from './CommentList';
import CommentForm from './CommentForm';
import { Container, Typography, Box, CircularProgress, Alert, Paper, Grid, Chip, Button } from '@mui/material';
import { format } from 'date-fns';

const TicketDetail = () => {
    const { id: ticketId } = useParams(); // Matches route in App.js
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { currentTicket: ticket, comments, status, error } = useSelector((state) => state.tickets);
    const { user } = useSelector((state) => state.auth); // For role-based actions

    useEffect(() => {
        if (ticketId) {
            dispatch(resetTicketStatus()); // Clear previous status/error
            dispatch(fetchTicketById(ticketId));
            dispatch(fetchCommentsForTicket(ticketId));
        }
        return () => {
            dispatch(clearCurrentTicketAndComments());
        };
    }, [dispatch, ticketId]);

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this ticket?')) {
            // Slice uses a general 'loading', 'succeeded', 'failed' status.
            // We can check if the operation was delete by its effect on 'currentTicket' or 'tickets' list.
            // For now, we'll just dispatch and navigate on success.
            const resultAction = await dispatch(deleteExistingTicket(ticketId));
            if (deleteExistingTicket.fulfilled.match(resultAction)) {
                navigate('/tickets');
            }
            // Error will be in 'error' from the slice.
        }
    };

    // Initial loading state for the ticket itself
    if (status === 'loading' && !ticket) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    // If fetching ticket failed and there's no ticket data to show
    if (status === 'failed' && !ticket) {
        return (
            <Container>
                <Alert severity="error" sx={{ mt: 2 }}>
                    {error || 'Failed to load ticket details.'}
                </Alert>
            </Container>
        );
    }
    
    // If ticket is null after attempting to load (and not currently loading)
    if (!ticket) {
        return <Container><Typography sx={{mt: 2}}>Ticket not found or could not be loaded.</Typography></Container>;
    }

    // Determine if the delete button should be enabled/disabled
    // (Simplified: button is disabled if main status is 'loading'. A specific delete_loading status would be better)
    const isDeleting = status === 'loading' && error === null; // A rough approximation

    const canDelete = user && ticket && ticket.createdBy && (user.role === 'admin' || user.userId === ticket.createdBy._id);

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h4" gutterBottom component="h1">{ticket.title}</Typography>
                
                {/* Display general error if one occurred after ticket was loaded (e.g. comment error) */}
                {status === 'failed' && error && (
                     <Alert severity="warning" sx={{ mb: 2 }}>
                        {error || 'An error occurred.'}
                    </Alert>
                )}

                <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                        <Typography variant="h6" gutterBottom>Description</Typography>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2, p:1, border: '1px solid #eee', borderRadius: 1, background: '#f9f9f9', minHeight: '100px' }}>
                            {ticket.description}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Box sx={{p:1.5, border: '1px solid #eee', borderRadius: 1, background: '#f9f9f9'}}>
                            <Typography variant="h6" gutterBottom>Details</Typography>
                            <Typography variant="body1" sx={{mb:1}}><strong>Status:</strong> <Chip label={ticket.status || 'N/A'} size="small" color={ticket.status === 'open' ? 'info' : ticket.status === 'closed' ? 'success' : 'default'} /></Typography>
                            <Typography variant="body1" sx={{mb:1}}><strong>Priority:</strong> <Chip label={ticket.priority || 'N/A'} size="small" color={ticket.priority === 'high' ? 'error' : ticket.priority === 'medium' ? 'warning' : 'default'} /></Typography>
                            <Typography variant="body1" sx={{mb:1}}><strong>Created by:</strong> {ticket.createdBy?.username || 'N/A'}</Typography>
                            <Typography variant="body1" sx={{mb:1}}><strong>Assigned to:</strong> {ticket.assignedTo?.username || 'Unassigned'}</Typography>
                            <Typography variant="caption" display="block" sx={{mt:1.5, color: 'text.secondary'}}>Created: {ticket.createdAt ? format(new Date(ticket.createdAt), 'Pp') : 'N/A'}</Typography>
                            <Typography variant="caption" display="block" sx={{color: 'text.secondary'}}>Last Updated: {ticket.updatedAt ? format(new Date(ticket.updatedAt), 'Pp') : 'N/A'}</Typography>
                        </Box>
                    </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', gap: 1 }}>
                    {/* Placeholder for Edit Button */}
                    {/* <Button variant="outlined" component={RouterLink} to={`/tickets/${ticketId}/edit`} disabled={isDeleting}>Edit</Button> */}
                    {canDelete && (
                        <Button variant="contained" color="error" onClick={handleDelete} disabled={isDeleting}>
                            {isDeleting ? <CircularProgress size={24} /> : 'Delete Ticket'}
                        </Button>
                    )}
                </Box>
                
                <Box sx={{mt: 4}}> {/* Added margin top for separation */}
                    <CommentList /> 
                    {/* CommentList will use state.tickets.comments and state.tickets.status for its display */}
                </Box>
                <Box sx={{mt: 2}}> {/* Added margin top for separation */}
                    <CommentForm ticketId={ticketId} />
                </Box>
            </Paper>
        </Container>
    );
};
export default TicketDetail;
