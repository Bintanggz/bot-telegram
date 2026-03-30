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

// Command Handlers
bot.onText(/\/start/, (msg) => botController.start(bot, msg));
bot.onText(/\/add (.+)/, (msg, match) => botController.addTask(bot, msg, match));
bot.onText(/\/list/, (msg) => botController.listTasks(bot, msg));
bot.onText(/\/finance/, (msg) => botController.financeSummary(bot, msg));
bot.onText(/\/delete (\d+)/, (msg, match) => botController.deleteTask(bot, msg, match));

// Handling general message text as natural language task adding
bot.on('message', (msg) => botController.handleMessage(bot, msg));

// Handle polling errors
bot.on("polling_error", (error) => console.log('Polling Error:', error));
