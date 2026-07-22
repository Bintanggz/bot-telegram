require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { initCronJob } = require('./services/cronService');
const botController = require('./controllers/botController');
const routes = require('./routes/index');

// Setup Express (Opsional untuk web server / keep alive)
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/', routes);

app.listen(PORT, () => {
    console.log(`[Express] Server is running on port ${PORT}`);
});

// Setup Telegram Bot
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("Error: TELEGRAM_BOT_TOKEN is missing in .env");
    process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('[Bot] Telegram Bot is starting in polling mode...');

// Initialize Cron Job
initCronJob(bot);

// ==================== Command Handlers ====================

// Basic
bot.onText(/\/start/, (msg) => botController.start(bot, msg));
bot.onText(/\/help/, (msg) => botController.help(bot, msg));

// Tasks
bot.onText(/\/add (.+)/, (msg, match) => botController.addTask(bot, msg, match));
bot.onText(/\/list/, (msg) => botController.listTasks(bot, msg));
bot.onText(/\/delete (\d+)/, (msg, match) => botController.deleteTask(bot, msg, match));

// Finance
bot.onText(/\/finance$/, (msg) => botController.financeSummary(bot, msg));
bot.onText(/\/laporan(?:\s+(.+))?$/, (msg, match) => botController.financeReport(bot, msg, match));
bot.onText(/\/history(?:\s+(\d+))?$/, (msg, match) => botController.financeHistory(bot, msg, match));
bot.onText(/\/export$/, (msg) => botController.exportFinanceCSV(bot, msg));
bot.onText(/\/setbudget\s+(.+)/, (msg, match) => botController.setBudget(bot, msg, match));

// Notes
bot.onText(/\/note\s+(.+)/, (msg, match) => botController.addNote(bot, msg, match));
bot.onText(/\/notes$/, (msg) => botController.listNotes(bot, msg));
bot.onText(/\/searchnote\s+(.+)/, (msg, match) => botController.searchNote(bot, msg, match));
bot.onText(/\/delnote\s+(\d+)/, (msg, match) => botController.deleteNote(bot, msg, match));

// Weather
bot.onText(/\/cuaca\s+(.+)/, (msg, match) => botController.weather(bot, msg, match));
bot.onText(/\/setlokasi\s+(.+)/, (msg, match) => botController.setLocation(bot, msg, match));

// Photo Handler (Struk Belanja OCR)
bot.on('photo', (msg) => botController.handlePhoto(bot, msg));

// Inline Keyboard Callback
bot.on('callback_query', (query) => botController.handleCallbackQuery(bot, query));

// General message handler (Natural language)
bot.on('message', (msg) => botController.handleMessage(bot, msg));

// Handle polling errors
bot.on("polling_error", (error) => console.log('Polling Error:', error));
