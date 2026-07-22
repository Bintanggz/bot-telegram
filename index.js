require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const { initCronJob, checkTasksAndNotify, sendMorningBriefing } = require('./services/cronService');
const botController = require('./controllers/botController');
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3000;
const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
    console.error("Error: TELEGRAM_BOT_TOKEN is missing in .env");
    process.exit(1);
}

// Support both Webhook (Vercel) and Polling (Local)
const isVercel = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);
const bot = new TelegramBot(token, { polling: !isVercel });

app.use(express.json());
app.use('/', routes);

// Endpoint Webhook khusus Vercel
app.post('/api/webhook', async (req, res) => {
    try {
        await bot.processUpdate(req.body);
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        console.error('[Webhook Error]', error);
    }
    res.status(200).json({ status: 'ok' });
});

// Endpoint Cron khusus Vercel / Cron Pinger
app.get('/api/cron/check-tasks', async (req, res) => {
    const count = await checkTasksAndNotify(bot);
    res.json({ status: 'ok', processed_tasks: count });
});

app.get('/api/cron/morning-briefing', async (req, res) => {
    const count = await sendMorningBriefing(bot);
    res.json({ status: 'ok', notified_users: count });
});

if (!isVercel) {
    console.log('[Bot] Telegram Bot is starting in polling mode...');
    initCronJob(bot);
    app.listen(PORT, () => {
        console.log(`[Express] Server is running on port ${PORT}`);
    });
}

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
if (!isVercel) {
    bot.on("polling_error", (error) => console.log('Polling Error:', error));
}

module.exports = app;
