const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const geminiService = {
    async extractTaskAndDate(text) {
        try {
            const prompt = `
Anda adalah seorang asisten Super AI pintar berbahasa Indonesia bernama Bot Asisten Pribadi.
Tugas Anda adalah memahami maksud dari teks pesan pengguna dan mengembalikannya HANYA dalam format JSON valid (tanpa blok markdown) berdasarkan kategori tujuan (intent).

Kategori intent yang ada:
1. "task" : Jika pengguna ingin membuat peringatan jadwal/tugas (contoh: ingatkan saya besok makan).
2. "finance" : Jika pengguna membicarakan uang masuk/keluar atau pengeluaran (contoh: beli bakso 10rb, dapat gaji 5 juta).
3. "chat" : Jika pengguna menyapa, curhat, bertanya (seperti resep, berita, dll), atau tidak termasuk task/finance (contoh: Hai, tolong resep ayam geprek, cuaca besok).

Pesan Pengguna: "${text}"
Waktu saat ini (sekarang) adalah: ${new Date().toISOString()}

Kembalikan HANYA format JSON berikut SESUAI dengan intent yang terdeteksi. Kunci utama harus selalu ada:
{
  "intent": "task" | "finance" | "chat",
  "task_data": { 
     // HANYA isi jika intent=task, KALAU TIDAK isi null
     "task": "Deksripsi", 
     "datetime": "YYYY-MM-DD HH:mm:ss", 
     "is_recurring": true/false, 
     "recurrence_pattern": "daily" | "weekly" | "monthly" | "yearly" | null
  },
  "finance_data": {
     // HANYA isi jika intent=finance, KALAU TIDAK isi null
     "amount": 10000, // angka nominal pastikan konversi dari huruf eMisal 10rb=10000
     "description": "Beli bakso",
     "type": "income" | "expense"
  },
  "chat_response": "Balasan ramah & cerdas Anda yang sangat natural layaknya ChatGPT. HANYA isi jika intent=chat, kalau tidak isi null"
}

Peraturan: Asumsi waktu default jadwal adalah 1 jam dari sekarang jika tidak disebut spesifik.
            `;

            // Call Gemini 2.5 Flash model
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            let content = response.text.trim();
            // Clean up possible markdown json blocks
            content = content.replace(/```json/g, '').replace(/```/g, '');
            const data = JSON.parse(content);

            return data;
        } catch (error) {
            console.error("Gemini Error:", error.message);
            return null;
        }
    }
};

module.exports = geminiService;
