import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPackage,
  FiChevronDown,
  FiMapPin,
  FiPlay,
  FiPause,
} from "react-icons/fi";
import { orderService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { toast } from "react-hot-toast";

// Import MapComponent
import MapComponent from "../components/MapComponent";

const Orders = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [orderLocation, setOrderLocation] = useState(null);
  const pollRef = useRef(null);

  // list filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // status updates
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Map view state
  const [showMapView, setShowMapView] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

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

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

  // Track Order - Toggle map view
  const handleTrackOrder = (order) => {
    setSelectedOrder(order);
    setShowMapView(true);
    startPollingLocation(order._id);
  };

  const startPollingLocation = (orderId) => {
    clearInterval(pollRef.current);
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

        {/* Show Map or Orders List */}
        {showMapView && selectedOrder ? (
          <div className="p-6">
            <div className="h-96">
              <MapComponent selectedOrder={selectedOrder} orderLocation={orderLocation} />
            </div>
            {/* MCP Controls */}
            {user?.role === "MCP" && (
              <div className="mt-4 flex gap-4">
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
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
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
                        onClick={() => handleTrackOrder(order)}
                        className="text-green-600 hover:text-green-900 flex items-center gap-1"
                      >
                        <FiMapPin className="h-4 w-4" />
                        Track Order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
