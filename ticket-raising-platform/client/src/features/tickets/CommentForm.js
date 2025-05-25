import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCommentToTicket, resetTicketStatus } from './ticketSlice';
import { TextField, Button, Box, CircularProgress, Alert } from '@mui/material';

const CommentForm = ({ ticketId }) => {
    const [text, setText] = useState('');
    const dispatch = useDispatch();
    // Using general status and error, assuming slice might not have specific comment_status yet.
    // If slice is updated, this selector can be more specific.
    const { status, error } = useSelector((state) => state.tickets);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        // Dispatch and then clear form.
        // The slice should handle the status update (e.g., 'loading_comment', 'failed_comment')
        dispatch(addCommentToTicket({ ticketId, commentData: { text } }))
            .unwrap() // Use unwrap to handle promise settlement here for form clearing
            .then(() => {
                setText(''); // Clear form on successful comment addition
                // dispatch(resetTicketStatus()); // Or a specific resetCommentStatus
            })
            .catch((err) => {
                // Error is already handled by the slice and will be in 'error' state variable
                // No need to do much here unless specific UI reaction to error is needed in the form itself
                console.error("Failed to add comment:", err);
            });
    };
    
    // Clear error if user starts typing
    useEffect(() => {
        if (text && status === 'failed' && error) { // Assuming 'failed' is generic
            dispatch(resetTicketStatus());
        }
    }, [text, dispatch, status, error]);


    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, mb: 2 }}>
            {/* The slice should ideally have specific status for comment ops e.g. status === 'failed_add_comment' */}
            {status === 'failed' && error && <Alert severity="error" sx={{ mb: 1 }}>{error || 'Failed to add comment'}</Alert>}
            <TextField
                fullWidth
                multiline
                rows={3}
                label="Add a comment"
                value={text}
                onChange={(e) => setText(e.target.value)}
                variant="outlined"
                required
            />
            <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={status === 'loading'}>
                {/* Assuming 'loading' is generic. Slice ideally has 'loading_add_comment' */}
                {status === 'loading' ? <CircularProgress size={24} /> : 'Add Comment'}
            </Button>
        </Box>
    );
};
export default CommentForm;
