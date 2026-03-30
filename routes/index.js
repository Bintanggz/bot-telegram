const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.json({
        status: 'success',
        message: 'Telegram Bot Assistant Server is Running'
    });
});

module.exports = router;
