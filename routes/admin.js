const express = require('express');
const AdminAuthService = require('../services/AdminAuthService');
const { authenticateAdmin, requirePermission } = require('../middleware/adminAuth');

function createAdminRoutes(supabase) {
    const router = express.Router();
    const authService = new AdminAuthService(supabase);

    /**
     * POST /api/admin/login
     * Admin login
     */
    router.post('/login', async (req, res) => {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password required' });
            }

            const ipAddress = req.ip || req.connection.remoteAddress;
            const result = await authService.login(email, password, ipAddress);

            res.json(result);
        } catch (error) {
            console.error('Login error:', error);
            res.status(401).json({ error: error.message });
        }
    });

    /**
     * GET /api/admin/me
     * Get current admin user
     */
    router.get('/me', authenticateAdmin(authService), async (req, res) => {
        try {
            res.json({ admin: req.admin });
        } catch (error) {
            console.error('Get admin error:', error);
            res.status(500).json({ error: 'Failed to get admin details' });
        }
    });

    /**
     * GET /api/admin/users
     * Get all users with pagination and search
     */
    router.get('/users', authenticateAdmin(authService), requirePermission('view_users'), async (req, res) => {
        try {
            const { page = 1, limit = 50, search = '', sortBy = 'created_at', sortOrder = 'desc' } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('users')
                .select('*', { count: 'exact' });

            // Search
            if (search) {
                query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%,id.ilike.%${search}%`);
            }

            // Sort
            query = query.order(sortBy, { ascending: sortOrder === 'asc' });

            // Pagination
            query = query.range(offset, offset + limit - 1);

            const { data: users, error, count } = await query;

            if (error) throw error;

            res.json({
                users,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get users error:', error);
            res.status(500).json({ error: 'Failed to get users' });
        }
    });

    /**
     * GET /api/admin/users/:id
     * Get user details
     */
    router.get('/users/:id', authenticateAdmin(authService), requirePermission('view_users'), async (req, res) => {
        try {
            const { id } = req.params;

            // Get user
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;

            // Get inventory
            const { data: inventory } = await supabase
                .from('inventory_items')
                .select('*')
                .eq('user_id', id);

            // Get transactions
            const { data: transactions } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false })
                .limit(50);

            // Get shipments
            const { data: shipments } = await supabase
                .from('shipments')
                .select('*')
                .eq('user_id', id)
                .order('created_at', { ascending: false });

            res.json({
                user,
                inventory: inventory || [],
                transactions: transactions || [],
                shipments: shipments || []
            });
        } catch (error) {
            console.error('Get user error:', error);
            res.status(500).json({ error: 'Failed to get user details' });
        }
    });

    /**
     * PATCH /api/admin/users/:id/balance
     * Adjust user balance
     */
    router.patch('/users/:id/balance', authenticateAdmin(authService), requirePermission('edit_users'), async (req, res) => {
        try {
            const { id } = req.params;
            const { amount, reason } = req.body;

            if (typeof amount !== 'number') {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            // Get current balance
            const { data: user } = await supabase
                .from('users')
                .select('balance')
                .eq('id', id)
                .single();

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            const newBalance = parseFloat(user.balance) + amount;

            // Update balance
            const { error } = await supabase
                .from('users')
                .update({ balance: newBalance })
                .eq('id', id);

            if (error) throw error;

            // Create transaction record
            await supabase
                .from('transactions')
                .insert({
                    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: id,
                    type: amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL',
                    amount: Math.abs(amount),
                    description: `Admin adjustment: ${reason || 'Manual balance adjustment'}`,
                    timestamp: Date.now()
                });

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'BALANCE_ADJUSTMENT',
                'USER',
                id,
                { amount, reason, newBalance },
                req.ip
            );

            res.json({ success: true, newBalance });
        } catch (error) {
            console.error('Balance adjustment error:', error);
            res.status(500).json({ error: 'Failed to adjust balance' });
        }
    });

    /**
     * PATCH /api/admin/users/:id/ban
     * Ban or unban a user
     */
    router.patch('/users/:id/ban', authenticateAdmin(authService), requirePermission('edit_users'), async (req, res) => {
        try {
            const { id } = req.params;
            const { banned, reason } = req.body;

            if (typeof banned !== 'boolean') {
                return res.status(400).json({ error: 'Invalid banned status' });
            }

            // Get current user
            const { data: user } = await supabase
                .from('users')
                .select('banned')
                .eq('id', id)
                .single();

            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }

            // Update ban status
            const updates = {
                banned,
                banned_reason: banned ? reason : null,
                banned_at: banned ? new Date().toISOString() : null,
                banned_by: banned ? req.admin.id : null
            };

            const { error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                banned ? 'USER_BANNED' : 'USER_UNBANNED',
                'USER',
                id,
                { reason },
                req.ip
            );

            res.json({ success: true, banned });
        } catch (error) {
            console.error('Ban/unban error:', error);
            res.status(500).json({ error: 'Failed to update ban status' });
        }
    });

    /**
     * GET /api/admin/deposits
     * Get all crypto deposits
     */
    router.get('/deposits', authenticateAdmin(authService), requirePermission('view_deposits'), async (req, res) => {
        try {
            const { status, currency, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('crypto_deposits')
                .select('*', { count: 'exact' });

            if (status) {
                query = query.eq('status', status);
            }

            if (currency) {
                query = query.eq('currency', currency);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data: deposits, error, count } = await query;

            if (error) throw error;

            res.json({
                deposits,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get deposits error:', error);
            res.status(500).json({ error: 'Failed to get deposits' });
        }
    });

    /**
     * GET /api/admin/shipments
     * Get all shipments
     */
    router.get('/shipments', authenticateAdmin(authService), requirePermission('view_shipments'), async (req, res) => {
        try {
            const { status, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('shipments')
                .select('*', { count: 'exact' });

            if (status) {
                query = query.eq('status', status);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data: shipments, error, count } = await query;

            if (error) throw error;

            res.json({
                shipments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get shipments error:', error);
            res.status(500).json({ error: 'Failed to get shipments' });
        }
    });

    /**
     * PATCH /api/admin/shipments/:id
     * Update shipment status
     */
    router.patch('/shipments/:id', authenticateAdmin(authService), requirePermission('update_shipments'), async (req, res) => {
        try {
            const { id } = req.params;
            const { status, tracking_number } = req.body;

            const updates = {};
            if (status) updates.status = status;
            if (tracking_number) updates.tracking_number = tracking_number;

            const { error } = await supabase
                .from('shipments')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'SHIPMENT_UPDATE',
                'SHIPMENT',
                id,
                updates,
                req.ip
            );

            res.json({ success: true });
        } catch (error) {
            console.error('Update shipment error:', error);
            res.status(500).json({ error: 'Failed to update shipment' });
        }
    });

    /**
     * GET /api/admin/logs
     * Get activity logs
     */
    router.get('/logs', authenticateAdmin(authService), async (req, res) => {
        try {
            const { admin_id, action, target_type, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('admin_logs')
                .select('*, admin_users!admin_logs_admin_id_fkey(email)', { count: 'exact' });

            if (admin_id) {
                query = query.eq('admin_id', admin_id);
            }

            if (action) {
                query = query.eq('action', action);
            }

            if (target_type) {
                query = query.eq('target_type', target_type);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + parseInt(limit) - 1);

            const { data: logs, error, count } = await query;

            if (error) throw error;

            res.json({
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get logs error:', error);
            res.status(500).json({ error: 'Failed to get activity logs' });
        }
    });

    /**
     * GET /api/admin/stats
     * Get comprehensive dashboard statistics
     */
    router.get('/stats', authenticateAdmin(authService), async (req, res) => {
        try {
            const now = new Date();
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            
            const thisWeek = new Date(now);
            thisWeek.setDate(now.getDate() - 7);
            
            const thisMonth = new Date(now);
            thisMonth.setMonth(now.getMonth() - 1);

            // ========== USER STATISTICS ==========
            const { count: totalUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true });

            const { count: bannedUsers } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('banned', true);

            const { count: newUsersToday } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            const { count: newUsersThisWeek } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thisWeek.toISOString());

            // ========== REVENUE STATISTICS ==========
            // Today's revenue
            const { data: todayDeposits } = await supabase
                .from('crypto_deposits')
                .select('usd_value')
                .eq('status', 'CREDITED')
                .gte('credited_at', today.toISOString());
            const todayRevenue = todayDeposits?.reduce((sum, d) => sum + (parseFloat(d.usd_value) || 0), 0) || 0;

            // This week's revenue
            const { data: weekDeposits } = await supabase
                .from('crypto_deposits')
                .select('usd_value')
                .eq('status', 'CREDITED')
                .gte('credited_at', thisWeek.toISOString());
            const weekRevenue = weekDeposits?.reduce((sum, d) => sum + (parseFloat(d.usd_value) || 0), 0) || 0;

            // This month's revenue
            const { data: monthDeposits } = await supabase
                .from('crypto_deposits')
                .select('usd_value')
                .eq('status', 'CREDITED')
                .gte('credited_at', thisMonth.toISOString());
            const monthRevenue = monthDeposits?.reduce((sum, d) => sum + (parseFloat(d.usd_value) || 0), 0) || 0;

            // All-time revenue
            const { data: allDeposits } = await supabase
                .from('crypto_deposits')
                .select('usd_value')
                .eq('status', 'CREDITED');
            const allTimeRevenue = allDeposits?.reduce((sum, d) => sum + (parseFloat(d.usd_value) || 0), 0) || 0;

            // ========== BOX STATISTICS ==========
            const { count: totalBoxes } = await supabase
                .from('boxes')
                .select('*', { count: 'exact', head: true });

            const { count: enabledBoxes } = await supabase
                .from('boxes')
                .select('*', { count: 'exact', head: true })
                .eq('enabled', true);

            // Box openings today
            const { count: openingsToday } = await supabase
                .from('box_openings')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // Box openings this week
            const { count: openingsThisWeek } = await supabase
                .from('box_openings')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', thisWeek.toISOString());

            // Total box openings
            const { count: totalOpenings } = await supabase
                .from('box_openings')
                .select('*', { count: 'exact', head: true });

            // Revenue from box purchases (transactions of type DEPOSIT or purchases)
            const { data: boxTransactions } = await supabase
                .from('transactions')
                .select('amount')
                .ilike('description', '%box%')
                .gte('created_at', today.toISOString());
            const boxRevenueToday = boxTransactions?.reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

            // ========== BATTLE STATISTICS ==========
            const { count: totalBattles } = await supabase
                .from('battles')
                .select('*', { count: 'exact', head: true });

            const { count: activeBattles } = await supabase
                .from('battles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ACTIVE');

            const { count: waitingBattles } = await supabase
                .from('battles')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'WAITING');

            // ========== PENDING ITEMS ==========
            const { count: pendingDeposits } = await supabase
                .from('crypto_deposits')
                .select('*', { count: 'exact', head: true })
                .in('status', ['PENDING', 'CONFIRMING']);

            const { count: pendingShipments } = await supabase
                .from('shipments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');

            const { count: pendingWithdrawals } = await supabase
                .from('withdrawals')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'PENDING');

            // ========== WITHDRAWAL STATISTICS ==========
            const { data: withdrawals } = await supabase
                .from('withdrawals')
                .select('amount, status')
                .gte('created_at', today.toISOString());
            
            const withdrawalsToday = withdrawals?.length || 0;
            const withdrawalAmountToday = withdrawals?.reduce((sum, w) => {
                if (w.status === 'APPROVED' || w.status === 'PENDING') {
                    return sum + (parseFloat(w.amount) || 0);
                }
                return sum;
            }, 0) || 0;

            // ========== INVENTORY STATISTICS ==========
            const { count: totalInventoryItems } = await supabase
                .from('inventory_items')
                .select('*', { count: 'exact', head: true });

            // ========== AFFILIATE STATISTICS ==========
            const { count: totalAffiliates } = await supabase
                .from('affiliate_codes')
                .select('*', { count: 'exact', head: true });

            const { count: totalReferrals } = await supabase
                .from('affiliate_referrals')
                .select('*', { count: 'exact', head: true });

            // ========== RECENT ACTIVITY ==========
            // Recent users (last 5)
            const { data: recentUsers } = await supabase
                .from('users')
                .select('id, username, email, created_at, balance')
                .order('created_at', { ascending: false })
                .limit(5);

            // Recent deposits (last 5)
            const { data: recentDeposits } = await supabase
                .from('crypto_deposits')
                .select('id, user_id, usd_value, currency, status, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            // Recent box openings (last 5)
            const { data: recentOpenings } = await supabase
                .from('box_openings')
                .select('id, user_id, box_id, created_at')
                .order('created_at', { ascending: false })
                .limit(5);

            // ========== TOP USERS ==========
            // Top users by balance
            const { data: topUsersByBalance } = await supabase
                .from('users')
                .select('id, username, email, balance')
                .order('balance', { ascending: false })
                .limit(5);

            res.json({
                // User stats
                users: {
                    total: totalUsers || 0,
                    banned: bannedUsers || 0,
                    active: (totalUsers || 0) - (bannedUsers || 0),
                    newToday: newUsersToday || 0,
                    newThisWeek: newUsersThisWeek || 0,
                },
                
                // Revenue stats
                revenue: {
                    today: todayRevenue,
                    thisWeek: weekRevenue,
                    thisMonth: monthRevenue,
                    allTime: allTimeRevenue,
                },
                
                // Box stats
                boxes: {
                    total: totalBoxes || 0,
                    enabled: enabledBoxes || 0,
                    openingsToday: openingsToday || 0,
                    openingsThisWeek: openingsThisWeek || 0,
                    totalOpenings: totalOpenings || 0,
                    revenueToday: boxRevenueToday,
                },
                
                // Battle stats
                battles: {
                    total: totalBattles || 0,
                    active: activeBattles || 0,
                    waiting: waitingBattles || 0,
                },
                
                // Pending items
                pending: {
                    deposits: pendingDeposits || 0,
                    shipments: pendingShipments || 0,
                    withdrawals: pendingWithdrawals || 0,
                },
                
                // Withdrawal stats
                withdrawals: {
                    today: withdrawalsToday,
                    amountToday: withdrawalAmountToday,
                },
                
                // Inventory stats
                inventory: {
                    totalItems: totalInventoryItems || 0,
                },
                
                // Affiliate stats
                affiliates: {
                    totalAffiliates: totalAffiliates || 0,
                    totalReferrals: totalReferrals || 0,
                },
                
                // Recent activity
                recentActivity: {
                    users: recentUsers || [],
                    deposits: recentDeposits || [],
                    boxOpenings: recentOpenings || [],
                },
                
                // Top users
                topUsers: {
                    byBalance: topUsersByBalance || [],
                },
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({ error: 'Failed to get statistics' });
        }
    });

    /**
     * GET /api/admin/admins
     * Get all admin users (SUPER_ADMIN only)
     */
    router.get('/admins', authenticateAdmin(authService), async (req, res) => {
        try {
            // Only SUPER_ADMIN can view admin users
            if (req.admin.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { data: admins, error } = await supabase
                .from('admin_users')
                .select('id, email, role, two_fa_enabled, last_login, created_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json({ admins: admins || [] });
        } catch (error) {
            console.error('Get admins error:', error);
            res.status(500).json({ error: 'Failed to get admin users' });
        }
    });

    /**
     * POST /api/admin/admins
     * Create a new admin user (SUPER_ADMIN only)
     */
    router.post('/admins', authenticateAdmin(authService), async (req, res) => {
        try {
            // Only SUPER_ADMIN can create admin users
            if (req.admin.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { email, password, role } = req.body;

            if (!email || !password || !role) {
                return res.status(400).json({ error: 'Email, password, and role are required' });
            }

            // Validate role
            if (!['SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].includes(role)) {
                return res.status(400).json({ error: 'Invalid role' });
            }

            // Validate password length
            if (password.length < 8) {
                return res.status(400).json({ error: 'Password must be at least 8 characters' });
            }

            // Check if email already exists
            const { data: existingAdmin } = await supabase
                .from('admin_users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingAdmin) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Hash password
            const passwordHash = await authService.hashPassword(password);

            // Create admin user
            const adminId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const { error } = await supabase
                .from('admin_users')
                .insert({
                    id: adminId,
                    email,
                    password_hash: passwordHash,
                    role
                });

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'ADMIN_CREATED',
                'ADMIN',
                adminId,
                { email, role },
                req.ip
            );

            res.json({ success: true, adminId });
        } catch (error) {
            console.error('Create admin error:', error);
            res.status(500).json({ error: 'Failed to create admin user' });
        }
    });

    /**
     * PATCH /api/admin/admins/:id
     * Update an admin user (SUPER_ADMIN only)
     */
    router.patch('/admins/:id', authenticateAdmin(authService), async (req, res) => {
        try {
            // Only SUPER_ADMIN can update admin users
            if (req.admin.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { id } = req.params;
            const { email, password, role } = req.body;

            const updates = {};

            if (email) updates.email = email;
            if (role) {
                if (!['SUPER_ADMIN', 'MODERATOR', 'SUPPORT'].includes(role)) {
                    return res.status(400).json({ error: 'Invalid role' });
                }
                updates.role = role;
            }
            if (password) {
                if (password.length < 8) {
                    return res.status(400).json({ error: 'Password must be at least 8 characters' });
                }
                updates.password_hash = await authService.hashPassword(password);
            }

            if (Object.keys(updates).length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            updates.updated_at = new Date().toISOString();

            const { error } = await supabase
                .from('admin_users')
                .update(updates)
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'ADMIN_UPDATED',
                'ADMIN',
                id,
                updates,
                req.ip
            );

            res.json({ success: true });
        } catch (error) {
            console.error('Update admin error:', error);
            res.status(500).json({ error: 'Failed to update admin user' });
        }
    });

    /**
     * DELETE /api/admin/admins/:id
     * Delete an admin user (SUPER_ADMIN only)
     */
    router.delete('/admins/:id', authenticateAdmin(authService), async (req, res) => {
        try {
            // Only SUPER_ADMIN can delete admin users
            if (req.admin.role !== 'SUPER_ADMIN') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { id } = req.params;

            // Cannot delete yourself
            if (id === req.admin.id) {
                return res.status(400).json({ error: 'Cannot delete your own account' });
            }

            // Get admin to check role
            const { data: targetAdmin } = await supabase
                .from('admin_users')
                .select('role, email')
                .eq('id', id)
                .single();

            if (!targetAdmin) {
                return res.status(404).json({ error: 'Admin user not found' });
            }

            // Cannot delete SUPER_ADMIN
            if (targetAdmin.role === 'SUPER_ADMIN') {
                return res.status(400).json({ error: 'Cannot delete SUPER_ADMIN accounts' });
            }

            const { error } = await supabase
                .from('admin_users')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'ADMIN_DELETED',
                'ADMIN',
                id,
                { email: targetAdmin.email },
                req.ip
            );

            res.json({ success: true });
        } catch (error) {
            console.error('Delete admin error:', error);
            res.status(500).json({ error: 'Failed to delete admin user' });
        }
    });

    /**
     * GET /api/admin/transactions
     * Get all transactions with filters
     */
    router.get('/transactions', authenticateAdmin(authService), async (req, res) => {
        try {
            const { type, user_id, page = 1, limit = 50, search = '' } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('transactions')
                .select('*', { count: 'exact' });

            // Filter by type
            if (type) {
                query = query.eq('type', type);
            }

            // Filter by user
            if (user_id) {
                query = query.eq('user_id', user_id);
            }

            // Search
            if (search) {
                query = query.or(`user_id.ilike.%${search}%,description.ilike.%${search}%,id.ilike.%${search}%`);
            }

            // Pagination
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + parseInt(limit) - 1);

            const { data: transactions, error, count } = await query;

            if (error) throw error;

            res.json({
                transactions: transactions || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            console.error('Get transactions error:', error);
            res.status(500).json({ error: 'Failed to get transactions' });
        }
    });

    /**
     * POST /api/admin/2fa/generate
     * Generate 2FA secret for current admin
     */
    router.post('/2fa/generate', authenticateAdmin(authService), async (req, res) => {
        try {
            const speakeasy = require('speakeasy');
            const QRCode = require('qrcode');

            // Generate secret
            const secret = speakeasy.generateSecret({
                name: `LootVibe Admin (${req.admin.email})`,
                issuer: 'LootVibe'
            });

            // Generate QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            // Store secret temporarily (not enabled yet)
            const { error } = await supabase
                .from('admin_users')
                .update({ two_fa_secret: secret.base32 })
                .eq('id', req.admin.id);

            if (error) throw error;

            res.json({
                secret: secret.base32,
                qrCode: qrCodeUrl
            });
        } catch (error) {
            console.error('Generate 2FA error:', error);
            res.status(500).json({ error: 'Failed to generate 2FA secret' });
        }
    });

    /**
     * POST /api/admin/2fa/verify
     * Verify 2FA code and enable 2FA
     */
    router.post('/2fa/verify', authenticateAdmin(authService), async (req, res) => {
        try {
            const speakeasy = require('speakeasy');
            const { code } = req.body;

            if (!code || code.length !== 6) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }

            // Get admin's secret
            const { data: admin } = await supabase
                .from('admin_users')
                .select('two_fa_secret')
                .eq('id', req.admin.id)
                .single();

            if (!admin || !admin.two_fa_secret) {
                return res.status(400).json({ error: '2FA not set up. Generate secret first.' });
            }

            // Verify code
            const verified = speakeasy.totp.verify({
                secret: admin.two_fa_secret,
                encoding: 'base32',
                token: code,
                window: 2 // Allow 2 time steps before/after for clock drift
            });

            if (!verified) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }

            // Enable 2FA
            const { error } = await supabase
                .from('admin_users')
                .update({ two_fa_enabled: true })
                .eq('id', req.admin.id);

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                '2FA_ENABLED',
                'ADMIN',
                req.admin.id,
                {},
                req.ip
            );

            res.json({ success: true, message: '2FA enabled successfully' });
        } catch (error) {
            console.error('Verify 2FA error:', error);
            res.status(500).json({ error: 'Failed to verify 2FA code' });
        }
    });

    /**
     * POST /api/admin/2fa/disable
     * Disable 2FA for current admin
     */
    router.post('/2fa/disable', authenticateAdmin(authService), async (req, res) => {
        try {
            const { password } = req.body;

            if (!password) {
                return res.status(400).json({ error: 'Password required to disable 2FA' });
            }

            // Get admin
            const { data: admin } = await supabase
                .from('admin_users')
                .select('password_hash')
                .eq('id', req.admin.id)
                .single();

            if (!admin) {
                return res.status(404).json({ error: 'Admin not found' });
            }

            // Verify password
            const isValid = await authService.verifyPassword(password, admin.password_hash);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid password' });
            }

            // Disable 2FA
            const { error } = await supabase
                .from('admin_users')
                .update({
                    two_fa_enabled: false,
                    two_fa_secret: null
                })
                .eq('id', req.admin.id);

            if (error) throw error;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                '2FA_DISABLED',
                'ADMIN',
                req.admin.id,
                {},
                req.ip
            );

            res.json({ success: true, message: '2FA disabled successfully' });
        } catch (error) {
            console.error('Disable 2FA error:', error);
            res.status(500).json({ error: 'Failed to disable 2FA' });
        }
    });

    /**
     * GET /api/admin/withdrawals
     * Get all withdrawals with filters
     */
    router.get('/withdrawals', authenticateAdmin(authService), requirePermission('view_withdrawals'), async (req, res) => {
        try {
            const { status, currency, user_id, page = 1, limit = 50 } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('withdrawals')
                .select('*, users!withdrawals_user_id_fkey(id, email, username)', { count: 'exact' });

            if (status) {
                query = query.eq('status', status);
            }

            if (currency) {
                query = query.eq('currency', currency);
            }

            if (user_id) {
                query = query.eq('user_id', user_id);
            }

            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + parseInt(limit) - 1);

            const { data: withdrawals, error, count } = await query;

            if (error) throw error;

            res.json({
                withdrawals: withdrawals || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    pages: Math.ceil((count || 0) / limit)
                }
            });
        } catch (error) {
            console.error('Get withdrawals error:', error);
            res.status(500).json({ error: 'Failed to get withdrawals' });
        }
    });

    /**
     * PATCH /api/admin/withdrawals/:id/approve
     * Approve a withdrawal request
     */
    router.patch('/withdrawals/:id/approve', authenticateAdmin(authService), requirePermission('approve_withdrawals'), async (req, res) => {
        try {
            const { id } = req.params;
            const { notes } = req.body;

            // Get withdrawal
            const { data: withdrawal, error: fetchError } = await supabase
                .from('withdrawals')
                .select('*, users!withdrawals_user_id_fkey(id, email, balance)')
                .eq('id', id)
                .single();

            if (fetchError || !withdrawal) {
                return res.status(404).json({ error: 'Withdrawal not found' });
            }

            if (withdrawal.status !== 'PENDING') {
                return res.status(400).json({ error: `Cannot approve withdrawal with status: ${withdrawal.status}` });
            }

            // Update withdrawal status
            const { error: updateError } = await supabase
                .from('withdrawals')
                .update({
                    status: 'APPROVED',
                    processed_at: new Date().toISOString(),
                    processed_by: req.admin.id,
                    notes: notes || null
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'WITHDRAWAL_APPROVED',
                'WITHDRAWAL',
                id,
                { user_id: withdrawal.user_id, amount: withdrawal.amount, currency: withdrawal.currency },
                req.ip
            );

            res.json({ success: true, message: 'Withdrawal approved successfully' });
        } catch (error) {
            console.error('Approve withdrawal error:', error);
            res.status(500).json({ error: 'Failed to approve withdrawal' });
        }
    });

    /**
     * PATCH /api/admin/withdrawals/:id/reject
     * Reject a withdrawal request
     */
    router.patch('/withdrawals/:id/reject', authenticateAdmin(authService), requirePermission('approve_withdrawals'), async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            if (!reason) {
                return res.status(400).json({ error: 'Rejection reason is required' });
            }

            // Get withdrawal
            const { data: withdrawal, error: fetchError } = await supabase
                .from('withdrawals')
                .select('*, users!withdrawals_user_id_fkey(id, email, balance)')
                .eq('id', id)
                .single();

            if (fetchError || !withdrawal) {
                return res.status(404).json({ error: 'Withdrawal not found' });
            }

            if (withdrawal.status !== 'PENDING') {
                return res.status(400).json({ error: `Cannot reject withdrawal with status: ${withdrawal.status}` });
            }

            // Update withdrawal status
            const { error: updateError } = await supabase
                .from('withdrawals')
                .update({
                    status: 'REJECTED',
                    rejection_reason: reason,
                    processed_at: new Date().toISOString(),
                    processed_by: req.admin.id
                })
                .eq('id', id);

            if (updateError) throw updateError;

            // Refund user balance
            const { error: refundError } = await supabase
                .from('users')
                .update({
                    balance: parseFloat(withdrawal.users.balance) + parseFloat(withdrawal.amount)
                })
                .eq('id', withdrawal.user_id);

            if (refundError) throw refundError;

            // Create refund transaction
            await supabase
                .from('transactions')
                .insert({
                    id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    user_id: withdrawal.user_id,
                    type: 'DEPOSIT',
                    amount: withdrawal.amount,
                    description: `Withdrawal rejected - refund: ${reason}`,
                    timestamp: Date.now()
                });

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'WITHDRAWAL_REJECTED',
                'WITHDRAWAL',
                id,
                { user_id: withdrawal.user_id, amount: withdrawal.amount, reason },
                req.ip
            );

            res.json({ success: true, message: 'Withdrawal rejected and balance refunded' });
        } catch (error) {
            console.error('Reject withdrawal error:', error);
            res.status(500).json({ error: 'Failed to reject withdrawal' });
        }
    });

    /**
     * GET /api/admin/settings
     * Get all platform settings
     */
    router.get('/settings', authenticateAdmin(authService), async (req, res) => {
        try {
            const { data: settings, error } = await supabase
                .from('platform_settings')
                .select('*');

            if (error) throw error;

            // Convert to key-value object
            const settingsObj = {};
            settings?.forEach(setting => {
                settingsObj[setting.key] = setting.value;
            });

            res.json({ settings: settingsObj });
        } catch (error) {
            console.error('Get settings error:', error);
            res.status(500).json({ error: 'Failed to get settings' });
        }
    });

    /**
     * PATCH /api/admin/settings
     * Update platform settings (SUPER_ADMIN or MODERATOR only)
     */
    router.patch('/settings', authenticateAdmin(authService), async (req, res) => {
        try {
            // Only SUPER_ADMIN can update settings
            if (req.admin.role !== 'SUPER_ADMIN' && req.admin.role !== 'MODERATOR') {
                return res.status(403).json({ error: 'Insufficient permissions' });
            }

            const { settings } = req.body;

            if (!settings || typeof settings !== 'object') {
                return res.status(400).json({ error: 'Invalid settings format' });
            }

            // Update each setting
            for (const [key, value] of Object.entries(settings)) {
                await supabase
                    .from('platform_settings')
                    .update({
                        value,
                        updated_by: req.admin.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('key', key);
            }

            // Log activity
            await authService.logActivity(
                req.admin.id,
                'SETTINGS_UPDATED',
                'SETTING',
                null,
                { keys: Object.keys(settings) },
                req.ip
            );

            res.json({ success: true, message: 'Settings updated successfully' });
        } catch (error) {
            console.error('Update settings error:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    });

    return router;
}

module.exports = createAdminRoutes;
