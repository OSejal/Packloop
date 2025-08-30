const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT token middleware
exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        let token;
        if (authHeader) {
            token = authHeader.startsWith('Bearer ') 
                ? authHeader.slice(7) 
                : authHeader;
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.status && user.status !== 'ACTIVE') {
            return res.status(403).json({
                success: false,
                message: 'Account is not active'
            });
        }

        req.user = {
            id: decoded.userId,
            userId: decoded.userId,
            role: user.role
        };
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token'
        });
    }
};

// Role-based access control middleware
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Unauthorized access: Role ${req.user.role} not allowed`
            });
        }
        next();
    };
};