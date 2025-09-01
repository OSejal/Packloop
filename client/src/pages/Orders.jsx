import { useEffect, useMemo, useRef, useState } from "react";

// Mock data and services for demo
const mockOrders = [
  {
    _id: "order1234567890",
    createdAt: "2025-09-01T10:00:00Z",
    totalAmount: 250.50,
    status: "SHIPPED"
  },
  {
    _id: "order0987654321", 
    createdAt: "2025-08-31T15:30:00Z",
    totalAmount: 150.75,
    status: "PROCESSING"
  },
  {
    _id: "order1122334455",
    createdAt: "2025-08-30T12:15:00Z", 
    totalAmount: 320.00,
    status: "DELIVERED"
  }
];

const mockUser = { role: "MCP" };

const Orders = () => {
  const user = mockUser;

  const [orders, setOrders] = useState(mockOrders);
  const [isLoading, setIsLoading] = useState(false);
  const [orderLocation, setOrderLocation] = useState(null);
  const pollRef = useRef(null);

  // details modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // list filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // status updates
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Map view state - CHANGED: Always show map when tracking is active
  const [showMapView, setShowMapView] = useState(false);
  const [trackingOrderId, setTrackingOrderId] = useState(null);

  // live tracking state
  const [isSharing, setIsSharing] = useState(false);
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [isDelivering, setIsDelivering] = useState(false);
  const watchRef = useRef(null);
  const sharingOrderIdRef = useRef(null);

  // Ranchi coordinates
  const pickup = [23.3441, 85.3096];
  const drop = [23.3550, 85.3200];
  const [currentPos, setCurrentPos] = useState(pickup);

  // Helpers
  const tableHeaders = useMemo(
    () => ["Order ID", "Date", "Amount", "Status", "Actions"],
    []
  );

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const formatDateTime = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatAmount = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);

  const getStatusColor = (status) => {
    const statusColors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      SHIPPED: "bg-indigo-100 text-indigo-800",
      DELIVERED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusColors[status] || "bg-gray-100 text-gray-800";
  };

  const canTrackOrder = (status) => {
    return ['SHIPPED', 'PROCESSING'].includes(status);
  };

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  // FIXED: Track Order - Show map alongside orders
  const handleTrackOrder = () => {
    setShowMapView(!showMapView);
    if (!showMapView) {
      // When opening map, track first trackable order if available
      const trackableOrder = filteredOrders.find(order => canTrackOrder(order.status));
      if (trackableOrder) {
        setTrackingOrderId(trackableOrder._id);
      }
    } else {
      // When closing map, reset tracking
      setTrackingOrderId(null);
      setIsDelivering(false);
      setDeliveryProgress(0);
    }
  };

  // Handle tracking a specific order from table or modal
  const handleTrackSpecificOrder = (order) => {
    setTrackingOrderId(order._id);
    setShowMapView(true);
    setShowDetailModal(false);
    startDeliverySimulation();
  };

  // Delivery simulation
  const startDeliverySimulation = () => {
    setIsDelivering(true);
    setDeliveryProgress(0);
    setCurrentPos(pickup);
  };

  // Simulate delivery progress
  useEffect(() => {
    if (isDelivering) {
      const interval = setInterval(() => {
        setDeliveryProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsDelivering(false);
            return 100;
          }
          const newProgress = prev + 2;
          
          // Update current position
          const newLat = pickup[0] + (drop[0] - pickup[0]) * (newProgress / 100);
          const newLng = pickup[1] + (drop[1] - pickup[1]) * (newProgress / 100);
          setCurrentPos([newLat, newLng]);
          
          return newProgress;
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [isDelivering]);

  // View details modal
  const handleViewDetails = (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    setSelectedOrder(order);
    setSelectedOrderId(orderId);
    setShowDetailModal(true);
    setNewStatus(order.status);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrderId(null);
    setSelectedOrder(null);
  };

  // Create Google Maps URL
  const createMapUrl = () => {
    const baseUrl = "https://www.google.com/maps/embed/v1/directions";
    const apiKey = "demo"; // Replace with actual API key
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d58667.22307907394!2d85.28958!3d23.34414!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f4e104aa5bd67f%3A0x6020659417dfd20c!2sRanchi%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1693567890123!5m2!1sen!2sin`;
  };

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl">
      {/* CHANGED: Now shows both orders AND map side by side when tracking */}
      <div className={`grid gap-6 ${showMapView ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
        
        {/* Orders Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-green-600 px-6 py-4 text-white">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Your Orders</h2>

              <div className="relative flex items-center gap-3">
                <button
                  onClick={handleTrackOrder}
                  className="flex items-center gap-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  <span className="text-sm">📍</span>
                  {showMapView ? 'Hide Tracking' : 'Show Tracking'}
                </button>
                
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none bg-white bg-opacity-20 text-white placeholder-white rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    <option value="ALL" className="text-black">All Orders</option>
                    <option value="PENDING" className="text-black">Pending</option>
                    <option value="PROCESSING" className="text-black">Processing</option>
                    <option value="SHIPPED" className="text-black">Shipped</option>
                    <option value="DELIVERED" className="text-black">Delivered</option>
                    <option value="CANCELLED" className="text-black">Cancelled</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <span className="h-5 w-5 text-white">▼</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <span className="text-6xl text-gray-400 block mb-4">📦</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
              <p className="text-gray-600">You haven't placed any orders yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {tableHeaders.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order._id}
                      className={trackingOrderId === order._id ? 'bg-blue-50' : ''}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order._id.slice(-8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatAmount(order.totalAmount || order.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleViewDetails(order._id)}
                            className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                          >
                            <span className="text-sm">👁️</span>
                            Details
                          </button>
                          
                          {canTrackOrder(order.status) && (
                            <button
                              onClick={() => handleTrackSpecificOrder(order)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <span className="text-sm">📍</span>
                              Track
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ADDED: Map Section - Shows alongside orders */}
        {showMapView && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-600 px-6 py-4 text-white">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  Order Tracking {trackingOrderId && `- #${trackingOrderId.slice(-8)}`}
                </h3>
                <button
                  onClick={() => setShowMapView(false)}
                  className="text-white hover:text-gray-200"
                >
                  <span className="text-lg">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Map Container with Tracking Overlay */}
              <div className="relative">
                {/* Google Maps Iframe */}
                <div className="h-80 w-full rounded-lg overflow-hidden border shadow-lg">
                  <iframe
                    src={createMapUrl()}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Order Tracking Map - Ranchi"
                  ></iframe>
                </div>

                {/* Tracking Overlay */}
                <div className="absolute top-4 left-4 right-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-800">Live Tracking</h4>
                      <div className="flex gap-2">
                        <button 
                          onClick={startDeliverySimulation}
                          disabled={isDelivering}
                          className={`px-3 py-1 text-xs rounded font-medium ${
                            isDelivering 
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {isDelivering ? 'Tracking...' : 'Start Tracking'}
                        </button>
                      </div>
                    </div>

                    {/* Route Progress */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium">Pickup</span>
                        </div>
                        
                        <div className="flex-1 mx-4">
                          <div className="relative">
                            <div className="h-0.5 bg-gray-300 rounded"></div>
                            <div 
                              className="absolute top-0 h-0.5 bg-blue-500 rounded transition-all duration-1000"
                              style={{ width: `${deliveryProgress}%` }}
                            ></div>
                            <div 
                              className="absolute top-0 w-4 h-4 bg-blue-500 rounded-full transform -translate-y-1.5 -translate-x-2 transition-all duration-1000 flex items-center justify-center"
                              style={{ left: `${deliveryProgress}%` }}
                            >
                              <span className="text-white text-xs">🚚</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Delivery</span>
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        </div>
                      </div>

                      {/* Progress Info */}
                      <div className="text-center">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          deliveryProgress === 100 
                            ? 'bg-green-100 text-green-800' 
                            : isDelivering 
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            deliveryProgress === 100 
                              ? 'bg-green-500' 
                              : isDelivering 
                                ? 'bg-blue-500 animate-pulse'
                                : 'bg-gray-400'
                          }`}></div>
                          {deliveryProgress === 100 
                            ? 'Delivered!' 
                            : isDelivering 
                              ? `${deliveryProgress}% Complete`
                              : 'Ready to Track'
                          }
                        </div>
                      </div>

                      {/* Live Coordinates */}
                      <div className="text-xs text-gray-600 text-center">
                        Current: {currentPos[0].toFixed(4)}°N, {currentPos[1].toFixed(4)}°E
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Status */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="font-medium">
                          {trackingOrderId ? `Order #${trackingOrderId.slice(-8)}` : 'Select an order to track'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600">
                        Ranchi, Jharkhand
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map Controls */}
              <div className="mt-4 flex justify-between items-center text-sm">
                <div className="text-gray-600">
                  Tracking: {trackingOrderId ? `Order #${trackingOrderId.slice(-8)}` : 'No order selected'}
                </div>
                <a 
                  href={`https://www.google.com/maps?q=${pickup[0]},${pickup[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Modal - Unchanged */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTrackSpecificOrder(selectedOrder)}
                  className="text-green-600 hover:text-green-900 flex items-center gap-1 mr-2"
                  title="Show tracking map"
                >
                  <span className="text-sm">📍</span>
                  Track Order
                </button>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order ID</label>
                  <p className="text-sm text-gray-900">#{selectedOrder._id.slice(-8)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm text-gray-900">{formatDateTime(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm text-gray-900">{formatAmount(selectedOrder.totalAmount || selectedOrder.amount)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                      selectedOrder.status
                    )}`}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
              </div>

              {/* Location Info */}
              {orderLocation && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Current Location</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">
                      Latitude: {orderLocation.latitude}
                    </p>
                    <p className="text-sm text-gray-600">
                      Longitude: {orderLocation.longitude}
                    </p>
                    {orderLocation.updatedAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        Last updated: {formatDateTime(orderLocation.updatedAt)}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;