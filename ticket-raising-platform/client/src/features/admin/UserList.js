import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, updateUserRole, resetAdminStatus } from './adminSlice';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Typography, CircularProgress, Alert, Select, MenuItem, Button, Box } from '@mui/material';

const UserList = () => {
    const dispatch = useDispatch();
    const { users, status, error } = useSelector((state) => state.admin);
    const [editingRole, setEditingRole] = useState({}); // { userId: 'newRole' }

    useEffect(() => {
        dispatch(resetAdminStatus()); // Reset status on mount
        dispatch(fetchUsers());
    }, [dispatch]);

    const handleRoleChange = (userId, newRole) => {
        setEditingRole(prev => ({ ...prev, [userId]: newRole }));
    };

    const handleSaveRole = (userId) => {
        const roleToUpdate = editingRole[userId];
        if (roleToUpdate) {
            dispatch(updateUserRole({ userId, role: roleToUpdate }))
                .unwrap() // Use unwrap to handle promise here for specific row feedback
                .then(() => {
                    // Successfully updated
                    setEditingRole(prev => {
                        const newState = {...prev};
                        delete newState[userId]; // Clear editing state for this user
                        return newState;
                    });
                })
                .catch((updateError) => {
                    // Error handled by slice, but can do row-specific feedback if needed
                    // For instance, if you want to keep the select dropdown showing the attempted value
                    // and display an error next to it, you'd handle that here.
                    // The slice error 'error' will be general.
                    console.error("Update failed for user " + userId + ":", updateError);
                    // Optionally, you might want to revert editingRole[userId] or show a specific message.
                });
        }
    };
    
    // Initial loading for the entire user list
    if (status === 'loading' && users.length === 0) {
        return <Box sx={{display: 'flex', justifyContent: 'center', p:3}}><CircularProgress /></Box>;
    }

    // General error if fetchUsers failed and there are no users to display
    if (status === 'failed' && users.length === 0) { // Check error as well for more specific message if needed
        return <Alert severity="error" sx={{m:2}}>{typeof error === 'string' ? error : (error?.message || 'Failed to fetch users.')}</Alert>;
    }

    return (
        <Paper sx={{ m: { xs: 1, sm: 2 }, p: { xs: 1, sm: 2 } }}>
            <Typography variant="h5" gutterBottom component="h1">User Management</Typography>
            
            {/* Display general error from slice if it's related to an update and not specific to a row */}
            {status === 'failed_update' && error && (
                <Alert severity="error" sx={{mb:2}}>
                    Failed to update role: {typeof error === 'string' ? error : (error?.message || 'An unknown error occurred.')}
                </Alert>
            )}
            {/* Display success message after role update */}
            {status === 'succeeded_update' && (
                <Alert severity="success" sx={{mb:2}}>
                    User role updated successfully.
                </Alert>
            )}

            <TableContainer>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Username</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Current Role</TableCell>
                            <TableCell>New Role</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => {
                            const isRowBeingUpdated = status === 'loading_update' && editingRole[user._id] && editingRole[user._id] !== user.role;
                            return (
                                <TableRow key={user._id} hover selected={isRowBeingUpdated}>
                                    <TableCell>{user.username}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.role}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={editingRole[user._id] || user.role}
                                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                            size="small"
                                            sx={{minWidth: 100}}
                                            disabled={isRowBeingUpdated}
                                        >
                                            <MenuItem value="user">User</MenuItem>
                                            <MenuItem value="agent">Agent</MenuItem>
                                            <MenuItem value="admin">Admin</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Button 
                                            onClick={() => handleSaveRole(user._id)}
                                            disabled={!editingRole[user._id] || editingRole[user._id] === user.role || isRowBeingUpdated}
                                            variant="contained"
                                            size="small"
                                        >
                                           {isRowBeingUpdated ? <CircularProgress size={20}/> : "Save"}
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
            {users.length === 0 && status !== 'loading' && <Typography sx={{p:2, textAlign: 'center'}}>No users found.</Typography>}
        </Paper>
    );
};
export default UserList;
