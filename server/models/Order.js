const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    mcpId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    pickupPartnerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'], // Updated for frontend compatibility
        default: 'PENDING'
    },
    pickupLocation: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            pincode: String,
            landmark: String
        }
    },
    // Current location for real-time tracking (what MCP shares)
    currentLocation: {
        latitude: Number,
        longitude: Number,
        updatedAt: Date
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Add totalAmount field that frontend expects
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    commission: {
        type: Number,
        required: true,
        min: 0
    },
    scheduledTime: {
        type: Date,
        required: true
    },
    completedTime: Date,
    customerNotes: String,
    partnerNotes: String,
    statusHistory: [{
        status: {
            type: String,
            enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] // Updated enum
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        note: String
    }],
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'FAILED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Indexes for quick lookups
orderSchema.index({ mcpId: 1, status: 1 });
orderSchema.index({ pickupPartnerId: 1, status: 1 });
orderSchema.index({ customerId: 1 });
orderSchema.index({ pickupLocation: '2dsphere' });
orderSchema.index({ scheduledTime: 1 });
orderSchema.index({ status: 1, scheduledTime: 1 });

// Update timestamps on save
orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Updated method to handle new status values
orderSchema.methods.updateStatus = function(newStatus, note = '') {
    this.status = newStatus;
    this.statusHistory.push({
        status: newStatus,
        note: note
    });
    
    if (newStatus === 'DELIVERED') { // Changed from 'COMPLETED' to 'DELIVERED'
        this.completedTime = Date.now();
    }
    
    return this.save();
};

// Method to update current location (for MCP real-time sharing)
orderSchema.methods.updateLocation = function(latitude, longitude) {
    this.currentLocation = {
        latitude,
        longitude,
        updatedAt: Date.now()
    };
    return this.save();
};

// Method to assign pickup partner
orderSchema.methods.assignPartner = function(partnerId) {
    this.pickupPartnerId = partnerId;
    this.status = 'PROCESSING'; // Changed from 'ASSIGNED' to match frontend enum
    this.statusHistory.push({
        status: 'PROCESSING',
        note: `Assigned to partner ${partnerId}`
    });
    
    return this.save();
};

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;