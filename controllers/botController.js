const geminiService = require('../services/geminiService');
const Task = require('../models/Task');
const User = require('../models/User');
const Finance = require('../models/Finance');
const helpers = require('../utils/helpers');

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
Gunakan \`/list\` untuk melihat jadwal dan \`/delete <id>\` untuk menghapus.

💰 *2. Catat Pemasukan / Pengeluaran*
Lapor keuangan lebih mudah. Contoh:
- _"Gajian masuk 5 juta hari ini"_
- _"Beli bensin 25 ribu"_
Gunakan \`/finance\` untuk cek saldo!

🌤️ *3. Sapaan Cuaca Harian*
Setiap subuh (jam 06:00), aku akan melaporkan prakiraan cuaca di hari tesebut.

💬 *4. AI Konsultan Pribadi*
Sedang buntu ide? Tulis chat nyasar layaknya memakai ChatGPT biasa! Aku bakal jawab pertanyaan seputar apapun.

Ketik fitur pilihanmu sekarang 😊`;

    bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
};

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

        if (extracted.intent === 'finance') {
            const fData = extracted.finance_data;
            if (fData && fData.amount) {
                await Finance.create(user.id, fData.amount, fData.description, fData.type);
                const typeStr = fData.type === 'income' ? 'Pemasukan 💰' : 'Pengeluaran 💸';
                return bot.sendMessage(chatId, `✅ *${typeStr} Dicatat!*\nNominal: Rp${Number(fData.amount).toLocaleString('id-ID')}\nKeterangan: ${fData.description}`, {parse_mode: 'Markdown'});
            }
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
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat menyimpan tugasmu. Coba lagi nanti ya.");
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

        let responseText = "📋 *Daftar Tugasmu yang Belum Selesai:*\n\n";
        tasks.forEach((t, i) => {
            responseText += `${i + 1}. ${t.task}\n   ⏰ ${helpers.formatDate(t.datetime)} (ID: ${t.id})\n\n`;
        });
        responseText += "\nUntuk menghapus tugas, ketik `/delete <ID>`";

        bot.sendMessage(chatId, responseText, { parse_mode: "Markdown" });
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

// Handle generic text without /add command (Natural language directly)
const handleMessage = async (bot, msg) => {
    // Ignore commands
    if (msg.text && msg.text.startsWith('/')) return;
    
    // Process as task addition
    return addTask(bot, msg, [null, msg.text]);
};

const financeSummary = async (bot, msg) => {
    const chatId = msg.chat.id;
    try {
        const user = await User.findByTelegramId(chatId);
        if (!user) return bot.sendMessage(chatId, "Belum ada catatan keuangan apapun.");

        const { income, expense, balance } = await Finance.getSummary(user.id);
        
        let reply = `📊 *Ringkasan Keuanganmu*\n\n`;
        reply += `💰 Pemasukan: Rp${income.toLocaleString('id-ID')}\n`;
        reply += `💸 Pengeluaran: Rp${expense.toLocaleString('id-ID')}\n`;
        reply += `================\n`;
        reply += `⚖️ Saldo Murni: Rp${balance.toLocaleString('id-ID')}\n`;

        bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
    } catch (error) {
        console.error("Finance summary error:", error);
        bot.sendMessage(chatId, "Maaf, terjadi kesalahan saat merekap keuanganmu.");
    }
};

module.exports = {
    start,
    addTask,
    listTasks,
    deleteTask,
    handleMessage,
    financeSummary
};
