import React from 'react';
import { useSelector } from 'react-redux';
import { List, ListItem, ListItemText, Typography, Divider, Box, Paper } from '@mui/material';
import { format } from 'date-fns'; // For formatting dates

const CommentList = () => {
    // Assumes comments for the currentTicket are fetched and stored in state.tickets.comments
    // And that ticketSlice has a status for loading comments, e.g. 'loading_comments'
    // or uses the general 'loading' status when comments are being fetched.
    const { comments, status: ticketStatus } = useSelector((state) => state.tickets); 

    // If the main ticket is loading, comments might also be considered loading or not yet available.
    // A more specific status like 'loading_comments' would be ideal.
    // For now, we'll just show "Loading comments..." if the general ticket status is loading
    // and comments haven't arrived yet.
    if (ticketStatus === 'loading' && (!comments || comments.length === 0)) {
        return <Typography sx={{mt: 2}}>Loading comments...</Typography>;
    }
    
    // If there was an error fetching the ticket itself, comments might also be unavailable.
    // This component doesn't have direct error state for comments, relies on parent (TicketDetail)
    // or ticketSlice's general error.

    return (
        <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>Comments</Typography>
            {comments && comments.length > 0 ? (
                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {comments.map((comment, index) => (
                        <Paper key={comment._id} elevation={1} sx={{mb: 1.5}}>
                            <ListItem alignItems="flex-start">
                                <ListItemText
                                    primary={
                                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                                            {comment.text}
                                        </Typography>
                                    }
                                    secondary={
                                        <>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {comment.userId ? comment.userId.username : 'User'}
                                            </Typography>
                                            {" — "}
                                            {comment.createdAt ? format(new Date(comment.createdAt), 'Pp') : 'just now'}
                                        </>
                                    }
                                />
                            </ListItem>
                            {/* No divider needed if each comment is in its own Paper */}
                            {/* {index < comments.length - 1 && <Divider variant="inset" component="li" />} */}
                        </Paper>
                    ))}
                </List>
            ) : (
                // Avoid showing "No comments yet" if the ticket is still loading.
                ticketStatus !== 'loading' && <Typography sx={{mt: 1}}>No comments yet.</Typography>
            )}
        </Box>
    );
};
export default CommentList;
