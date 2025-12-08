const { Clerk } = require('@clerk/clerk-sdk-node');

const clerk = Clerk({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY
});

const authenticateWithClerk = () => async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            console.warn('[Auth] Missing authorization header');
            return res.status(401).json({ error: 'No authorization header' });
        }

        const token = authHeader.replace(/^Bearer\s+/, '');
        if (!token) {
            console.warn('[Auth] Empty token');
            return res.status(401).json({ error: 'Empty token' });
        }

        // Verify the token using Clerk
        // verifyToken returns the payload if valid, throws if invalid
        const payload = await clerk.verifyToken(token);

        // Attach user info to request
        req.user = {
            id: payload.sub,
            ...payload
        };

        next();
    } catch (error) {
        console.error('[Auth] Clerk token validation failed:', error.message);
        // Log detailed error structure if available
        if (error.errors) console.error(JSON.stringify(error.errors, null, 2));

        return res.status(401).json({
            error: 'Invalid token',
            details: error.message
        });
    }
};

module.exports = { authenticateWithClerk };
