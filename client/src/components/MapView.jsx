import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPackage,
  FiChevronDown,
  FiEye,
  FiX,
  FiPlay,
  FiPause,
  FiMapPin,
} from "react-icons/fi";
import { orderService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { toast } from "react-hot-toast";

const Orders = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
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

  // MapView modal state
  const [showMapView, setShowMapView] = useState(false);
  const [selectedTrackingOrder, setSelectedTrackingOrder] = useState(null);

  // live tracking state (sharing for MCP)
  const [isSharing, setIsSharing] = useState(false);
  const watchRef = useRef(null);
  const sharingOrderIdRef = useRef(null);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
    return () => {
      stopSharingLocation();
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderService.getOrders();
      setOrders(response.data?.data?.orders ?? []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

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
    new Intl.NumberFormat("en-US", {
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

  // Helper function to determine if an order can be tracked
  const canTrackOrder = (status) => {
    return ['SHIPPED', 'PROCESSING'].includes(status);
  };

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  // Track Order - Always show map
  const handleTrackOrder = () => {
    // Create a default order object for Ranchi
    const defaultOrder = {
      _id: "default-ranchi-order",
      status: "TRACKING",
      totalAmount: 0,
      amount: 0,
      createdAt: new Date().toISOString(),
      location: {
        latitude: 23.3441,
        longitude: 85.3096
      }
    };

    setSelectedTrackingOrder(defaultOrder);
    setShowMapView(true);
  };

  // Handle tracking a specific order from details modal
  const handleTrackSpecificOrder = (order) => {
    setSelectedTrackingOrder(order);
    setShowDetailModal(false);
    setShowMapView(true);
  };

  const closeMapView = () => {
    setShowMapView(false);
    setSelectedTrackingOrder(null);
  };

  // View details + start polling location
  const handleViewDetails = (orderId) => {
    const order = orders.find((o) => o._id === orderId);
    if (!order) return;
    setSelectedOrder(order);
    setSelectedOrderId(orderId);
    setShowDetailModal(true);
    setNewStatus(order.status);

    // start polling this order's location
    startPollingLocation(orderId);
  };

  const startPollingLocation = (orderId) => {
    clearInterval(pollRef.current);
    // fetch immediately then every 5s
    const fetchOnce = async () => {
      try {
        const res = await orderService.getOrderLocation(orderId);
        const loc = res?.data?.location || res?.data?.data?.location;
        setOrderLocation(loc ?? null);
      } catch (err) {
        console.error("getOrderLocation error:", err);
      }
    };
    fetchOnce();
    pollRef.current = setInterval(fetchOnce, 5000);
  };

  const stopPollingLocation = () => {
    clearInterval(pollRef.current);
    pollRef.current = null;
    setOrderLocation(null);
  };

  // MCP: Share live location
  const startSharingLocation = (orderId) => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }
    if (watchRef.current) {
      stopSharingLocation();
    }

    sharingOrderIdRef.current = orderId;
    watchRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await orderService.updateOrderLocation(orderId, {
            latitude,
            longitude,
          });
        } catch (err) {
          console.error("updateOrderLocation error:", err);
        }
      },
      (err) => {
        console.error("Geolocation error:", err);
        toast.error(err.message || "Failed to get location");
        stopSharingLocation();
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    setIsSharing(true);
    toast.success("Started sharing location");
  };

  const stopSharingLocation = () => {
    if (watchRef.current) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setIsSharing(false);
    sharingOrderIdRef.current = null;
  };

  // when closing modal, stop polling
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedOrderId(null);
    setSelectedOrder(null);
    stopPollingLocation();
  };

  // Update status
  const handleUpdateStatus = async () => {
    if (!selectedOrderId || !newStatus || newStatus === selectedOrder?.status)
      return;

    try {
      setIsUpdatingStatus(true);
      await orderService.updateOrderStatus(selectedOrderId, newStatus);

      setOrders((prev) =>
        prev.map((o) =>
          o._id === selectedOrderId ? { ...o, status: newStatus } : o
        )
      );
      setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success("Order status updated successfully");
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error(
        error.response?.data?.message || "Failed to update order status"
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
        <div className="bg-green-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Your Orders</h2>

            <div className="relative flex items-center gap-3">
              <Button
                onClick={handleTrackOrder}
                variant="primary"
                icon={<FiMapPin />}
              >
                Track Order
              </Button>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="appearance-none bg-white bg-opacity-20 text-black rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  <option value="ALL">All Orders</option>
                  <option value="PENDING">Pending</option>
                  <option value="PROCESSING">Processing</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FiChevronDown className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table/List */}
        {filteredOrders.length === 0 ? (
          <EmptyState
            icon={<FiPackage />}
            title="No Orders Found"
            description="You haven't placed any orders yet."
          />
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
                  <tr key={order._id}>
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
                      <button
                        onClick={() => handleViewDetails(order._id)}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <FiEye className="h-4 w-4" />
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Map Modal - Simple placeholder instead of MapView component */}
      {showMapView && selectedTrackingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold">
                Track Order #{selectedTrackingOrder._id.slice(-8)}
              </h3>
              <button
                onClick={closeMapView}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-4">
              <div className="mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTrackingOrder.status)}`}>
                    {selectedTrackingOrder.status}
                  </span>
                  <span className="text-sm text-gray-500">
                    Amount: {formatAmount(selectedTrackingOrder.totalAmount || selectedTrackingOrder.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Order Date: {formatDate(selectedTrackingOrder.createdAt)}
                  </span>
                </div>
              </div>
              
              {/* Simple Map Placeholder */}
              <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <FiMapPin className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Order Tracking - Ranchi
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Tracking Order #{selectedTrackingOrder._id.slice(-8)}
                  </p>
                  <div className="bg-white p-4 rounded-lg shadow-sm max-w-sm mx-auto">
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Location:</strong> Ranchi, Jharkhand
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Coordinates:</strong> 23.3441°N, 85.3096°E
                    </p>
                    <p className="text-sm text-gray-500">
                      Map integration will be added here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Order Details</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleTrackSpecificOrder(selectedOrder)}
                  className="text-green-600 hover:text-green-900 flex items-center gap-1 mr-2"
                  title="Track this order on map"
                >
                  <FiMapPin className="h-4 w-4" />
                  Track on Map
                </button>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
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

              {/* Status Update Section */}
              {user?.role === "MCP" && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Update Order Status</h4>
                  <div className="flex items-center gap-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                    <Button
                      onClick={handleUpdateStatus}
                      disabled={isUpdatingStatus || newStatus === selectedOrder.status}
                      variant="primary"
                    >
                      {isUpdatingStatus ? "Updating..." : "Update Status"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Location Sharing for MCP */}
              {user?.role === "MCP" && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Location Sharing</h4>
                  <div className="flex items-center gap-3">
                    {isSharing && sharingOrderIdRef.current === selectedOrder._id ? (
                      <Button
                        onClick={stopSharingLocation}
                        variant="secondary"
                        icon={<FiPause />}
                      >
                        Stop Sharing Location
                      </Button>
                    ) : (
                      <Button
                        onClick={() => startSharingLocation(selectedOrder._id)}
                        variant="primary"
                        icon={<FiPlay />}
                      >
                        Start Sharing Location
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Live Location Display */}
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