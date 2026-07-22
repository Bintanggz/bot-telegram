const db = require('../config/database');

const Note = {
    async create(userId, content) {
        const [result] = await db.query(
            'INSERT INTO notes (user_id, content) VALUES (?, ?)',
            [userId, content]
        );
        return result.insertId;
    },

    async findByUserId(userId, limit = 10) {
        const [rows] = await db.query(
            'SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
            [userId, limit]
        );
        return rows;
    },

    async deleteByIdAndUserId(id, userId) {
        const [result] = await db.query(
            'DELETE FROM notes WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    },

    async searchByKeyword(userId, keyword) {
        const searchPattern = `%${keyword}%`;
        const [rows] = await db.query(
            'SELECT * FROM notes WHERE user_id = ? AND content LIKE ? ORDER BY created_at DESC',
            [userId, searchPattern]
        );
        return rows;
    }
};

module.exports = Note;
