const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

// Import your existing routes
const createBoxRoutes = require('./backend/routes/boxes');
const createAffiliateRoutes = require('./backend/routes/affiliates');
const AdminAuthService = require('./backend/services/AdminAuthService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize admin service
const adminAuthService = new AdminAuthService(supabase);

// Middleware helpers
const authenticateAdmin = (service) => async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const admin = await service.validateSession(token);
        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

const requirePermission = (permission) => (req, res, next) => {
    if (!req.admin?.permissions?.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
};

// Mount routes
app.use('/api/admin/boxes', createBoxRoutes(supabase, adminAuthService, authenticateAdmin, requirePermission));
app.use('/api/affiliates', createAffiliateRoutes(supabase));

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Export for Vercel
module.exports = app;
