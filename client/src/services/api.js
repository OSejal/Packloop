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
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token included in request');
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
    console.log(`API Response: ${response.status}`, response.data);
    return response;
  },
  (error) => {
    console.error('Response error:', error);

    if (error.response) {
      const { status, data, config } = error.response;

      if (status === 401) {
        console.log('Authentication error - clearing token');
        localStorage.removeItem('token');
        toast.error('Your session has expired. Please login again.');
        window.location.href = '/login';
      }

      if (status === 404) {
        console.error('API endpoint not found:', config.url);
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


const handleError = (err, context) => {
  console.error(`[Wallet Error] - ${context}`, {
    status: err.response?.status,
    data: err.response?.data,
    message: err.message,
  });
  throw err;
};

// Authentication services
export const authService = {
  register: async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    return res.data; // return { success, data: { token, user } }
  },
  login: async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    return res.data; // return { success, data: { token, user } }
  },
  getProfile: async () => {
    const res = await api.get('/api/auth/profile');
    return res.data; // return { success, data: { user } }
  },
  updateProfile: async (data) => {
    const res = await api.put('/api/auth/profile', data);
    return res.data;
  },
  changePassword: async (data) => {
    const res = await api.put('/api/auth/change-password', data);
    return res.data;
  },
};

// Partner services
export const partnerService = {
  getPartners: () => api.get('/api/partners').then(res => res.data),
  getPartner: (id) => api.get(`/api/partners/${id}`).then(res => res.data),
  createPartner: (data) => api.post('/api/partners/add', data).then(res => res.data),
  updatePartner: (id, data) => api.put(`/api/partners/${id}`, data).then(res => res.data),
  deletePartner: (id) => api.delete(`/api/partners/${id}`).then(res => res.data),
};

// Wallet services
export const walletService = {
  // Get wallet details
  getWallet: async () => {
    try {
      const res = await api.get("/api/wallet");
      return handleResponse(res, "Failed to fetch wallet");
    } catch (err) {
      handleError(err, "Wallet fetch failed");
    }
  },

  // Get transactions (with filters)
  getTransactions: async (filters = {}) => {
    try {
      const res = await api.get("/api/wallet/transactions", { params: filters });
      return handleResponse(res, "Failed to fetch transactions");
    } catch (err) {
      handleError(err, "Transactions fetch failed");
    }
  },

  // Add funds
  addFunds: async (data) => {
    try {
      const res = await api.post("/api/wallet/add-funds", data);
      return handleResponse(res, "Failed to add funds");
    } catch (err) {
      handleError(err, "Add Funds");
    }
  },

  // Withdraw funds
  withdrawFunds: async (data) => {
    try {
      const res = await api.post("/api/wallet/withdraw", data);
      return handleResponse(res, "Failed to withdraw funds");
    } catch (err) {
      handleError(err, "Withdraw Funds");
    }
  },

  verifyPayment: async (paymentData) => {
    try {
      const res = await API.post("/payments/verify", paymentData);
      return handleResponse(res, "Payment verification failed");
    } catch (err) {
      handleError(err, "Payment Verification");
    }
  },
};

// Pickup services
export const pickupService = {
  requestPickup: (data) => api.post('/api/pickups/request', data).then(res => res.data),
  getPickups: () => api.get('/api/pickups').then(res => res.data),
  getPickup: (id) => api.get(`/api/pickups/${id}`).then(res => res.data),
  updatePickupStatus: (id, status) => api.put(`/api/pickups/${id}/status`, { status }).then(res => res.data),
  schedulePickup: (id, scheduledTime) => api.put(`/api/pickups/${id}/schedule`, { scheduledTime }).then(res => res.data),
  cancelPickup: (id, reason) => api.put(`/api/pickups/${id}/cancel`, { reason }).then(res => res.data),
};

// Order services
export const orderService = {
  createOrder: (data) => api.post('/api/orders', data).then(res => res.data),
  getOrders: () => api.get('/api/orders').then(res => res.data),
  getOrder: (id) => api.get(`/api/orders/${id}`).then(res => res.data),
  updateOrderStatus: (id, status) => api.put(`/api/orders/${id}/status`, { status }).then(res => res.data),
  cancelOrder: (id, reason) => api.put(`/api/orders/${id}/cancel`, { reason }).then(res => res.data),
  getOrderHistory: () => api.get('/api/orders/history').then(res => res.data),
};

export default api;
