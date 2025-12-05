const express = require('express');

module.exports = function createStreamerRoutes(supabase) {
    const router = express.Router();

    // Get all streamers
    router.get('/', async (req, res) => {
        try {
            const { data: streamers, error } = await supabase
                .from('users')
                .select('id, username, email, balance, is_streamer, can_withdraw, streamer_odds_multiplier, streamer_note, avatar')
                .eq('is_streamer', true)
                .order('username');

            if (error) throw error;

            res.json({ streamers });
        } catch (error) {
            console.error('Error fetching streamers:', error);
            res.status(500).json({ error: 'Failed to fetch streamers' });
        }
    });

    // Add streamer
    router.post('/add', async (req, res) => {
        try {
            const { userId, oddsMultiplier, allowWithdrawals, note, adminUserId } = req.body;

            // Call the database function
            const { data, error } = await supabase
                .rpc('set_user_as_streamer', {
                    target_user_id: userId,
                    admin_user_id: adminUserId,
                    odds_multiplier: oddsMultiplier,
                    allow_withdrawals: allowWithdrawals,
                    admin_note: note
                });

            if (error) throw error;

            res.json({ success: true, message: 'User made streamer' });
        } catch (error) {
            console.error('Error adding streamer:', error);
            res.status(500).json({ error: error.message || 'Failed to add streamer' });
        }
    });

    // Remove streamer
    router.post('/remove', async (req, res) => {
        try {
            const { userId, adminUserId } = req.body;

            const { data, error } = await supabase
                .rpc('remove_streamer_status', {
                    target_user_id: userId,
                    admin_user_id: adminUserId
                });

            if (error) throw error;

            res.json({ success: true, message: 'Streamer status removed' });
        } catch (error) {
            console.error('Error removing streamer:', error);
            res.status(500).json({ error: error.message || 'Failed to remove streamer' });
        }
    });

    // Update balance
    router.post('/balance', async (req, res) => {
        try {
            const { userId, newBalance, adminUserId } = req.body;

            const { data, error } = await supabase
                .rpc('edit_streamer_balance', {
                    target_user_id: userId,
                    admin_user_id: adminUserId,
                    new_balance: newBalance
                });

            if (error) throw error;

            res.json({ success: true, message: 'Balance updated' });
        } catch (error) {
            console.error('Error updating balance:', error);
            res.status(500).json({ error: error.message || 'Failed to update balance' });
        }
    });

    // Toggle withdrawal permission
    router.post('/withdrawal', async (req, res) => {
        try {
            const { userId, allowWithdraw, adminUserId } = req.body;

            const { data, error } = await supabase
                .rpc('toggle_user_withdrawal', {
                    target_user_id: userId,
                    admin_user_id: adminUserId,
                    allow_withdraw: allowWithdraw
                });

            if (error) throw error;

            res.json({ success: true, message: 'Withdrawal permission updated' });
        } catch (error) {
            console.error('Error toggling withdrawal:', error);
            res.status(500).json({ error: error.message || 'Failed to toggle withdrawal' });
        }
    });

    return router;
};
