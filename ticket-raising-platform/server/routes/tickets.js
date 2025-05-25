const express = require('express');
const jwt = require('jsonwebtoken');
const Ticket = require('../models/Ticket');
const User = require('../models/User'); // Needed for role checks on updates/deletes
const commentRouter = require('./comments'); // Import the comments router
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token (generic authentication)
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }
    try {
        if (!JWT_SECRET) {
             console.error("JWT_SECRET is not available for token verification in tickets route.");
             return res.status(500).json({ msg: "Server configuration error: JWT_SECRET missing" });
        }
        const decoded = jwt.verify(token, JWT_SECRET); // Decoded payload: { userId, role }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST /api/tickets
// @desc    Create a new ticket
// @access  Private (Authenticated users)
router.post('/', authMiddleware, async (req, res) => {
    const { title, description, priority } = req.body;
    try {
        const newTicket = new Ticket({
            title,
            description,
            priority: priority || 'medium', // Default priority if not provided
            createdBy: req.user.userId
        });
        const ticket = await newTicket.save();
        res.status(201).json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/tickets
// @desc    Get all tickets (with optional filters)
// @access  Private (Authenticated users)
router.get('/', authMiddleware, async (req, res) => {
    const { status, priority, assignedTo, createdBy } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (createdBy) filter.createdBy = createdBy;

    // Users can see their own tickets or tickets assigned to them.
    // Agents/Admins can see more.
    if (req.user.role === 'user') {
        filter.$or = [
            { createdBy: req.user.userId },
            { assignedTo: req.user.userId } // Though users typically don't get tickets "assigned" in this model yet
        ];
    } else if (req.user.role === 'agent') {
        // Agents can see tickets assigned to them, or unassigned tickets, or their own.
         filter.$or = [
             { assignedTo: req.user.userId },
             { assignedTo: null }, // Unassigned tickets
             { createdBy: req.user.userId }
         ];
    }
    // Admins can see all tickets (no additional filter based on role here, but can be added if needed)

    try {
        const tickets = await Ticket.find(filter)
                                  .populate('createdBy', 'username email')
                                  .populate('assignedTo', 'username email')
                                  .sort({ createdAt: -1 }); // Sort by newest first
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET /api/tickets/:id
// @desc    Get a single ticket by ID
// @access  Private (Authenticated users - creator, assignee, or admin/agent)
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id)
                                 .populate('createdBy', 'username email')
                                 .populate('assignedTo', 'username email');
        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        // Authorization: User must be creator, assignee, or an admin/agent
        const isCreator = ticket.createdBy._id.toString() === req.user.userId;
        const isAssignee = ticket.assignedTo && ticket.assignedTo._id.toString() === req.user.userId;
        const isAdminOrAgent = ['admin', 'agent'].includes(req.user.role);

        if (!isCreator && !isAssignee && !isAdminOrAgent) {
            return res.status(403).json({ msg: 'User not authorized to view this ticket' });
        }
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ msg: 'Invalid ticket ID format' });
        }
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/tickets/:id
// @desc    Update a ticket (status, priority, assign to agent)
// @access  Private (Creator, or Admin/Agent)
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, description, status, priority, assignedTo } = req.body;
    const ticketId = req.params.id;

    try {
        let ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        const isCreator = ticket.createdBy.toString() === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        const isAgent = req.user.role === 'agent';

        // Authorization:
        // Creator can update title, description, priority (if ticket is still open & not assigned, or assigned to them)
        // Agent can update status, priority, assign to themselves (if assigned or unassigned)
        // Admin can update anything

        if (isAdmin) {
            if (title) ticket.title = title;
            if (description) ticket.description = description;
            if (status) ticket.status = status;
            if (priority) ticket.priority = priority;
            if (assignedTo !== undefined) ticket.assignedTo = assignedTo === '' ? null : assignedTo; // Allow unassigning
        } else if (isAgent) {
            // Agent can only update tickets assigned to them or unassigned tickets they take
            if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user.userId && ticket.status !== 'open') {
               // If assigned to someone else and not open, agent cannot modify unless they are the assignee
               if (ticket.assignedTo.toString() !== req.user.userId) {
                 return res.status(403).json({ msg: 'Agent not authorized to update this ticket' });
               }
            }
            if (status) ticket.status = status; // e.g., 'in progress', 'closed'
            if (priority) ticket.priority = priority;
            // Agent can assign to themselves or another agent (if business logic allows, otherwise just to self)
            if (assignedTo !== undefined) {
                // Typically an agent might only assign to themselves or unassign.
                // For simplicity, let's say an agent can change assignment if the ticket is theirs or unassigned.
                if (ticket.assignedTo && ticket.assignedTo.toString() !== req.user.userId) {
                    // If trying to change assignment of a ticket not theirs
                    return res.status(403).json({ msg: 'Agent can only re-assign their own tickets or unassigned tickets.'})
                }
                ticket.assignedTo = assignedTo === '' ? null : assignedTo;
            }
             if (title && ticket.createdBy.toString() === req.user.userId) ticket.title = title; // Creator agent can still edit title/desc
             if (description && ticket.createdBy.toString() === req.user.userId) ticket.description = description;


        } else if (isCreator) {
            // User who created the ticket
            if (ticket.status !== 'open' && !(ticket.assignedTo && ticket.assignedTo.toString() === req.user.userId) ) {
                return res.status(403).json({ msg: 'Cannot update ticket that is in progress or closed, unless you are the assignee.' });
            }
            if (title) ticket.title = title;
            if (description) ticket.description = description;
            if (priority) ticket.priority = priority;
            // Regular users cannot change status or assign tickets
            if (status || assignedTo !== undefined) {
                return res.status(403).json({ msg: 'User cannot change status or assignment.' });
            }
        } else {
            return res.status(403).json({ msg: 'User not authorized to update this ticket' });
        }

        ticket.updatedAt = Date.now();
        const updatedTicket = await ticket.save();
        
        // Populate fields for the response
        const populatedTicket = await Ticket.findById(updatedTicket._id)
                                         .populate('createdBy', 'username email')
                                         .populate('assignedTo', 'username email');
        res.json(populatedTicket);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ msg: 'Invalid ticket or user ID format' });
        }
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete a ticket
// @access  Private (Creator or Admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id);
        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        const isCreator = ticket.createdBy.toString() === req.user.userId;
        const isAdmin = req.user.role === 'admin';

        if (!isCreator && !isAdmin) {
            return res.status(403).json({ msg: 'User not authorized to delete this ticket' });
        }

        await ticket.remove(); // or ticket.deleteOne() in newer Mongoose
        res.json({ msg: 'Ticket removed successfully' });

    } catch (err) {
        console.error(err.message);
         if (err.kind === 'ObjectId') {
             return res.status(400).json({ msg: 'Invalid ticket ID format' });
        }
        res.status(500).send('Server error');
    }
});

// Mount the comment router for specific ticket routes
router.use('/:ticketId/comments', commentRouter);

module.exports = router;
