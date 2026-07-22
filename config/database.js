const mysql = require('mysql2/promise');
require('dotenv').config();

const isAiven = (process.env.DB_HOST || '').includes('aivencloud.com');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'bot_tele_db',
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: (isAiven || process.env.DB_SSL === 'true') ? { rejectUnauthorized: false } : undefined
});

// Otomatis buat tabel jika belum ada saat aplikasi menyala
const initDb = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('[DB] Terkoneksi ke Database MySQL dengan sukses.');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                telegram_id BIGINT UNIQUE NOT NULL,
                default_city VARCHAR(100) DEFAULT 'Jakarta',
                default_lat DECIMAL(10,4) DEFAULT -6.2088,
                default_lon DECIMAL(10,4) DEFAULT 106.8456,
                monthly_budget DECIMAL(15,2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS tasks (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                task VARCHAR(255) NOT NULL,
                datetime DATETIME NOT NULL,
                status ENUM('pending', 'completed') DEFAULT 'pending',
                is_recurring BOOLEAN DEFAULT FALSE,
                recurrence_pattern VARCHAR(50) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS finances (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(15,2) NOT NULL,
                description VARCHAR(255),
                type ENUM('income', 'expense') NOT NULL,
                category VARCHAR(50) DEFAULT 'lainnya',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        await connection.query(`
            CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
        `);

        console.log('[DB] Semua tabel database siap digunakan.');
        connection.release();
    } catch (error) {
        console.error('[DB Error] Gagal inisialisasi tabel database:', error.message);
    }
};

initDb();

module.exports = pool;
