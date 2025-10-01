require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

console.log('🚀 Запуск простого теста бота...');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('WEBAPP_URL:', process.env.WEBAPP_URL);

if (!process.env.BOT_TOKEN) {
  console.error('❌ BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

console.log('✅ Бот создан, начинаю polling...');

bot.on('message', (msg) => {
  console.log('📨 Получено сообщение:', msg.text);
  bot.sendMessage(msg.chat.id, '✅ Простой тест работает!');
});

bot.on('error', (error) => {
  console.error('❌ Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
  console.error('❌ Ошибка polling:', error);
});

console.log('🎯 Простой тест бот запущен и ожидает сообщений...');