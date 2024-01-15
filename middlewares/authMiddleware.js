const jwt = require('jsonwebtoken');

require('dotenv').config();

// JWT auth middleware for use in protected routes
module.exports = (req, res, next) => {
    // Get the token from the request header
    const token = req.header('Authorization');

    // Check if token is present
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Attach the decoded user to the request object
        req.user = decoded.user;
        next();
    });
}