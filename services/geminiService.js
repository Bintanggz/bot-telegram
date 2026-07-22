const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const geminiService = {
    async extractTaskAndDate(text) {
        try {
            // Hitung waktu saat ini dalam WIB (UTC+7)
            const now = new Date();
            const wibOffset = 7 * 60 * 60 * 1000;
            const wibDate = new Date(now.getTime() + wibOffset);
            const formattedWib = wibDate.toISOString().slice(0, 19).replace('T', ' ') + ' WIB (UTC+7)';

            const prompt = `
Anda adalah seorang asisten Super AI pintar berbahasa Indonesia bernama Bot Asisten Pribadi.
Tugas Anda adalah memahami maksud dari teks pesan pengguna dan mengembalikannya HANYA dalam format JSON valid (tanpa blok markdown) berdasarkan kategori tujuan (intent).

Kategori intent yang ada:
1. "task" : Jika pengguna ingin membuat peringatan jadwal/tugas (contoh: ingatkan saya besok makan).
2. "finance" : Jika pengguna membicarakan uang masuk/keluar atau pengeluaran (contoh: beli bakso 10rb, dapat gaji 5 juta).
3. "note" : Jika pengguna ingin menyimpan catatan/informasi untuk referensi nanti (contoh: catat password wifi Abcd1234, simpan no rekening 123456).
4. "chat" : Jika pengguna menyapa, curhat, bertanya (seperti resep, berita, dll), atau tidak termasuk task/finance/note (contoh: Hai, tolong resep ayam geprek, cuaca besok).

Pesan Pengguna: "${text}"
Waktu saat ini (WIB/Jakarta) adalah: ${formattedWib}

Kembalikan HANYA format JSON berikut SESUAI dengan intent yang terdeteksi. Kunci utama harus selalu ada:
{
  "intent": "task" | "finance" | "note" | "chat",
  "task_data": { 
     // HANYA isi jika intent=task, KALAU TIDAK isi null
     "task": "Deksripsi", 
     "datetime": "YYYY-MM-DD HH:mm:ss", 
     "is_recurring": true/false, 
     "recurrence_pattern": "daily" | "weekly" | "monthly" | "yearly" | null
  },
  "finance_data": {
     // HANYA isi jika intent=finance, KALAU TIDAK isi null
     "amount": 10000,
     "description": "Beli bakso",
     "type": "income" | "expense",
     "category": "makan" | "transport" | "belanja" | "hiburan" | "tagihan" | "kesehatan" | "pendidikan" | "gaji" | "freelance" | "investasi" | "lainnya"
  },
  "note_data": {
     // HANYA isi jika intent=note, KALAU TIDAK isi null
     "content": "Isi catatan yang ingin disimpan"
  },
  "chat_response": "Balasan ramah & cerdas Anda yang sangat natural layaknya ChatGPT. HANYA isi jika intent=chat, kalau tidak isi null"
}

Peraturan:
- Asumsi waktu default jadwal adalah 1 jam dari sekarang jika tidak disebut spesifik. Tulis format datetime dalam WIB.
- Untuk finance, pastikan konversi nominal dari huruf ke angka (misal 10rb=10000, 5jt=5000000).
- Untuk finance, tentukan kategori yang paling sesuai dari daftar yang tersedia.
- Untuk note, tangkap SELURUH informasi yang ingin dicatat pengguna.
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
            content = content.replace(/```json/g, '').replace(/```/g, '');
            const data = JSON.parse(content);

            return data;
        } catch (error) {
            console.error("Gemini Error:", error.message);
            return null;
        }
    },

    async processReceiptImage(imageBuffer, mimeType = 'image/jpeg') {
        try {
            const prompt = `
Anda adalah ahli OCR struk/nota belanja. Analisis foto struk ini dan ekstrak informasi transaksi berikut.
Kembalikan HANYA format JSON valid tanpa blok markdown:
{
  "is_receipt": true/false,
  "amount": 50000, // Total bayar dalam angka (number)
  "description": "Nama toko / ringkasan belanja (contoh: Belanja di Indomaret / Bensin Pertamina)",
  "category": "makan" | "transport" | "belanja" | "hiburan" | "tagihan" | "kesehatan" | "pendidikan" | "lainnya"
}

Jika gambar bukan struk/nota belanja, set is_receipt ke false dan amount ke 0.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [
                    {
                        inlineData: {
                            data: imageBuffer.toString('base64'),
                            mimeType: mimeType
                        }
                    },
                    prompt
                ],
                config: {
                    temperature: 0.1,
                    responseMimeType: "application/json"
                }
            });

            let content = response.text.trim();
            content = content.replace(/```json/g, '').replace(/```/g, '');
            const data = JSON.parse(content);

            return data;
        } catch (error) {
            console.error("Gemini OCR Error:", error.message);
            return null;
        }
    }
};

module.exports = geminiService;
