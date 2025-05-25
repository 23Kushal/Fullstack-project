const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    // This check is important, though ideally handled globally or at startup
    console.error('FATAL ERROR: JWT_SECRET is not defined. Shutting down user management routes.');
    // Depending on desired behavior, you might throw an error or disable routes
    // For simplicity here, we'll let requests fail if JWT_SECRET is missing at runtime
}

// Middleware to verify token and check for admin role
const adminAuthMiddleware = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        if (!JWT_SECRET) { // Re-check JWT_SECRET as it's critical
             console.error("JWT_SECRET is not available for token verification.");
             return res.status(500).json({ msg: "Server configuration error: JWT_SECRET missing" });
        }
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Add user payload { userId, role } to request

        // Check if user is admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin role required.' });
        }
        next();
    } catch (err) {
        console.error("Token verification or role check error:", err.message);
        res.status(401).json({ msg: 'Token is not valid or role check failed' });
    }
};

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private (Admin)
router.get('/', adminAuthMiddleware, async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Exclude passwords from result
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/users/:id/role
// @desc    Update user role (Admin only)
// @access  Private (Admin)
router.put('/:id/role', adminAuthMiddleware, async (req, res) => {
    const { role } = req.body;
    const userIdToUpdate = req.params.id;

    // Validate role
    const allowedRoles = ['user', 'agent', 'admin'];
    if (!role || !allowedRoles.includes(role)) {
        return res.status(400).json({ msg: 'Invalid role specified.' });
    }

    try {
        const user = await User.findById(userIdToUpdate);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Optional: Prevent admin from changing their own role through this specific endpoint
        // if (user.id === req.user.userId && user.role === 'admin' && role !== 'admin') {
        //     return res.status(403).json({ msg: 'Admins cannot change their own role via this endpoint.' });
        // }

        user.role = role;
        await user.save();
        
        // Return updated user, excluding password
        const updatedUser = await User.findById(userIdToUpdate).select('-password');
        res.json(updatedUser);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') { // Handle invalid ObjectId format for user ID
             return res.status(400).json({ msg: 'Invalid user ID format' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
