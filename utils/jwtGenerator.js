const jwt = require('jsonwebtoken');

require('dotenv').config();

let expiryTime = '1h'
// Generate a token with a secret key
let generateJwt = (user, res) => {
    jwt.sign({ user }, process.env.JWT_SECRET_KEY, { expiresIn: expiryTime }, (err, token) => {
        if (err) {
            res.status(500).json({ error: 'error generating auth token' });
            return;
        } else {
            // Send the token in the response
            user.token = token;
            console.log(`User: ${user.name} logged in`);
            res.send(user);
        }
    });
}

module.exports = {
    generateJwt
}