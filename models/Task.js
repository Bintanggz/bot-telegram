const db = require('../config/database');

const Task = {
    async create(userId, task, datetime, isRecurring = false, recurrencePattern = null) {
        const [result] = await db.query(
            'INSERT INTO tasks (user_id, task, datetime, is_recurring, recurrence_pattern) VALUES (?, ?, ?, ?, ?)',
            [userId, task, datetime, isRecurring, recurrencePattern]
        );
        return result.insertId;
    },

    async findPendingByUserId(userId) {
        const [rows] = await db.query(
            "SELECT * FROM tasks WHERE user_id = ? AND status = 'pending' ORDER BY datetime ASC",
            [userId]
        );
        return rows;
    },

    async deleteByIdAndUserId(id, userId) {
        const [result] = await db.query(
            'DELETE FROM tasks WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    },

    async findPendingPastDue() {
        const [rows] = await db.query(
            "SELECT tasks.*, users.telegram_id FROM tasks JOIN users ON tasks.user_id = users.id WHERE tasks.status = 'pending' AND tasks.datetime <= NOW()"
        );
        return rows;
    },

    async markAsCompleted(id) {
        const [result] = await db.query(
            "UPDATE tasks SET status = 'completed' WHERE id = ?",
            [id]
        );
        return result.affectedRows > 0;
    }
};

module.exports = Task;
