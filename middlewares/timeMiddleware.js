// timestamp middleware for use in protected routes
module.exports = (req, res, next) => {
    // Get the token from the request header
    const time = req.header('Timestamp');

    // Check if token is present
    if (!time) {
        return res.status(400).json({ message: 'include timestamp to your request' });
    }

    req.timestamp = time;
    next();
}