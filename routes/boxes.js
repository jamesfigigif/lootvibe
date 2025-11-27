const express = require('express');

function createBoxRoutes(supabase, adminAuthService, authenticateAdmin, requirePermission) {
    const router = express.Router();

    /**
     * GET /api/admin/boxes
     * Get all boxes with pagination, search, and filtering
     */
    router.get('/', authenticateAdmin(adminAuthService), requirePermission('view_boxes'), async (req, res) => {
        try {
            const { page = 1, limit = 50, search = '', category = '', enabled } = req.query;
            const offset = (page - 1) * limit;

            let query = supabase
                .from('boxes')
                .select('*', { count: 'exact' });

            // Search by name or ID
            if (search) {
                query = query.or(`name.ilike.%${search}%,id.ilike.%${search}%`);
            }

            // Filter by category
            if (category && category !== 'ALL') {
                query = query.eq('category', category);
            }

            // Filter by enabled status
            if (enabled !== undefined) {
                query = query.eq('enabled', enabled === 'true');
            }

            // Sort and paginate
            query = query
                .order('created_at', { ascending: false })
                .range(offset, offset + parseInt(limit) - 1);

            const { data: boxes, error, count } = await query;

            if (error) throw error;

            res.json({
                boxes,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count,
                    pages: Math.ceil(count / limit)
                }
            });
        } catch (error) {
            console.error('Get boxes error:', error);
            res.status(500).json({ error: 'Failed to get boxes' });
        }
    });

    /**
     * GET /api/admin/boxes/:id
     * Get a single box by ID
     */
    router.get('/:id', authenticateAdmin(adminAuthService), requirePermission('view_boxes'), async (req, res) => {
        try {
            const { id } = req.params;

            const { data: box, error } = await supabase
                .from('boxes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!box) {
                return res.status(404).json({ error: 'Box not found' });
            }

            res.json(box);
        } catch (error) {
            console.error('Get box error:', error);
            res.status(500).json({ error: 'Failed to get box' });
        }
    });

    /**
     * POST /api/admin/boxes
     * Create a new box
     */
    router.post('/', authenticateAdmin(adminAuthService), requirePermission('edit_boxes'), async (req, res) => {
        try {
            const { name, description, price, sale_price, image, color, category, tags, items } = req.body;

            // Validate required fields
            if (!name || !price || !image || !color || !category || !items) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // Validate items array
            if (!Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'Items must be a non-empty array' });
            }

            // Validate odds sum to ~100%
            const totalOdds = items.reduce((sum, item) => sum + (item.odds || 0), 0);
            if (Math.abs(totalOdds - 100) > 0.1) {
                return res.status(400).json({ error: `Item odds must sum to 100% (current: ${totalOdds}%)` });
            }

            // Generate box ID
            const boxId = `box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const newBox = {
                id: boxId,
                name,
                description: description || '',
                price: parseFloat(price),
                sale_price: sale_price ? parseFloat(sale_price) : null,
                image,
                color,
                category,
                tags: tags || [],
                items,
                enabled: true,
                created_by: req.admin.id,
                updated_by: req.admin.id
            };

            const { data: box, error } = await supabase
                .from('boxes')
                .insert(newBox)
                .select()
                .single();

            if (error) throw error;

            // Log activity
            await adminAuthService.logActivity(
                req.admin.id,
                'BOX_CREATED',
                'BOX',
                boxId,
                { name, price, category },
                req.ip
            );

            res.json(box);
        } catch (error) {
            console.error('Create box error:', error);
            res.status(500).json({ error: 'Failed to create box' });
        }
    });

    /**
     * PATCH /api/admin/boxes/:id
     * Update a box
     */
    router.patch('/:id', authenticateAdmin(adminAuthService), requirePermission('edit_boxes'), async (req, res) => {
        try {
            const { id } = req.params;
            const updates = { ...req.body };

            // Remove fields that shouldn't be updated directly
            delete updates.id;
            delete updates.created_at;
            delete updates.created_by;

            // Validate items if provided
            if (updates.items) {
                if (!Array.isArray(updates.items) || updates.items.length === 0) {
                    return res.status(400).json({ error: 'Items must be a non-empty array' });
                }

                const totalOdds = updates.items.reduce((sum, item) => sum + (item.odds || 0), 0);
                if (Math.abs(totalOdds - 100) > 0.1) {
                    return res.status(400).json({ error: `Item odds must sum to 100% (current: ${totalOdds}%)` });
                }
            }

            // Set updated_by
            updates.updated_by = req.admin.id;

            const { data: box, error } = await supabase
                .from('boxes')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            if (!box) {
                return res.status(404).json({ error: 'Box not found' });
            }

            // Log activity
            await adminAuthService.logActivity(
                req.admin.id,
                'BOX_UPDATED',
                'BOX',
                id,
                updates,
                req.ip
            );

            res.json(box);
        } catch (error) {
            console.error('Update box error:', error);
            res.status(500).json({ error: 'Failed to update box' });
        }
    });

    /**
     * DELETE /api/admin/boxes/:id
     * Delete a box
     */
    router.delete('/:id', authenticateAdmin(adminAuthService), requirePermission('edit_boxes'), async (req, res) => {
        try {
            const { id } = req.params;

            // Get box name before deletion for logging
            const { data: box } = await supabase
                .from('boxes')
                .select('name')
                .eq('id', id)
                .single();

            const { error } = await supabase
                .from('boxes')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await adminAuthService.logActivity(
                req.admin.id,
                'BOX_DELETED',
                'BOX',
                id,
                { name: box?.name },
                req.ip
            );

            res.json({ success: true });
        } catch (error) {
            console.error('Delete box error:', error);
            res.status(500).json({ error: 'Failed to delete box' });
        }
    });

    /**
     * GET /api/admin/boxes/:id/stats
     * Get statistics for a specific box
     */
    router.get('/:id/stats', authenticateAdmin(adminAuthService), requirePermission('view_boxes'), async (req, res) => {
        try {
            const { id } = req.params;

            // Get total openings
            const { count: totalOpenings } = await supabase
                .from('box_openings')
                .select('*', { count: 'exact', head: true })
                .eq('box_id', id);

            // Get revenue (total box price from all openings)
            const { data: openings } = await supabase
                .from('box_openings')
                .select('box_price, item_value, profit_loss, created_at')
                .eq('box_id', id);

            const totalRevenue = openings?.reduce((sum, o) => sum + parseFloat(o.box_price), 0) || 0;
            const totalPayout = openings?.reduce((sum, o) => sum + parseFloat(o.item_value), 0) || 0;
            const netProfit = totalRevenue - totalPayout;
            const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100) : 0;

            // Get outcome distribution
            const { data: outcomes } = await supabase
                .from('box_openings')
                .select('outcome')
                .eq('box_id', id);

            const outcomeDistribution = {
                KEPT: outcomes?.filter(o => o.outcome === 'KEPT').length || 0,
                SOLD: outcomes?.filter(o => o.outcome === 'SOLD').length || 0,
                SHIPPED: outcomes?.filter(o => o.outcome === 'SHIPPED').length || 0
            };

            // Get openings over time (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: recentOpenings } = await supabase
                .from('box_openings')
                .select('created_at')
                .eq('box_id', id)
                .gte('created_at', thirtyDaysAgo.toISOString());

            res.json({
                totalOpenings: totalOpenings || 0,
                totalRevenue,
                totalPayout,
                netProfit,
                profitMargin: profitMargin.toFixed(2),
                outcomeDistribution,
                recentOpenings: recentOpenings?.length || 0,
                lastOpened: openings?.[0]?.created_at || null
            });
        } catch (error) {
            console.error('Get box stats error:', error);
            res.status(500).json({ error: 'Failed to get box statistics' });
        }
    });

    /**
     * POST /api/admin/boxes/:id/toggle
     * Toggle box enabled status
     */
    router.post('/:id/toggle', authenticateAdmin(adminAuthService), requirePermission('edit_boxes'), async (req, res) => {
        try {
            const { id } = req.params;

            // Get current status
            const { data: box } = await supabase
                .from('boxes')
                .select('enabled')
                .eq('id', id)
                .single();

            if (!box) {
                return res.status(404).json({ error: 'Box not found' });
            }

            const newStatus = !box.enabled;

            // Update status
            const { error } = await supabase
                .from('boxes')
                .update({
                    enabled: newStatus,
                    updated_by: req.admin.id
                })
                .eq('id', id);

            if (error) throw error;

            // Log activity
            await adminAuthService.logActivity(
                req.admin.id,
                newStatus ? 'BOX_ENABLED' : 'BOX_DISABLED',
                'BOX',
                id,
                { enabled: newStatus },
                req.ip
            );

            res.json({ success: true, enabled: newStatus });
        } catch (error) {
            console.error('Toggle box error:', error);
            res.status(500).json({ error: 'Failed to toggle box status' });
        }
    });

    return router;
}

module.exports = createBoxRoutes;
