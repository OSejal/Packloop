import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiPackage,
  FiFilter,
  FiChevronDown,
  FiEye,
  FiCalendar,
  FiClock,
  FiShoppingBag,
  FiX,
  FiUserPlus,
  FiPlay,
  FiPause,
} from "react-icons/fi";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { orderService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import EmptyState from "../components/EmptyState";
import Button from "../components/Button";
import { toast } from "react-hot-toast";

// --- Optional: better default marker icon for Leaflet in bundlers ---
const DefaultIcon = L.icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Small map component
const OrderTrackingMap = ({ location }) => {
  if (!location?.latitude || !location?.longitude) {
    return (
      <div className="text-sm text-gray-500 border rounded p-3">
        Waiting for live location…
      </div>
    );
  }

  const center = [location.latitude, location.longitude];

  return (
    <div className="w-full h-64 rounded overflow-hidden">
      <MapContainer
        center={center}
        zoom={15}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={center}>
          <Popup>Delivery partner is here 🚚</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

const Orders = () => {
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // details modal
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // list filter
  const [statusFilter, setStatusFilter] = useState("ALL");

  // status updates
  const [newStatus, setNewStatus] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // live tracking state (viewing)
  const [orderLocation, setOrderLocation] = useState(null);
  const pollRef = useRef(null);

  // live tracking state (sharing for MCP)
  const [isSharing, setIsSharing] = useState(false);
  const watchRef = useRef(null);
  const sharingOrderIdRef = useRef(null);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
    // cleanup (stop sharing if page unmounts)
    return () => {
      stopSharingLocation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const filteredOrders =
    statusFilter === "ALL"
      ? orders
      : orders.filter((o) => o.status === statusFilter);

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
        // Expecting { data: { location: { latitude, longitude, updatedAt? } } }
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
      // already sharing for another order, stop first
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

      // Update local state
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

  // Render
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
              {/* (Optional) CTA — you can repurpose this or remove */}
              <Button
                onClick={() => toast("Enter an order to track")}
                variant="primary"
                icon={<FiUserPlus />}
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

        {filteredOrders.length === 0 ? (
          <EmptyState
            title={
              statusFilter === "ALL" ? "No orders yet" : `No ${statusFilter.toLowerCase()} orders`
            }
            description={
              statusFilter === "ALL"
                ? "You haven't placed any orders yet"
                : `You don't have any orders with status "${statusFilter.toLowerCase()}"`
            }
            icon={<FiPackage className="w-12 h-12 text-gray-400 ml-20" />}
            actionButton={
              statusFilter !== "ALL" ? (
                <Button onClick={() => setStatusFilter("ALL")} variant="outline" icon={<FiFilter />}>
                  Show All Orders
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order._id.substring(order._id.length - 8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(order.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatAmount(order.totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="link"
                          size="sm"
                          icon={<FiEye />}
                          onClick={() => handleViewDetails(order._id)}
                        >
                          View Details
                        </Button>

                        {user?.role === "MCP" && (
                          <>
                            {!isSharing || sharingOrderIdRef.current !== order._id ? (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<FiPlay />}
                                onClick={() => startSharingLocation(order._id)}
                              >
                                Share Location
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                icon={<FiPause />}
                                onClick={stopSharingLocation}
                              >
                                Stop Sharing
                              </Button>
                            )}
                          </>
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

      {/* Order Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={closeDetailModal}
            />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                  onClick={closeDetailModal}
                >
                  <span className="sr-only">Close</span>
                  <FiX className="h-6 w-6" />
                </button>
              </div>

              <div>
                <div className="mt-3 sm:mt-0">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <FiPackage className="mr-2" /> Order Details
                  </h3>

                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Order ID:</span>
                      <span className="text-sm text-gray-900">#{selectedOrder._id}</span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Order Date:</span>
                      <span className="text-sm text-gray-900 flex items-center">
                        <FiCalendar className="mr-1 h-4 w-4" />
                        {formatDateTime(selectedOrder.createdAt)}
                      </span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          selectedOrder.status
                        )}`}
                      >
                        {selectedOrder.status}
                      </span>
                    </div>

                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium text-gray-500">Total Amount:</span>
                      <span className="text-sm font-medium text-gray-900">
                        {formatAmount(selectedOrder.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                      <FiShoppingBag className="mr-2" /> Order Items
                    </h4>

                    <div className="space-y-3">
                      {selectedOrder.items?.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between py-2 border-b border-gray-100"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {item.name || `Item #${index + 1}`}
                            </p>
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatAmount(item.price || 0)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Live Tracking */}
                  <div className="mt-6 border-t border-gray-200 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Live Order Tracking
                    </h4>
                    <OrderTrackingMap location={orderLocation} />
                    {orderLocation?.updatedAt && (
                      <p className="text-xs text-gray-500 mt-2">
                        Last updated: {formatDateTime(orderLocation.updatedAt)}
                      </p>
                    )}
                  </div>

                  {/* Update Status (MCP only) */}
                  {user && user.role === "MCP" && (
                    <div className="mt-6 border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                        <FiClock className="mr-2" /> Update Order Status
                      </h4>

                      <div className="flex space-x-2">
                        <select
                          className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                          value={newStatus}
                          onChange={(e) => setNewStatus(e.target.value)}
                          disabled={isUpdatingStatus}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>

                        <Button
                          onClick={handleUpdateStatus}
                          variant="primary"
                          size="sm"
                          disabled={
                            isUpdatingStatus || newStatus === selectedOrder.status
                          }
                          loading={isUpdatingStatus}
                        >
                          Update
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <Button variant="outline" fullWidth onClick={closeDetailModal}>
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
