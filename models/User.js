const db = require('../config/database');

const User = {
    async findByTelegramId(telegramId) {
        const [rows] = await db.query('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
        return rows[0];
    },

    async create(telegramId) {
        const [result] = await db.query('INSERT INTO users (telegram_id) VALUES (?)', [telegramId]);
        return result.insertId;
    }
};

module.exports = User;
