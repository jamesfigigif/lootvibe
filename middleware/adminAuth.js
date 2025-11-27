const AdminAuthService = require('../services/AdminAuthService');

/**
 * Middleware to verify admin JWT token
 */
function authenticateAdmin(authService) {
    return async (req, res, next) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ error: 'No token provided' });
            }

            const token = authHeader.substring(7);
            const decoded = authService.verifyToken(token);

            if (!decoded) {
                return res.status(401).json({ error: 'Invalid token' });
            }

            // Get admin details
            const admin = await authService.getAdminById(decoded.id);
            if (!admin) {
                return res.status(401).json({ error: 'Admin not found' });
            }

            req.admin = admin;
            next();
        } catch (error) {
            console.error('Auth error:', error);
            res.status(401).json({ error: 'Authentication failed' });
        }
    };
}

/**
 * Middleware to check admin permissions
 */
function requirePermission(permission) {
    return (req, res, next) => {
        const authService = new AdminAuthService(req.supabase);

        if (!req.admin) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (!authService.hasPermission(req.admin.role, permission)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    };
}

module.exports = {
    authenticateAdmin,
    requirePermission
};
