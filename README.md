# Personal Assistant Telegram Bot

Bot Telegram ini berfungsi sebagai asisten pribadi untuk mencatat tugas dan memberikan reminder otomatis berbasis AI (OpenAI).

## Fitur
1. Tambah tugas dengan bahasa natural (Contoh: "Besok jam 7 pagi ingatkan saya meeting").
2. Reminder otomatis menggunakan Node Cron.
3. Manajemen tugas (List, Delete, Add).
4. Persistensi ke database MySQL.

## Persyaratan Sistem
- Node.js (v18+)
- MySQL Base

## Cara Instalasi
1. Clone atau copy repositori ini.
2. Jalankan perintah instalasi dependency:
   ```bash
   npm install
   ```
3. Buat database MySQL:
   Bisa dengan mengimport file `database.sql` ke phpMyAdmin atau MySQL cli.

4. Buat file `.env`:
   Copy `.env.example` ke `.env` dan isi dengan konfigurasi yang sesuai (Telegram Token, OpenAI API Key, database).
   ```bash
   cp .env.example .env
   ```

5. Jalankan aplikasi:
   ```bash
   npm start
   ```
   Atau menggunakan nodemon untuk development:
   ```bash
   npm run dev
   ```

## Penggunaan Telegram Bot
- Mulai chat dengan mengirimkan command `/start`.
- Untuk menambahkan task, Anda bisa langsung ketik: `/add Besok jam 2 siang belajar matematika` (bisa juga input bahasa natural langsung jika fitur auto-detect diaktifkan).
- Untuk melihat daftar tugas, gunakan `/list`.
- Untuk menghapus tugas, gunakan `/delete <id_tugas>`.
