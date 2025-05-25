import axios from 'axios';

const API_URL = '/api/auth/'; // Adjust if your server proxy is different

const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);
    if (response.data.token) { // Assuming token is directly in response.data
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

// Optional: fetch user details after login using the token
const getMe = async (token) => {
    const config = { headers: { 'x-auth-token': token } };
    const response = await axios.get(API_URL + 'me', config);
    return response.data; // This should be the user object
};

const logout = () => {
    localStorage.removeItem('token');
};

const authService = { register, login, getMe, logout };
export default authService;
