const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, authorize } = require('../middleware/auth');

// All routes are protected
router.use(verifyToken);

// Create new order (MCP only)
router.post('/', authorize('MCP'), orderController.createOrder);

// Get orders with filters
router.get('/', orderController.getOrders);

// Get order statistics - MUST come before /:orderId routes to avoid conflicts
router.get('/stats/overview', orderController.getOrderStats);

// Get order details
router.get('/:orderId', orderController.getOrderDetails);

// Location tracking routes
router.get('/:orderId/location', orderController.getOrderLocation);
router.patch('/:orderId/location', orderController.updateOrderLocation);

// Assign order to pickup partner (MCP only)
router.post('/:orderId/assign', authorize('MCP'), orderController.assignOrder);

// Update order status - Changed to PATCH and using URL params (MCP only for status updates)
router.patch('/:orderId/status', authorize('MCP'), orderController.updateOrderStatusV2);

// Keep the old PUT route for backward compatibility if needed
router.put('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;