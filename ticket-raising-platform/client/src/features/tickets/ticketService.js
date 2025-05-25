import axios from 'axios';

const API_URL = 'http://localhost:5000/api/tickets/';

const getConfig = (token) => ({
    headers: {
        'x-auth-token': token,
    },
});

// Ticket functions
const createTicket = async (ticketData, token) => {
    const response = await axios.post(API_URL, ticketData, getConfig(token));
    return response.data;
};

const getTickets = async (token) => { // Add filters as params if needed later
    const response = await axios.get(API_URL, getConfig(token));
    return response.data;
};

const getTicketById = async (ticketId, token) => {
    const response = await axios.get(API_URL + ticketId, getConfig(token));
    return response.data;
};

const updateTicket = async (ticketId, ticketData, token) => {
    const response = await axios.put(API_URL + ticketId, ticketData, getConfig(token));
    return response.data;
};

const deleteTicket = async (ticketId, token) => {
    const response = await axios.delete(API_URL + ticketId, getConfig(token));
    return response.data; // Typically a success message or the ID of deleted item
};

// Comment functions
const addComment = async (ticketId, commentData, token) => {
    const response = await axios.post(API_URL + ticketId + '/comments', commentData, getConfig(token));
    return response.data;
};

const getComments = async (ticketId, token) => {
    const response = await axios.get(API_URL + ticketId + '/comments', getConfig(token));
    return response.data;
};

const ticketService = {
    createTicket,
    getTickets,
    getTicketById,
    updateTicket,
    deleteTicket,
    addComment,
    getComments,
};

export default ticketService;
