const cron = require('node-cron');
const Task = require('../models/Task');
const helpers = require('../utils/helpers');
const weatherService = require('./weatherService');
const db = require('../config/database');

const initCronJob = (bot) => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        try {
            const pastDueTasks = await Task.findPendingPastDue();

            for (const task of pastDueTasks) {
                const message = `Halo! Ini reminder untuk tugasmu: \n🗓️ *${task.task}*\n⏰ ${helpers.formatDate(task.datetime)}\n\nSemangat mengerjakannya! 💪`;

                try {
                    await bot.sendMessage(task.telegram_id, message, { parse_mode: 'Markdown' });
                    await Task.markAsCompleted(task.id);
                    console.log(`[Cron] Sent reminder for task ${task.id} to user ${task.telegram_id}`);

                    if (task.is_recurring && task.recurrence_pattern) {
                        let nextDate = new Date(task.datetime);
                        if (task.recurrence_pattern === 'daily') nextDate.setDate(nextDate.getDate() + 1);
                        else if (task.recurrence_pattern === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
                        else if (task.recurrence_pattern === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
                        else if (task.recurrence_pattern === 'yearly') nextDate.setFullYear(nextDate.getFullYear() + 1);
                        
                        const pad = (n) => (n < 10 ? '0' + n : n);
                        const nextDatetimeStr = `${nextDate.getFullYear()}-${pad(nextDate.getMonth() + 1)}-${pad(nextDate.getDate())} ${pad(nextDate.getHours())}:${pad(nextDate.getMinutes())}:00`;
                        
                        await Task.create(task.user_id, task.task, nextDatetimeStr, true, task.recurrence_pattern);
                        console.log(`[Cron] Rescheduled recurring task ${task.id} to ${nextDatetimeStr}`);
                    }
                } catch (botError) {
                    console.error(`[Cron] Failed to send reminder to ${task.telegram_id}:`, botError.message);
                }
            }
        } catch (error) {
            console.error('[Cron] Error querying tasks:', error.message);
        }
    });

    // Run every day at 06:00
    cron.schedule('0 6 * * *', async () => {
        try {
            const weatherMsg = await weatherService.getDailyForecast();
            const [users] = await db.query('SELECT telegram_id FROM users');
            
            for (const u of users) {
                try {
                    await bot.sendMessage(u.telegram_id, `Selamat pagi! 🌅\nSemoga harimu menyenangkan.\n\n${weatherMsg}`, { parse_mode: 'Markdown' });
                    console.log(`[Cron] Sent morning weather to ${u.telegram_id}`);
                } catch (e) {
                    console.error(`[Cron] Failed sending weather to ${u.telegram_id}:`, e.message);
                }
            }
        } catch (error) {
            console.error('[Cron] Weather Error:', error.message);
        }
    });

    console.log('[Cron] Scheduler initialized: tasks every minute, weather at 06:00.');
};

module.exports = { initCronJob };
