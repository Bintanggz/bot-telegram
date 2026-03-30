CREATE DATABASE IF NOT EXISTS bot_tele_db;
USE bot_tele_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS finances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description VARCHAR(255),
    type ENUM('income', 'expense') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
