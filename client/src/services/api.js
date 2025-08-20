import axios from 'axios';
import { toast } from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance with baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor: attach token
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token included in request');
    } else {
      console.log('No token available');
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor: handle errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);

      if (error.response.status === 401) {
        console.log('Authentication error - clearing token');
        localStorage.removeItem('token');
        toast.error('Your session has expired. Please login again.');
        window.location.href = '/login';
      }

      if (error.response.status === 404) {
        console.error('API endpoint not found:', error.config.url);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      toast.error('Server not responding. Please try again later.');
    } else {
      console.error('Error message:', error.message);
    }

    return Promise.reject(error);
  }
);

// Authentication services
export const authService = {
  register: (userData) => api.post('/api/auth/register', userData),
  login: (credentials) => api.post('/api/auth/login', credentials),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (data) => api.put('/api/auth/profile', data),
  changePassword: (data) => api.put('/api/auth/change-password', data),
};

//  Partner services
export const partnerService = {
  getPartners: () => api.get('/api/partners'),
  getPartner: (id) => api.get(`/api/partners/${id}`),
  createPartner: (data) => api.post('/api/partners/add', data),
  updatePartner: (id, data) => api.put(`/api/partners/${id}`, data),
  deletePartner: (id) => api.delete(`/api/partners/${id}`),
};

// Wallet services
export const walletService = {
  getWallet: () => api.get('/api/wallet'),
  getTransactions: (filters = {}) => api.get('/api/wallet/transactions', { params: filters }),
  addFunds: (data) => api.post('/api/wallet/add-funds', data),
  withdrawFunds: (data) => api.post('/api/wallet/withdraw', data),
};

// Pickup services
export const pickupService = {
  requestPickup: (data) => api.post('/api/pickups/request', data),
  getPickups: () => api.get('/api/pickups'),
  getPickup: (id) => api.get(`/api/pickups/${id}`),
  updatePickupStatus: (id, status) => api.put(`/api/pickups/${id}/status`, { status }),
  schedulePickup: (id, scheduledTime) => api.put(`/api/pickups/${id}/schedule`, { scheduledTime }),
  cancelPickup: (id, reason) => api.put(`/api/pickups/${id}/cancel`, { reason }),
};

// Order services
export const orderService = {
  createOrder: (data) => api.post('/api/orders', data),
  getOrders: () => api.get('/api/orders'),
  getOrder: (id) => api.get(`/api/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }),
  cancelOrder: (id, reason) => api.put(`/api/orders/${id}/cancel`, { reason }),
  getOrderHistory: () => api.get('/api/orders/history'),
};

export default api;
