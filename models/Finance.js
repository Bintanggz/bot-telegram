const db = require('../config/database');

const Finance = {
    async create(userId, amount, description, type) {
        const [result] = await db.query(
            'INSERT INTO finances (user_id, amount, description, type) VALUES (?, ?, ?, ?)',
            [userId, amount, description, type]
        );
        return result.insertId;
    },
    
    async getSummary(userId) {
        const [rows] = await db.query(
            'SELECT type, SUM(amount) as total FROM finances WHERE user_id = ? GROUP BY type',
            [userId]
        );
        let income = 0;
        let expense = 0;
        rows.forEach(r => {
            if (r.type === 'income') income = parseFloat(r.total);
            if (r.type === 'expense') expense = parseFloat(r.total);
        });
        return { income, expense, balance: income - expense };
    }
};

module.exports = Finance;
