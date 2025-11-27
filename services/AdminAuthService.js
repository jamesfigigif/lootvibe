const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
const JWT_EXPIRES_IN = '24h';

class AdminAuthService {
    constructor(supabaseClient) {
        this.supabase = supabaseClient;
    }

    /**
     * Hash a password
     */
    async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    /**
     * Verify password
     */
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    /**
     * Generate JWT token
     */
    generateToken(admin) {
        return jwt.sign(
            {
                id: admin.id,
                email: admin.email,
                role: admin.role
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    /**
     * Verify JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return null;
        }
    }

    /**
     * Admin login
     */
    async login(email, password, ipAddress) {
        try {
            // Get admin user
            const { data: admin, error } = await this.supabase
                .from('admin_users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !admin) {
                throw new Error('Invalid credentials');
            }

            // Verify password
            const isValid = await this.verifyPassword(password, admin.password_hash);
            if (!isValid) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            await this.supabase
                .from('admin_users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', admin.id);

            // Log login activity
            await this.logActivity(admin.id, 'LOGIN', null, null, { success: true }, ipAddress);

            // Generate token
            const token = this.generateToken(admin);

            return {
                token,
                admin: {
                    id: admin.id,
                    email: admin.email,
                    role: admin.role,
                    twoFaEnabled: admin.two_fa_enabled
                }
            };
        } catch (error) {
            // Log failed login attempt
            if (email) {
                await this.logActivity(null, 'LOGIN_FAILED', null, null, { email }, ipAddress);
            }
            throw error;
        }
    }

    /**
     * Get admin by ID
     */
    async getAdminById(adminId) {
        const { data: admin, error } = await this.supabase
            .from('admin_users')
            .select('id, email, role, two_fa_enabled, last_login, created_at')
            .eq('id', adminId)
            .single();

        if (error) throw error;
        return admin;
    }

    /**
     * Log admin activity
     */
    async logActivity(adminId, action, targetType, targetId, details, ipAddress) {
        try {
            await this.supabase
                .from('admin_logs')
                .insert({
                    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    admin_id: adminId,
                    action,
                    target_type: targetType,
                    target_id: targetId,
                    details,
                    ip_address: ipAddress
                });
        } catch (error) {
            console.error('Error logging activity:', error);
        }
    }

    /**
     * Check permissions
     */
    hasPermission(adminRole, requiredPermission) {
        const permissions = {
            'SUPER_ADMIN': ['*'], // All permissions
            'MODERATOR': ['view_users', 'edit_users', 'view_boxes', 'edit_boxes', 'view_deposits', 'verify_deposits', 'view_shipments', 'update_shipments', 'view_withdrawals', 'approve_withdrawals', 'view_analytics'],
            'SUPPORT': ['view_users', 'view_deposits', 'verify_deposits', 'view_shipments', 'update_shipments', 'view_withdrawals']
        };

        const rolePermissions = permissions[adminRole] || [];
        return rolePermissions.includes('*') || rolePermissions.includes(requiredPermission);
    }
}

module.exports = AdminAuthService;
