const geminiService = require('../services/geminiService');
const weatherService = require('../services/weatherService');
const Task = require('../models/Task');
const User = require('../models/User');
const Finance = require('../models/Finance');
const Note = require('../models/Note');
const helpers = require('../utils/helpers');

// ==================== /start ====================
const start = async (bot, msg) => {
    const chatId = msg.chat.id;
    let user = await User.findByTelegramId(chatId);
    
    if (!user) {
        await User.create(chatId);
    }
    
    const welcomeMessage = `Halo! 👋 Aku adalah Bot Super Assistant Pribadimu.

Aku dilengkapi dengan kecerdasan buatan (AI) dan punya banyak fitur untuk membantumu:

📌 *1. Pengingat & Tugas Rutin*
Ketik jadwalmu dengan santai. Contoh:
- _"Besok jam 7 pagi ingatkan lari pagi"_
- _"Ingatkan minum tiap hari jam 10 pagi"_

💰 *2. Catat Pemasukan / Pengeluaran*
- _"Gajian masuk 5 juta hari ini"_
- _"Beli bensin 25 ribu"_

📝 *3. Catatan Cepat*
- \`/note WiFi password: Abcd1234\`
- \`/notes\` untuk lihat semua catatan

🌤️ *4. Cuaca Harian & Custom*
- Laporan otomatis setiap jam 06:00
- \`/cuaca Bandung\` untuk cek kota lain
- \`/setlokasi Surabaya\` ganti default

📊 *5. Laporan Keuangan*
- \`/finance\` ringkasan keseluruhan
- \`/laporan\` laporan bulan ini + kategori
- \`/history\` riwayat transaksi terakhir
- \`/setbudget 3000000\` atur batas pengeluaran

💬 *6. AI Konsultan Pribadi*
Chat nyasar layaknya ChatGPT biasa!

📋 *Semua Command:*
/start — Mulai
/list — Daftar tugas
/delete <id> — Hapus tugas
/finance — Ringkasan keuangan
/laporan — Laporan bulanan
/history — Riwayat transaksi
/setbudget — Set budget bulanan
/note — Simpan catatan
/notes — Lihat catatan
/delnote — Hapus catatan
/cuaca — Cek cuaca kota
/setlokasi — Set lokasi default
/help — Bantuan

Ketik fitur pilihanmu sekarang 😊`;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
};

// ==================== /help ====================
const help = async (bot, msg) => {
    const chatId = msg.chat.id;
    const helpText = `📖 *Panduan Lengkap Bot*

*Tugas & Pengingat:*
• Ketik langsung: _"Besok jam 8 meeting"_
• \`/list\` — Lihat daftar tugas
• \`/delete <id>\` — Hapus tugas (tekan tombol juga bisa!)

*Keuangan:*
• Ketik langsung: _"Beli makan 35rb"_ atau _"Gajian 5jt"_
• \`/finance\` — Ringkasan total
• \`/laporan\` — Laporan bulan ini + kategori
• \`/laporan 3 2026\` — Laporan Maret 2026
• \`/history\` — 10 transaksi terakhir
• \`/history 20\` — 20 transaksi terakhir
• \`/setbudget 3000000\` — Set batas pengeluaran

*Catatan:*
• \`/note WiFi: Abcd1234\` — Simpan catatan
• \`/notes\` — Lihat semua catatan
• \`/delnote <id>\` — Hapus catatan

*Cuaca:*
• \`/cuaca Bandung\` — Cek cuaca kota
• \`/setlokasi Surabaya\` — Ganti lokasi default

*Chat AI:*
• Ketik pertanyaan apapun dan aku akan jawab! 🤖`;

    bot.sendMessage(chatId, helpText, { parse_mode: "Markdown" });
};

// ==================== TASK HANDLERS ====================
const addTask = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    const text = match ? match[1] : msg.text;

    if (!text) {
        return bot.sendMessage(chatId, "Penggunaan: `/add <tugas dan kapan>`\nContoh: `/add Nanti malam jam 8 belajar matematika`", { parse_mode: "Markdown" });
    }

    bot.sendMessage(chatId, "⏳ Sedang memproses...");

    try {
        let user = await User.findByTelegramId(chatId);
        if (!user) {
            const userId = await User.create(chatId);
            user = { id: userId, telegram_id: chatId };
        }

        const extracted = await geminiService.extractTaskAndDate(text);

        if (!extracted || !extracted.intent) {
            return bot.sendMessage(chatId, "Maaf, aku tidak mengerti maksud pesanmu 🤔");
        }

        if (extracted.intent === 'chat') {
            return bot.sendMessage(chatId, extracted.chat_response);
        }

        if (extracted.intent === 'note') {
            return handleNoteIntent(bot, msg, user, extracted);
        }

        if (extracted.intent === 'finance') {
            return handleFinanceIntent(bot, msg, user, extracted);
        }

        if (extracted.intent === 'task') {
            const tData = extracted.task_data;
            if (tData && tData.task) {
                const taskDesc = tData.task;
                const datetime = tData.datetime || helpers.getDefaultDatetime();
                const isRecurring = tData.is_recurring || false;
                const recurrencePattern = tData.recurrence_pattern || null;

                await Task.create(user.id, taskDesc, datetime, isRecurring, recurrencePattern);

                const formattedDate = helpers.formatDate(datetime);
                let msgReply = `✅ Siap! Aku ingatkan kamu:\n\n📝 Tugas: ${taskDesc}\n⏰ Waktu: ${formattedDate}`;
                if (isRecurring && recurrencePattern) {
                    msgReply += `\n🔁 *Tugas Rutin* (${recurrencePattern})`;
                }
                msgReply += `\n\nSemangat! 😊`;

                return bot.sendMessage(chatId, msgReply, { parse_mode: 'Markdown' });
            }
        }

        return bot.sendMessage(chatId, "Maaf, aku kurang paham detail perintahmu. Bisa diulangi?");
    } catch (error) {
        console.error("Add task error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat memproses pesanmu. Coba lagi nanti ya.");
    }
};

// Handle finance intent (extracted by Gemini)
const handleFinanceIntent = async (bot, msg, user, extracted) => {
    const chatId = msg.chat.id;
    const fData = extracted.finance_data;
    if (fData && fData.amount) {
        const category = fData.category || 'lainnya';
        await Finance.create(user.id, fData.amount, fData.description, fData.type, category);
        
        const typeStr = fData.type === 'income' ? 'Pemasukan 💰' : 'Pengeluaran 💸';
        const categoryEmoji = helpers.getCategoryEmoji(category);
        let reply = `✅ *${typeStr} Dicatat!*\nNominal: ${helpers.formatCurrency(fData.amount)}\nKeterangan: ${fData.description}\nKategori: ${categoryEmoji} ${category}`;

        // Budget check for expenses
        if (fData.type === 'expense' && user.monthly_budget > 0) {
            const now = new Date();
            const totalExpense = await Finance.getMonthlyExpense(user.id, now.getFullYear(), now.getMonth() + 1);
            const percentage = Math.round((totalExpense / user.monthly_budget) * 100);
            const remaining = user.monthly_budget - totalExpense;

            if (percentage >= 100) {
                reply += `\n\n🚨 *BUDGET TERLAMPAUI!*\nPengeluaran: ${helpers.formatCurrency(totalExpense)} / ${helpers.formatCurrency(user.monthly_budget)} (${percentage}%)\nKelebihan: ${helpers.formatCurrency(Math.abs(remaining))}`;
            } else if (percentage >= 90) {
                reply += `\n\n⚠️ *Peringatan Budget!*\nPengeluaran: ${helpers.formatCurrency(totalExpense)} / ${helpers.formatCurrency(user.monthly_budget)} (${percentage}%)\nSisa: ${helpers.formatCurrency(remaining)}`;
            } else if (percentage >= 75) {
                reply += `\n\n📊 Budget: ${helpers.formatCurrency(totalExpense)} / ${helpers.formatCurrency(user.monthly_budget)} (${percentage}%)\nSisa: ${helpers.formatCurrency(remaining)}`;
            }
        }

        return bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    }
};

// Handle note intent (extracted by Gemini)
const handleNoteIntent = async (bot, msg, user, extracted) => {
    const chatId = msg.chat.id;
    const nData = extracted.note_data;
    if (nData && nData.content) {
        await Note.create(user.id, nData.content);
        return bot.sendMessage(chatId, `📌 *Catatan Disimpan!*\n${nData.content}\n\nLihat semua catatan: /notes`, { parse_mode: 'Markdown' });
    }
};

const listTasks = async (bot, msg) => {
    const chatId = msg.chat.id;

    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) {
            return bot.sendMessage(chatId, "Kamu belum memiliki tugas apapun. Yuk tambahkan tugas pertamamu!");
        }

        const tasks = await Task.findPendingByUserId(user.id);

        if (tasks.length === 0) {
            return bot.sendMessage(chatId, "Horray! 🎉 Tidak ada tugas yang tertunda. Waktunya bersantai!");
        }

        // Send each task with inline keyboard buttons
        let headerMsg = `📋 *Daftar Tugasmu (${tasks.length} pending):*\n`;
        await bot.sendMessage(chatId, headerMsg, { parse_mode: "Markdown" });

        for (const t of tasks) {
            const taskText = `📝 *${t.task}*\n⏰ ${helpers.formatDate(t.datetime)}${t.is_recurring ? `\n🔁 Rutin (${t.recurrence_pattern})` : ''}\n🆔 ID: ${t.id}`;
            
            const keyboard = {
                reply_markup: {
                    inline_keyboard: [
                        [
                            { text: '✅ Selesai', callback_data: `task_done_${t.id}` },
                            { text: '🗑️ Hapus', callback_data: `task_delete_${t.id}` }
                        ]
                    ]
                }
            };

            await bot.sendMessage(chatId, taskText, { parse_mode: "Markdown", ...keyboard });
        }
    } catch (error) {
        console.error("List task error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mengambil daftar tugasmu.");
    }
};

const deleteTask = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    const taskIdString = match[1];

    if (!taskIdString) {
        return bot.sendMessage(chatId, "Penggunaan: `/delete <ID>`\nContoh: `/delete 5`\nCek ID tugas dengan command `/list`.", { parse_mode: "Markdown" });
    }

    const taskId = parseInt(taskIdString);

    if (isNaN(taskId)) {
        return bot.sendMessage(chatId, "ID tugas harus berupa angka.");
    }

    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) {
            return bot.sendMessage(chatId, "Kamu belum memiliki tugas apapun.");
        }

        const deleted = await Task.deleteByIdAndUserId(taskId, user.id);

        if (deleted) {
            bot.sendMessage(chatId, `✅ Tugas dengan ID ${taskId} berhasil dihapus.`);
        } else {
            bot.sendMessage(chatId, `⚠️ Tugas dengan ID ${taskId} tidak ditemukan atau bukan milikmu.`);
        }
    } catch (error) {
        console.error("Delete task error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat menghapus tugas.");
    }
};

// ==================== FINANCE HANDLERS ====================
const financeSummary = async (bot, msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return bot.sendMessage(chatId, "Belum ada catatan keuangan apapun.");

        const { income, expense, balance } = await Finance.getSummary(user.id);
        
        let reply = `📊 *Ringkasan Keuanganmu (Keseluruhan)*\n\n`;
        reply += `💰 Pemasukan: ${helpers.formatCurrency(income)}\n`;
        reply += `💸 Pengeluaran: ${helpers.formatCurrency(expense)}\n`;
        reply += `================\n`;
        reply += `⚖️ Saldo Murni: ${helpers.formatCurrency(balance)}\n`;

        if (user.monthly_budget > 0) {
            const now = new Date();
            const monthlyExpense = await Finance.getMonthlyExpense(user.id, now.getFullYear(), now.getMonth() + 1);
            const percentage = Math.round((monthlyExpense / user.monthly_budget) * 100);
            reply += `\n📋 *Budget Bulan Ini:*\n`;
            reply += `${helpers.formatCurrency(monthlyExpense)} / ${helpers.formatCurrency(user.monthly_budget)} (${percentage}%)\n`;
            reply += generateProgressBar(percentage);
        }

        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Finance summary error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat merekap keuanganmu.");
    }
};

const financeReport = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return bot.sendMessage(chatId, "Belum ada catatan keuangan apapun.");

        const now = new Date();
        let month = now.getMonth() + 1;
        let year = now.getFullYear();

        // Parse optional month/year from match
        if (match && match[1]) {
            const parts = match[1].trim().split(/\s+/);
            if (parts[0]) month = parseInt(parts[0]);
            if (parts[1]) year = parseInt(parts[1]);
        }

        if (isNaN(month) || month < 1 || month > 12) month = now.getMonth() + 1;
        if (isNaN(year) || year < 2000) year = now.getFullYear();

        const summary = await Finance.getMonthlySummary(user.id, year, month);
        const categories = await Finance.getCategorySummary(user.id, year, month);
        const monthName = helpers.getMonthName(month);

        let reply = `📊 *Laporan Keuangan — ${monthName} ${year}*\n\n`;
        reply += `💰 Pemasukan: ${helpers.formatCurrency(summary.income)}\n`;
        reply += `💸 Pengeluaran: ${helpers.formatCurrency(summary.expense)}\n`;
        reply += `================\n`;
        reply += `⚖️ Saldo: ${helpers.formatCurrency(summary.balance)}\n`;

        if (categories.length > 0) {
            reply += `\n📈 *Top Pengeluaran per Kategori:*\n`;
            categories.forEach((cat, i) => {
                const emoji = helpers.getCategoryEmoji(cat.category);
                reply += `${i + 1}. ${emoji} ${cat.category} — ${helpers.formatCurrency(parseFloat(cat.total))}\n`;
            });
        }

        if (user.monthly_budget > 0) {
            const percentage = Math.round((summary.expense / user.monthly_budget) * 100);
            reply += `\n📋 *Budget:* ${helpers.formatCurrency(summary.expense)} / ${helpers.formatCurrency(user.monthly_budget)} (${percentage}%)\n`;
            reply += generateProgressBar(percentage);
        }

        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Finance report error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat membuat laporan.");
    }
};

const financeHistory = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return bot.sendMessage(chatId, "Belum ada catatan keuangan apapun.");

        let limit = 10;
        if (match && match[1]) {
            const parsed = parseInt(match[1]);
            if (!isNaN(parsed) && parsed > 0 && parsed <= 50) limit = parsed;
        }

        const transactions = await Finance.getHistory(user.id, limit);

        if (transactions.length === 0) {
            return bot.sendMessage(chatId, "Belum ada transaksi yang tercatat. Mulai catat keuanganmu! 💰");
        }

        let reply = `📝 *${transactions.length} Transaksi Terakhir:*\n\n`;
        transactions.forEach((t, i) => {
            const icon = t.type === 'income' ? '💰' : '💸';
            const emoji = helpers.getCategoryEmoji(t.category);
            const date = helpers.formatShortDate(t.created_at);
            reply += `${i + 1}. ${icon} ${t.description} — ${helpers.formatCurrency(parseFloat(t.amount))} ${emoji}\n   📅 ${date}\n\n`;
        });

        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Finance history error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mengambil riwayat transaksi.");
    }
};

const setBudget = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "Penggunaan: `/setbudget <nominal>`\nContoh: `/setbudget 3000000`", { parse_mode: "Markdown" });
    }

    const amount = parseFloat(match[1].replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount < 0) {
        return bot.sendMessage(chatId, "Nominal budget harus berupa angka positif.");
    }

    try {
        let user = await User.findByTelegramId(chatId);
        if (!user) {
            const userId = await User.create(chatId);
            user = { id: userId, telegram_id: chatId };
        }

        await User.updateBudget(chatId, amount);

        if (amount === 0) {
            return bot.sendMessage(chatId, "✅ Budget bulanan dinonaktifkan.");
        }

        const now = new Date();
        const currentExpense = await Finance.getMonthlyExpense(user.id, now.getFullYear(), now.getMonth() + 1);
        const percentage = Math.round((currentExpense / amount) * 100);

        let reply = `✅ *Budget Bulanan Di-set!*\n\nBatas: ${helpers.formatCurrency(amount)}\nPengeluaran bulan ini: ${helpers.formatCurrency(currentExpense)} (${percentage}%)\n`;
        reply += generateProgressBar(percentage);
        reply += `\nSisa: ${helpers.formatCurrency(amount - currentExpense)}`;

        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Set budget error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat set budget.");
    }
};

// ==================== NOTE HANDLERS ====================
const addNote = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "Penggunaan: `/note <isi catatan>`\nContoh: `/note WiFi password: Abcd1234`", { parse_mode: "Markdown" });
    }

    try {
        let user = await User.findByTelegramId(chatId);
        if (!user) {
            const userId = await User.create(chatId);
            user = { id: userId, telegram_id: chatId };
        }

        const content = match[1].trim();
        const noteId = await Note.create(user.id, content);
        bot.sendMessage(chatId, `📌 *Catatan #${noteId} Disimpan!*\n${content}`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Add note error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat menyimpan catatan.");
    }
};

const listNotes = async (bot, msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return bot.sendMessage(chatId, "Belum ada catatan apapun.");

        const notes = await Note.findByUserId(user.id, 20);

        if (notes.length === 0) {
            return bot.sendMessage(chatId, "📌 Belum ada catatan. Simpan catatan dengan:\n`/note <isi catatan>`", { parse_mode: 'Markdown' });
        }

        let reply = `📌 *Catatan Tersimpan (${notes.length}):*\n\n`;
        notes.forEach((n, i) => {
            const date = helpers.formatShortDate(n.created_at);
            reply += `${i + 1}. ${n.content}\n   📅 ${date} (ID: ${n.id})\n\n`;
        });
        reply += `Hapus catatan: \`/delnote <ID>\``;

        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("List notes error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mengambil catatan.");
    }
};

const deleteNote = async (bot, msg, match) => {
    const chatId = msg.chat.id;

    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "Penggunaan: `/delnote <ID>`\nCek ID catatan dengan `/notes`", { parse_mode: "Markdown" });
    }

    const noteId = parseInt(match[1]);
    if (isNaN(noteId)) {
        return bot.sendMessage(chatId, "ID catatan harus berupa angka.");
    }

    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return bot.sendMessage(chatId, "Belum ada catatan apapun.");

        const deleted = await Note.deleteByIdAndUserId(noteId, user.id);
        if (deleted) {
            bot.sendMessage(chatId, `✅ Catatan #${noteId} berhasil dihapus.`);
        } else {
            bot.sendMessage(chatId, `⚠️ Catatan ID ${noteId} tidak ditemukan atau bukan milikmu.`);
        }
    } catch (error) {
        console.error("Delete note error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat menghapus catatan.");
    }
};

// ==================== WEATHER HANDLERS ====================
const weather = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "Penggunaan: `/cuaca <nama kota>`\nContoh: `/cuaca Bandung`", { parse_mode: "Markdown" });
    }

    const cityName = match[1].trim();
    bot.sendMessage(chatId, `🔍 Mencari cuaca untuk *${cityName}*...`, { parse_mode: 'Markdown' });

    try {
        const result = await weatherService.getForecastByCity(cityName);
        bot.sendMessage(chatId, result.message, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Weather error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mengambil data cuaca.");
    }
};

const setLocation = async (bot, msg, match) => {
    const chatId = msg.chat.id;
    
    if (!match || !match[1]) {
        return bot.sendMessage(chatId, "Penggunaan: `/setlokasi <nama kota>`\nContoh: `/setlokasi Surabaya`", { parse_mode: "Markdown" });
    }

    const cityName = match[1].trim();

    try {
        const geo = await weatherService.geocodeCity(cityName);
        if (!geo) {
            return bot.sendMessage(chatId, `❌ Kota "${cityName}" tidak ditemukan. Coba nama kota lain.`);
        }

        let user = await User.findByTelegramId(chatId);
        if (!user) {
            await User.create(chatId);
        }

        await User.updateLocation(chatId, geo.name, geo.lat, geo.lon);
        bot.sendMessage(chatId, `✅ Lokasi default cuaca diubah ke *${geo.name}*${geo.country ? `, ${geo.country}` : ''}\n\nLaporan cuaca pagi akan menggunakan lokasi ini.`, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Set location error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat mengubah lokasi.");
    }
};

// ==================== CALLBACK QUERY (Inline Keyboard) ====================
const handleCallbackQuery = async (bot, query) => {
    const chatId = query.message.chat.id;
    const data = query.data;
    const messageId = query.message.message_id;

    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return;

        // Task Done
        if (data.startsWith('task_done_')) {
            const taskId = parseInt(data.replace('task_done_', ''));
            const completed = await Task.markAsCompleted(taskId);
            if (completed) {
                await bot.answerCallbackQuery(query.id, { text: '✅ Tugas diselesaikan!' });
                await bot.editMessageText(`✅ ~Selesai~\n${query.message.text}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
            } else {
                await bot.answerCallbackQuery(query.id, { text: '⚠️ Tugas tidak ditemukan.' });
            }
        }

        // Task Delete
        if (data.startsWith('task_delete_')) {
            const taskId = parseInt(data.replace('task_delete_', ''));
            const deleted = await Task.deleteByIdAndUserId(taskId, user.id);
            if (deleted) {
                await bot.answerCallbackQuery(query.id, { text: '🗑️ Tugas dihapus!' });
                await bot.editMessageText(`🗑️ ~Dihapus~\n${query.message.text}`, {
                    chat_id: chatId,
                    message_id: messageId,
                    parse_mode: 'Markdown'
                });
            } else {
                await bot.answerCallbackQuery(query.id, { text: '⚠️ Tugas tidak ditemukan.' });
            }
        }
    } catch (error) {
        console.error("Callback query error:", error);
        await bot.answerCallbackQuery(query.id, { text: '❌ Terjadi kesalahan.' });
    }
};

// ==================== GENERAL MESSAGE HANDLER ====================
const handleMessage = async (bot, msg) => {
    // Ignore commands
    if (msg.text && msg.text.startsWith('/')) return;
    
    // Process as natural language
    return addTask(bot, msg, [null, msg.text]);
};

// ==================== UTILITY ====================
const generateProgressBar = (percentage) => {
    const filled = Math.min(Math.round(percentage / 10), 10);
    const empty = 10 - filled;
    let bar = '▓'.repeat(filled) + '░'.repeat(empty);
    return `[${bar}] ${percentage}%\n`;
};

module.exports = {
    start,
    help,
    addTask,
    listTasks,
    deleteTask,
    handleMessage,
    financeSummary,
    financeReport,
    financeHistory,
    setBudget,
    addNote,
    listNotes,
    deleteNote,
    weather,
    setLocation,
    handleCallbackQuery
};
