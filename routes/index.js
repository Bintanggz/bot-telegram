const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Telegram Bot Assistant Server is Running'
    });
});

router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
