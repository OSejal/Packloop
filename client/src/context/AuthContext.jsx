import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // On mount, check if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchUserProfile();
    else setLoading(false);
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const res = await authService.getProfile();
      setUser(res.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const res = await authService.login(credentials);

      if (res.success) {
        const { token, user } = res.data; // ✅ token & user from API response
        localStorage.setItem('token', token); // store token
        setUser(user);
        setIsAuthenticated(true);
        toast.success('Login successful');
      }

      return res;
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed');
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const res = await authService.register(userData);
      if (res.success) {
        const { token, user } = res.data;
        localStorage.setItem('token', token);
        setUser(user);
        setIsAuthenticated(true);
        toast.success('Registration successful');
      }
      return res;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, isAuthenticated, login, register, logout, fetchUserProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
