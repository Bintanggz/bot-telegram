const db = require('../config/database');

const Finance = {
    async create(userId, amount, description, type, category = 'lainnya') {
        const [result] = await db.query(
            'INSERT INTO finances (user_id, amount, description, type, category) VALUES (?, ?, ?, ?, ?)',
            [userId, amount, description, type, category]
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
    },

    async getHistory(userId, limit = 10) {
        const [rows] = await db.query(
            'SELECT * FROM finances WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return rows;
    },

    async getMonthlySummary(userId, year, month) {
        const [rows] = await db.query(
            `SELECT type, SUM(amount) as total FROM finances 
             WHERE user_id = ? AND YEAR(created_at) = ? AND MONTH(created_at) = ? 
             GROUP BY type`,
            [userId, year, month]
        );
        let income = 0;
        let expense = 0;
        rows.forEach(r => {
            if (r.type === 'income') income = parseFloat(r.total);
            if (r.type === 'expense') expense = parseFloat(r.total);
        });
        return { income, expense, balance: income - expense };
    },

    async getCategorySummary(userId, year, month) {
        const [rows] = await db.query(
            `SELECT category, SUM(amount) as total FROM finances 
             WHERE user_id = ? AND type = 'expense' AND YEAR(created_at) = ? AND MONTH(created_at) = ? 
             GROUP BY category ORDER BY total DESC`,
            [userId, year, month]
        );
        return rows;
    },

    async getMonthlyExpense(userId, year, month) {
        const [rows] = await db.query(
            `SELECT SUM(amount) as total FROM finances 
             WHERE user_id = ? AND type = 'expense' AND YEAR(created_at) = ? AND MONTH(created_at) = ?`,
            [userId, year, month]
        );
        return rows[0]?.total ? parseFloat(rows[0].total) : 0;
    },

    async getAllByUserId(userId) {
        const [rows] = await db.query(
            'SELECT * FROM finances WHERE user_id = ? ORDER BY created_at DESC',
            [userId]
        );
        return rows;
    }
};

module.exports = Finance;
