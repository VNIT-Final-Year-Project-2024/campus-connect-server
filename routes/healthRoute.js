const express = require('express');
const router = express.Router();

// get health status
router.get('/', (req, res) =>
    res.status(200).json({ status: 'all good here 👍' })
);

module.exports = router;