const express = require('express');
const jwt = require('jsonwebtoken');
const Comment = require('../models/Comment');
const Ticket = require('../models/Ticket'); // To verify ticket existence and authorization
const router = express.Router({ mergeParams: true }); // mergeParams to get :ticketId from parent router

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token (generic authentication)
// This can be refactored into a shared middleware file later
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        if (!JWT_SECRET) {
            console.error("JWT_SECRET is not available for token verification in comments route.");
            return res.status(500).json({ msg: "Server configuration error: JWT_SECRET missing" });
        }
        const decoded = jwt.verify(token, JWT_SECRET); // Decoded payload: { userId, role }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST /api/tickets/:ticketId/comments
// @desc    Add a comment to a ticket
// @access  Private (Authenticated users who can view the ticket)
router.post('/', authMiddleware, async (req, res) => {
    const { text } = req.body;
    const { ticketId } = req.params;
    const userId = req.user.userId;

    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        // Authorization: Check if user can view the ticket (similar logic to GET /api/tickets/:id)
        const isCreator = ticket.createdBy.toString() === userId;
        const isAssignee = ticket.assignedTo && ticket.assignedTo.toString() === userId;
        const isAdminOrAgent = ['admin', 'agent'].includes(req.user.role);

        if (!isCreator && !isAssignee && !isAdminOrAgent) {
            return res.status(403).json({ msg: 'User not authorized to comment on this ticket' });
        }

        const newComment = new Comment({
            text,
            ticketId,
            userId
        });

        const comment = await newComment.save();
        
        // Populate user details for the comment response
        const populatedComment = await Comment.findById(comment._id).populate('userId', 'username email');
        res.status(201).json(populatedComment);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ msg: 'Invalid ticket ID format' });
        }
        res.status(500).send('Server error');
    }
});

// @route   GET /api/tickets/:ticketId/comments
// @desc    Get all comments for a ticket
// @access  Private (Authenticated users who can view the ticket)
router.get('/', authMiddleware, async (req, res) => {
    const { ticketId } = req.params;
    const userId = req.user.userId;

    try {
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        // Authorization: Check if user can view the ticket
        const isCreator = ticket.createdBy.toString() === userId;
        const isAssignee = ticket.assignedTo && ticket.assignedTo.toString() === userId;
        const isAdminOrAgent = ['admin', 'agent'].includes(req.user.role);

        if (!isCreator && !isAssignee && !isAdminOrAgent) {
            return res.status(403).json({ msg: 'User not authorized to view comments for this ticket' });
        }

        const comments = await Comment.find({ ticketId })
                                     .populate('userId', 'username email') // Populate user info
                                     .sort({ createdAt: 'asc' }); // Sort by oldest first
        res.json(comments);
    } catch (err) {
        console.error(err.message);
         if (err.kind === 'ObjectId') {
             return res.status(400).json({ msg: 'Invalid ticket ID format' });
        }
        res.status(500).send('Server error');
    }
});

module.exports = router;
