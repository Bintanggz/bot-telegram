# 🤖 Personal Assistant Telegram Bot

Bot Telegram **Personal Assistant** berbasis AI yang dapat membantu mencatat tugas, mengelola keuangan, memberikan reminder otomatis, prakiraan cuaca harian, dan menjawab pertanyaan secara natural layaknya ChatGPT — semuanya melalui chat Telegram.

---

## 📑 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Arsitektur Proyek](#-arsitektur-proyek)
- [Tech Stack](#-tech-stack)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi & Setup](#-instalasi--setup)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Penggunaan Bot](#-penggunaan-bot)
- [Struktur Database](#-struktur-database)
- [Referensi API & Module](#-referensi-api--module)
- [Alur Kerja Sistem](#-alur-kerja-sistem)
- [Troubleshooting](#-troubleshooting)
- [Lisensi](#-lisensi)

---

## ✨ Fitur Utama

| # | Fitur | Deskripsi |
|---|-------|-----------|
| 1 | 📌 **Manajemen Tugas** | Tambah, lihat, dan hapus tugas. Mendukung input bahasa natural (contoh: _"Besok jam 7 pagi ingatkan lari pagi"_). |
| 2 | 🔁 **Tugas Rutin (Recurring)** | Buat jadwal berulang otomatis: harian, mingguan, bulanan, atau tahunan. |
| 3 | ⏰ **Reminder Otomatis** | Bot mengecek tugas setiap menit dan mengirim notifikasi saat waktu tugas tercapai. |
| 4 | 💰 **Pencatatan Keuangan** | Catat pemasukan & pengeluaran secara natural (contoh: _"Beli bakso 10rb"_, _"Gajian masuk 5 juta"_). |
| 5 | 📊 **Ringkasan Keuangan** | Lihat total pemasukan, pengeluaran, dan saldo murni dengan command `/finance`. |
| 6 | 🌤️ **Prakiraan Cuaca Harian** | Laporan cuaca otomatis setiap jam 06:00 pagi untuk semua pengguna (default: Jakarta). |
| 7 | 💬 **AI Chat (Gemini)** | Tanya apapun secara natural — bot menjawab menggunakan Google Gemini 2.5 Flash. |

---

## 🏗️ Arsitektur Proyek

Proyek menggunakan **arsitektur MVC (Model-View-Controller)** dengan pemisahan tanggung jawab yang jelas:

```
bot-tele/
├── config/
│   └── database.js          # Konfigurasi koneksi MySQL (connection pool)
├── controllers/
│   └── botController.js      # Handler untuk semua command & pesan bot
├── models/
│   ├── User.js               # Model data pengguna
│   ├── Task.js               # Model data tugas/reminder
│   └── Finance.js            # Model data keuangan
├── services/
│   ├── geminiService.js      # Integrasi Gemini AI (NLP parser)
│   ├── cronService.js        # Scheduler (reminder & cuaca)
│   └── weatherService.js     # Integrasi API cuaca Open-Meteo
├── routes/
│   └── index.js              # Express route (health check endpoint)
├── utils/
│   └── helpers.js            # Fungsi utilitas (format tanggal, dll.)
├── index.js                  # Entry point utama aplikasi
├── database.sql              # SQL schema untuk inisialisasi database
├── package.json              # Konfigurasi project & dependencies
├── .env.example              # Template variabel environment
└── .env                      # Variabel environment (JANGAN di-commit!)
```

### Diagram Arsitektur

```
┌────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Telegram App │◄────►│   Telegram API   │◄────►│   Bot (index.js)│
│   (User Chat)  │      │   (Polling Mode) │      │                 │
└────────────────┘      └──────────────────┘      └────────┬────────┘
                                                           │
                        ┌──────────────────────────────────┼──────────────────┐
                        │                                  │                  │
                        ▼                                  ▼                  ▼
               ┌─────────────────┐              ┌──────────────┐    ┌──────────────┐
               │  botController  │              │  cronService │    │ Express App  │
               │  (Command Logic)│              │  (Scheduler) │    │ (Health API) │
               └───────┬─────────┘              └──────┬───────┘    └──────────────┘
                       │                               │
          ┌────────────┼───────────┐          ┌────────┼────────┐
          ▼            ▼           ▼          ▼                 ▼
  ┌──────────────┐ ┌────────┐ ┌────────┐ ┌────────────────┐ ┌──────────────┐
  │geminiService │ │ Models │ │helpers │ │ weatherService │ │    Models    │
  │  (Gemini AI) │ │(DB ORM)│ │(Utils) │ │  (Open-Meteo)  │ │   (DB ORM)   │
  └──────┬───────┘ └───┬────┘ └────────┘ └────────────────┘ └──────┬───────┘
         │             │                                           │
         ▼             ▼                                           ▼
  ┌──────────────┐ ┌──────────────────────────────────────────────────────┐
  │  Gemini API  │ │                     MySQL Database                   │
  │  (Google AI) │ │          (users, tasks, finances tables)             │
  └──────────────┘ └──────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| **Node.js** | v18+ | Runtime JavaScript |
| **Express.js** | ^4.19.2 | Web framework (health check endpoint) |
| **node-telegram-bot-api** | ^0.65.1 | Library Telegram Bot API |
| **@google/genai** | ^1.47.0 | Google Gemini AI SDK |
| **mysql2** | ^3.9.7 | MySQL database driver (promise-based) |
| **node-cron** | ^3.0.3 | Task scheduler / cron job |
| **axios** | ^1.6.8 | HTTP client (untuk API cuaca) |
| **dotenv** | ^16.4.5 | Manajemen environment variables |

---

## 📋 Persyaratan Sistem

- **Node.js** v18 atau lebih baru
- **MySQL** v5.7+ / MariaDB v10.3+
- **XAMPP** (opsional — untuk MySQL & phpMyAdmin)
- Koneksi internet aktif (untuk Telegram API, Gemini API, dan Open-Meteo API)

---

## 🚀 Instalasi & Setup

### 1. Clone Repository

```bash
git clone https://github.com/Bintanggz/bot-telegram.git
cd bot-telegram
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Buat Database MySQL

**Opsi A — phpMyAdmin:**
1. Buka phpMyAdmin (`http://localhost/phpmyadmin`)
2. Import file `database.sql`

**Opsi B — MySQL CLI:**
```bash
mysql -u root -p < database.sql
```

### 4. Konfigurasi Environment

```bash
cp .env.example .env
```

Edit file `.env` dan isi semua variabel yang diperlukan (lihat bagian [Konfigurasi Environment](#-konfigurasi-environment)).

### 5. Jalankan Aplikasi

**Production:**
```bash
npm start
```

**Development (hot-reload):**
```bash
npm run dev
```

> ⚠️ Untuk mode dev, pastikan `nodemon` sudah ter-install secara global atau sebagai dev dependency.

---

## 🔐 Konfigurasi Environment

Buat file `.env` di root proyek berdasarkan `.env.example`:

```env
# ─── Telegram Bot Token ───────────────────────
# Dapatkan dari @BotFather di Telegram
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here

# ─── Google Gemini API Key ────────────────────
# Dapatkan dari https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here

# ─── MySQL Database Configuration ────────────
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=bot_tele_db
DB_PORT=3306

# ─── Express Server Port (Opsional) ──────────
PORT=3000
```

### Cara Mendapatkan Token & API Key

| Variabel | Cara Mendapatkan |
|----------|------------------|
| `TELEGRAM_BOT_TOKEN` | Buka Telegram → Cari **@BotFather** → Kirim `/newbot` → Ikuti instruksi → Salin token |
| `GEMINI_API_KEY` | Buka [Google AI Studio](https://aistudio.google.com/app/apikey) → Buat API Key baru |

---

## 💬 Penggunaan Bot

### Command yang Tersedia

| Command | Deskripsi | Contoh |
|---------|-----------|--------|
| `/start` | Memulai bot & menampilkan panduan | `/start` |
| `/add <tugas>` | Menambah tugas/reminder | `/add Besok jam 2 siang belajar matematika` |
| `/list` | Melihat semua tugas yang pending | `/list` |
| `/delete <id>` | Menghapus tugas berdasarkan ID | `/delete 5` |
| `/finance` | Melihat ringkasan keuangan | `/finance` |

### Input Bahasa Natural (Tanpa Command)

Bot mendukung pengenalan bahasa natural secara otomatis. Cukup ketik pesan biasa tanpa command:

#### 📌 Contoh Input Tugas:
```
Besok jam 7 pagi ingatkan lari pagi
Ingatkan minum obat tiap hari jam 10 pagi
Minggu depan meeting dengan klien jam 3 sore
```

#### 💰 Contoh Input Keuangan:
```
Beli bakso 10rb
Gajian masuk 5 juta hari ini
Bayar listrik 200 ribu
```

#### 💬 Contoh Chat AI:
```
Hai, apa kabar?
Tolong kasih resep ayam geprek
Bagaimana cara belajar programming?
```

### Alur Deteksi Intent

Bot menggunakan **Gemini AI** untuk mengklasifikasi setiap pesan ke salah satu dari 3 intent:

```
Pesan Masuk
    │
    ▼
┌──────────────────┐
│   Gemini AI NLP  │
│  (Intent Parser) │
└────────┬─────────┘
         │
    ┌────┼────┬──────────┐
    ▼    ▼    ▼          ▼
  task  finance  chat    unknown
    │    │       │         │
    ▼    ▼       ▼         ▼
  Simpan  Simpan  Balas    Pesan
  ke DB   ke DB   langsung error
```

---

## 🗄️ Struktur Database

Database: **`bot_tele_db`**

### Tabel `users`

Menyimpan data pengguna Telegram yang terdaftar.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `INT` (PK, AI) | ID unik pengguna |
| `telegram_id` | `BIGINT` (UNIQUE) | ID Telegram pengguna |
| `created_at` | `TIMESTAMP` | Waktu registrasi |

### Tabel `tasks`

Menyimpan semua tugas dan reminder pengguna.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `INT` (PK, AI) | ID unik tugas |
| `user_id` | `INT` (FK → users.id) | Pemilik tugas |
| `task` | `VARCHAR(255)` | Deskripsi tugas |
| `datetime` | `DATETIME` | Waktu reminder |
| `status` | `ENUM('pending','completed')` | Status tugas (default: `pending`) |
| `is_recurring` | `BOOLEAN` | Apakah tugas berulang |
| `recurrence_pattern` | `VARCHAR(50)` | Pola berulang (`daily`, `weekly`, `monthly`, `yearly`) |
| `created_at` | `TIMESTAMP` | Waktu pembuatan |

### Tabel `finances`

Menyimpan catatan pemasukan dan pengeluaran.

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `id` | `INT` (PK, AI) | ID unik transaksi |
| `user_id` | `INT` (FK → users.id) | Pemilik catatan |
| `amount` | `DECIMAL(15,2)` | Nominal (Rupiah) |
| `description` | `VARCHAR(255)` | Keterangan transaksi |
| `type` | `ENUM('income','expense')` | Jenis: pemasukan/pengeluaran |
| `created_at` | `TIMESTAMP` | Waktu pencatatan |

### Entity Relationship Diagram

```
┌─────────┐       ┌──────────────┐       ┌──────────────┐
│  users  │       │    tasks     │       │   finances   │
├─────────┤       ├──────────────┤       ├──────────────┤
│ id (PK) │──┐    │ id (PK)      │       │ id (PK)      │
│ telegram │  ├──►│ user_id (FK) │       │ user_id (FK) │◄──┐
│ _id     │  │    │ task         │       │ amount       │   │
│ created │  │    │ datetime     │       │ description  │   │
│ _at     │  │    │ status       │       │ type         │   │
└─────────┘  │    │ is_recurring │       │ created_at   │   │
             │    │ recurrence   │       └──────────────┘   │
             │    │ _pattern     │                          │
             │    │ created_at   │                          │
             │    └──────────────┘                          │
             │                                              │
             └──────────────────────────────────────────────┘
                         1 : N (One user → many records)
```

---

## 📚 Referensi API & Module

### `index.js` — Entry Point

File utama yang menginisialisasi:
- **Express server** pada port yang dikonfigurasi (default: `3000`)
- **Telegram Bot** dalam mode polling
- **Cron jobs** untuk reminder dan cuaca
- **Command handlers** (`/start`, `/add`, `/list`, `/delete`, `/finance`)
- **Message handler** untuk input bahasa natural

---

### `config/database.js` — Database Connection

Menggunakan `mysql2/promise` dengan **connection pooling**.

**Konfigurasi Pool:**
| Parameter | Nilai |
|-----------|-------|
| `waitForConnections` | `true` |
| `connectionLimit` | `10` |
| `queueLimit` | `0` (unlimited) |

---

### `controllers/botController.js` — Bot Controller

Handler utama untuk semua interaksi bot:

| Fungsi | Deskripsi |
|--------|-----------|
| `start(bot, msg)` | Menampilkan pesan selamat datang & panduan penggunaan |
| `addTask(bot, msg, match)` | Memproses penambahan tugas (via `/add` atau bahasa natural) |
| `listTasks(bot, msg)` | Menampilkan daftar tugas pending milik user |
| `deleteTask(bot, msg, match)` | Menghapus tugas berdasarkan ID |
| `financeSummary(bot, msg)` | Menampilkan ringkasan keuangan (pemasukan, pengeluaran, saldo) |
| `handleMessage(bot, msg)` | Memproses pesan teks non-command sebagai input natural |

**Alur `addTask`:**
1. Cek/buat user di database
2. Kirim teks ke Gemini AI → mendapat intent + data terstruktur
3. Berdasarkan intent:
   - `task` → Simpan ke tabel `tasks`
   - `finance` → Simpan ke tabel `finances`
   - `chat` → Kirim respons AI langsung ke user

---

### `models/` — Data Models

#### `User.js`

| Method | Parameter | Return | Deskripsi |
|--------|-----------|--------|-----------|
| `findByTelegramId(telegramId)` | `BIGINT` | `Object \| undefined` | Cari user berdasarkan Telegram ID |
| `create(telegramId)` | `BIGINT` | `insertId` | Buat user baru |

#### `Task.js`

| Method | Parameter | Return | Deskripsi |
|--------|-----------|--------|-----------|
| `create(userId, task, datetime, isRecurring, recurrencePattern)` | — | `insertId` | Buat tugas baru |
| `findPendingByUserId(userId)` | `INT` | `Array` | Ambil tugas pending milik user |
| `deleteByIdAndUserId(id, userId)` | `INT, INT` | `Boolean` | Hapus tugas (return `true` jika berhasil) |
| `findPendingPastDue()` | — | `Array` | Ambil tugas pending yang sudah lewat waktu (untuk cron) |
| `markAsCompleted(id)` | `INT` | `Boolean` | Tandai tugas sebagai selesai |

#### `Finance.js`

| Method | Parameter | Return | Deskripsi |
|--------|-----------|--------|-----------|
| `create(userId, amount, description, type)` | — | `insertId` | Catat transaksi baru |
| `getSummary(userId)` | `INT` | `{ income, expense, balance }` | Hitung ringkasan keuangan user |

---

### `services/` — Business Services

#### `geminiService.js` — AI Parser

Menggunakan **Google Gemini 2.5 Flash** dengan `temperature: 0.1` untuk konsistensi output JSON.

| Method | Parameter | Return |
|--------|-----------|--------|
| `extractTaskAndDate(text)` | `String` | `Object { intent, task_data, finance_data, chat_response }` |

**Response Structure:**
```json
{
  "intent": "task" | "finance" | "chat",
  "task_data": {
    "task": "Deskripsi tugas",
    "datetime": "YYYY-MM-DD HH:mm:ss",
    "is_recurring": false,
    "recurrence_pattern": null
  },
  "finance_data": {
    "amount": 10000,
    "description": "Beli bakso",
    "type": "income" | "expense"
  },
  "chat_response": "Balasan AI"
}
```

#### `cronService.js` — Scheduler

| Cron Job | Jadwal | Deskripsi |
|----------|--------|-----------|
| Task Reminder | Setiap menit (`* * * * *`) | Cek tugas yang sudah lewat waktu → kirim reminder → tandai selesai. Jika recurring, buat tugas baru untuk jadwal berikutnya. |
| Morning Weather | Setiap hari jam 06:00 (`0 6 * * *`) | Kirim prakiraan cuaca ke semua pengguna terdaftar. |

**Pola Recurring yang Didukung:**
- `daily` — Setiap hari pada jam yang sama
- `weekly` — Setiap 7 hari
- `monthly` — Setiap bulan pada tanggal yang sama
- `yearly` — Setiap tahun

#### `weatherService.js` — Cuaca

Menggunakan API gratis [Open-Meteo](https://open-meteo.com/) (tanpa API key).

| Method | Parameter | Return |
|--------|-----------|--------|
| `getDailyForecast(lat, lon)` | Koordinat (default: Jakarta) | `String` (pesan cuaca terformat) |

**Mapping Kode Cuaca:**
| Kode | Kondisi |
|------|---------|
| 0 | Cerah ☀️ |
| 1–3 | Berawan ⛅ |
| 45–48 | Berkabut 🌫️ |
| 51–67 | Hujan Ringan 🌧️ |
| 71–77 | Hujan Salju ❄️ |
| 80–82 | Hujan Lebat ☔ |
| 95+ | Badai Petir ⛈️ |

---

### `routes/index.js` — Express Routes

| Method | Endpoint | Response |
|--------|----------|----------|
| `GET` | `/` | `{ status: "success", message: "Telegram Bot Assistant Server is Running" }` |

> Endpoint ini berguna untuk health check atau keep-alive monitoring.

---

### `utils/helpers.js` — Utility Functions

| Fungsi | Parameter | Return | Deskripsi |
|--------|-----------|--------|-----------|
| `formatDate(dateString)` | `String` | `String` | Format tanggal ke bahasa Indonesia (contoh: _"Senin, 1 April 2026 pukul 07.00 WIB"_) |
| `getDefaultDatetime()` | — | `String` | Generate datetime 1 jam dari sekarang dalam format `YYYY-MM-DD HH:mm:ss` |

---

## 🔄 Alur Kerja Sistem

### 1. User Mengirim Pesan

```
User ketik pesan di Telegram
         │
         ▼
Bot menerima via Polling
         │
         ├── Jika dimulai "/" → Jalankan command handler
         │       ├── /start    → Tampilkan panduan
         │       ├── /add      → Parse & simpan tugas
         │       ├── /list     → Tampilkan daftar tugas
         │       ├── /delete   → Hapus tugas
         │       └── /finance  → Tampilkan ringkasan keuangan
         │
         └── Jika teks biasa → handleMessage()
                 │
                 ▼
         Kirim ke Gemini AI
                 │
                 ▼
         Parse intent & data
                 │
                 ├── intent: task    → Simpan ke DB, konfirmasi ke user
                 ├── intent: finance → Simpan ke DB, konfirmasi ke user
                 └── intent: chat    → Kirim jawaban AI ke user
```

### 2. Cron Job Reminder (Tiap Menit)

```
Cek tabel tasks → WHERE status='pending' AND datetime <= NOW()
         │
         ├── Kirim reminder ke user via Telegram
         ├── Tandai tugas sebagai 'completed'
         └── Jika is_recurring=true → Buat tugas baru (tanggal berikutnya)
```

### 3. Cron Job Cuaca (Jam 06:00)

```
Ambil data cuaca dari Open-Meteo API
         │
         ▼
Kirim ke semua user terdaftar di tabel users
```

---

## ❓ Troubleshooting

### Bot Tidak Merespon

| Masalah | Solusi |
|---------|--------|
| Token salah | Pastikan `TELEGRAM_BOT_TOKEN` di `.env` benar. Dapatkan token baru dari [@BotFather](https://t.me/BotFather). |
| Polling error | Pastikan tidak ada instance bot lain yang berjalan dengan token yang sama. |
| Tidak ada koneksi internet | Bot membutuhkan koneksi internet untuk berkomunikasi dengan Telegram API. |

### Database Error

| Masalah | Solusi |
|---------|--------|
| `ECONNREFUSED` | Pastikan MySQL/MariaDB sudah berjalan (cek XAMPP Control Panel). |
| `ER_BAD_DB_ERROR` | Database belum dibuat. Jalankan `database.sql` terlebih dahulu. |
| `ER_ACCESS_DENIED` | Periksa `DB_USER` dan `DB_PASSWORD` di `.env`. |

### Gemini AI Tidak Bekerja

| Masalah | Solusi |
|---------|--------|
| `API key not valid` | Periksa `GEMINI_API_KEY` di `.env`. Pastikan key aktif di [Google AI Studio](https://aistudio.google.com/). |
| Respons aneh / tidak akurat | Model AI bersifat generatif — coba ulangi pesan dengan format lebih jelas. |
| Timeout / rate limit | API Gemini memiliki batas penggunaan gratis. Tunggu beberapa saat lalu coba lagi. |

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi **ISC**.
