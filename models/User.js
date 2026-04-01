const db = require('../config/database');

const User = {
    async findByTelegramId(telegramId) {
        const [rows] = await db.query('SELECT * FROM users WHERE telegram_id = ?', [telegramId]);
        return rows[0];
    },

    async create(telegramId) {
        const [result] = await db.query('INSERT INTO users (telegram_id) VALUES (?)', [telegramId]);
        return result.insertId;
    },

    async updateLocation(telegramId, city, lat, lon) {
        const [result] = await db.query(
            'UPDATE users SET default_city = ?, default_lat = ?, default_lon = ? WHERE telegram_id = ?',
            [city, lat, lon, telegramId]
        );
        return result.affectedRows > 0;
    },

    async updateBudget(telegramId, amount) {
        const [result] = await db.query(
            'UPDATE users SET monthly_budget = ? WHERE telegram_id = ?',
            [amount, telegramId]
        );
        return result.affectedRows > 0;
    }
};

module.exports = User;
