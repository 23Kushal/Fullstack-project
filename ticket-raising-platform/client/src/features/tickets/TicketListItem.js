import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Card, CardContent, CardActions, Typography, Button, Chip, Box } from '@mui/material';

const TicketListItem = ({ ticket }) => {
    if (!ticket) return null;

    let priorityColor = 'default';
    if (ticket.priority === 'high') priorityColor = 'error';
    else if (ticket.priority === 'medium') priorityColor = 'warning';
    else if (ticket.priority === 'low') priorityColor = 'success';
    
    let statusColor = 'default';
    if (ticket.status === 'open') statusColor = 'info';
    else if (ticket.status === 'in progress') statusColor = 'secondary';
    else if (ticket.status === 'closed') statusColor = 'success';


    return (
        <Card sx={{ mb: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <CardContent>
                <Typography variant="h6" component="div" gutterBottom noWrap title={ticket.title}>
                    {ticket.title}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Status: <Chip label={ticket.status || 'N/A'} size="small" color={statusColor} />
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Priority: <Chip label={ticket.priority || 'N/A'} size="small" color={priorityColor} />
                    </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                    Created by: {ticket.createdBy ? ticket.createdBy.username : 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                    Created at: {new Date(ticket.createdAt).toLocaleDateString()}
                </Typography>
                {ticket.assignedTo && (
                     <Typography variant="body2" color="text.secondary" sx={{mt: 0.5}}>
                        Assigned to: {ticket.assignedTo.username}
                    </Typography>
                )}
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <Button component={RouterLink} to={`/tickets/${ticket._id}`} size="small">View Details</Button>
            </CardActions>
        </Card>
    );
};
export default TicketListItem;
