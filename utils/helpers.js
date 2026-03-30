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

module.exports = {
    formatDate,
    getDefaultDatetime
};
