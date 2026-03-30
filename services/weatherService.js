const axios = require('axios');

const weatherService = {
    async getDailyForecast(lat = -6.2088, lon = 106.8456) {
        try {
            // Default to Jakarta Coordinates
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=Asia%2FJakarta&forecast_days=1`;
            const response = await axios.get(url);
            const daily = response.data.daily;
            
            const maxTemp = daily.temperature_2m_max[0];
            const minTemp = daily.temperature_2m_min[0];
            const weatherCode = daily.weather_code[0];

            let condition = "Cerah ☀️";
            if (weatherCode >= 1 && weatherCode <= 3) condition = "Berawan ⛅";
            else if (weatherCode >= 45 && weatherCode <= 48) condition = "Berkabut 🌫️";
            else if (weatherCode >= 51 && weatherCode <= 67) condition = "Hujan Ringan 🌧️";
            else if (weatherCode >= 71 && weatherCode <= 77) condition = "Hujan Salju ❄️";
            else if (weatherCode >= 80 && weatherCode <= 82) condition = "Hujan Lebat ☔";
            else if (weatherCode >= 95) condition = "Badai Petir ⛈️";

            return `🌤️ *Prakiraan Cuaca Hari Ini*\nKondisi: ${condition}\nSuhu: ${minTemp}°C - ${maxTemp}°C`;
        } catch (error) {
            console.error("Weather Service Error:", error.message);
            return "Maaf, data cuaca pagi ini sedang tidak bisa diakses.";
        }
    }
};

module.exports = weatherService;
