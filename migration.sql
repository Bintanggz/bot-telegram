-- =============================================
-- Migration: Fase 1 & 2 Features
-- Jalankan SQL ini di database bot_tele_db
-- =============================================

USE bot_tele_db;

-- 1. Tambah kolom category di tabel finances
ALTER TABLE finances ADD COLUMN category VARCHAR(50) DEFAULT 'lainnya' AFTER type;

-- 2. Tambah kolom lokasi dan budget di tabel users
ALTER TABLE users ADD COLUMN default_city VARCHAR(100) DEFAULT 'Jakarta' AFTER telegram_id;
ALTER TABLE users ADD COLUMN default_lat DECIMAL(10,4) DEFAULT -6.2088 AFTER default_city;
ALTER TABLE users ADD COLUMN default_lon DECIMAL(10,4) DEFAULT 106.8456 AFTER default_lat;
ALTER TABLE users ADD COLUMN monthly_budget DECIMAL(15,2) DEFAULT 0 AFTER default_lon;

-- 3. Buat tabel notes
CREATE TABLE IF NOT EXISTS notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
