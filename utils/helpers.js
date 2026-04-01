const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) + ' WIB';
};

const getDefaultDatetime = () => {
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 1); // Default 1 hour from now
    
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${defaultDate.getFullYear()}-${pad(defaultDate.getMonth() + 1)}-${pad(defaultDate.getDate())} ${pad(defaultDate.getHours())}:${pad(defaultDate.getMinutes())}:00`;
};

const formatCurrency = (amount) => {
    return `Rp${Number(amount).toLocaleString('id-ID')}`;
};

const getMonthName = (month) => {
    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return months[month - 1] || 'Unknown';
};

const getCategoryEmoji = (category) => {
    const emojiMap = {
        'makan': '🍔',
        'transport': '🚗',
        'belanja': '🛒',
        'hiburan': '🎬',
        'tagihan': '📄',
        'kesehatan': '💊',
        'pendidikan': '📚',
        'gaji': '💼',
        'freelance': '💻',
        'investasi': '📈',
        'lainnya': '📦'
    };
    return emojiMap[category] || '📦';
};

const formatShortDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short'
    });
};

module.exports = {
    formatDate,
    getDefaultDatetime,
    formatCurrency,
    getMonthName,
    getCategoryEmoji,
    formatShortDate
};
