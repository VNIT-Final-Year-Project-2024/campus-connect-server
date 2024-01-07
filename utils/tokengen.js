const crypto = require('crypto');

// Function to generate a unique token based on the request body
generateToken = (obj) => {
    // Create a hash of the request body using SHA-256
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(obj));
    return hash.digest('hex');
}

module.exports = {
    generateToken
}