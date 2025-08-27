import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api, { partnerService } from "../services/api";
import { FiUser, FiMail, FiLock, FiPhone, FiUserPlus, FiEye, FiEyeOff } from 'react-icons/fi';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'MCP',
    mcpId: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mcpPartners, setMcpPartners] = useState([]);
  const [isLoadingMcps, setIsLoadingMcps] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();



  // Fetch MCPs on mount + whenever role is PICKUP_PARTNER
  useEffect(() => {
    if (formData.role === 'PICKUP_PARTNER') {
      fetchMcpPartners();
    }
  }, [formData.role]);

  const fetchMcpPartners = async () => {
    try {
      setIsLoadingMcps(true);
      const response = await partnerService.getPartners();
      const mcps = response.data.data.partners.filter(p => p.role === 'MCP');
      setMcpPartners(mcps);
    } catch (error) {
      console.error('Error fetching MCP partners:', error);
    } finally {
      setIsLoadingMcps(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    if (formData.role === 'PICKUP_PARTNER' && !formData.mcpId) {
      newErrors.mcpId = 'MCP selection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validate()) return;

  setIsSubmitting(true);

  const userData = { ...formData };
  if (userData.role !== "PICKUP_PARTNER") delete userData.mcpId;

  try {
    // Use the environment variable for the backend URL
    const API_URL = import.meta.env.VITE_API_URL;
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    const data = await res.json();

    if (data.success) {
      alert("Registration successful!");
      navigate("/login"); // redirect to login page
    } else {
      alert(data.message || "Something went wrong");
    }
  } catch (error) {
    console.error("Register error:", error);
    alert("Server not responding");
  } finally {
    setIsSubmitting(false);
  }
};


  return (
    <div className="flex min-h-[calc(100vh-200px)] py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 mx-auto">
        <div className="bg-white p-8 rounded-lg shadow-lg space-y-8">
          <h2 className="text-center text-3xl font-bold text-gray-900">Create new account</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-green-600 hover:text-green-500">
              sign in to your account
            </Link>
          </p>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {/* Full Name */}
              <div className="relative">
                <FiUser className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Full Name"
                  className={`block w-full rounded-md border py-2 pl-10 pr-3 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-green-600`}
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}

              {/* Email */}
              <div className="relative">
                <FiMail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email address"
                  className={`block w-full rounded-md border py-2 pl-10 pr-3 ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-green-600`}
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}

              {/* Password */}
              <div className="relative">
                <FiLock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Password"
                  className={`block w-full rounded-md border py-2 pl-10 pr-3 ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-green-600`}
                  value={formData.password}
                  onChange={handleChange}
                />
                 <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <FiEyeOff className="h-5 w-5" />
                    ) : (
                      <FiEye className="h-5 w-5" />
                    )}
                  </button>
              </div>
              {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}

              {/* Phone */}
              <div className="relative">
                <FiPhone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="Phone Number"
                  className={`block w-full rounded-md border py-2 pl-10 pr-3 ${
                    errors.phone ? 'border-red-300' : 'border-gray-300'
                  } focus:ring-2 focus:ring-green-600`}
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              {errors.phone && <p className="text-sm text-red-600">{errors.phone}</p>}

              {/* Role */}
              <select
                id="role"
                name="role"
                className="block w-full rounded-md border py-2 px-3 text-gray-900 ring-1 ring-gray-300 focus:ring-2 focus:ring-green-600"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="MCP">MCP (Micro Controller Partner)</option>
                <option value="PICKUP_PARTNER">Pickup Partner</option>
              </select>

              {/* MCP Partner dropdown */}
              {formData.role === 'PICKUP_PARTNER' && (
                <div>
                  <label htmlFor="mcpId" className="block text-sm font-medium text-gray-700 mb-1">
                    Select MCP Partner
                  </label>
                  <select
                    id="mcpId"
                    name="mcpId"
                    className={`block w-full rounded-md border py-2 px-3 ${
                      errors.mcpId ? 'border-red-300' : 'border-gray-300'
                    } focus:ring-2 focus:ring-green-600`}
                    value={formData.mcpId}
                    onChange={handleChange}
                    disabled={isLoadingMcps || mcpPartners.length === 0}
                  >
                    <option value="">Select MCP Partner</option>
                    {mcpPartners.map((mcp) => (
                      <option key={mcp._id} value={mcp._id}>
                        {mcp.name}
                      </option>
                    ))}
                  </select>
                  {errors.mcpId && <p className="text-sm text-red-600">{errors.mcpId}</p>}
                  {isLoadingMcps && <p className="text-sm text-gray-500">Loading MCP partners...</p>}
                  {!isLoadingMcps && mcpPartners.length === 0 && (
                    <p className="text-sm text-yellow-600">No MCP partners found. Please contact admin.</p>
                  )}
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full justify-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-500 disabled:bg-green-300"
            >
              <FiUserPlus className="h-5 w-5 mr-2" />
              {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
