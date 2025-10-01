require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

console.log('Token:', token ? 'Установлен' : 'НЕ УСТАНОВЛЕН');
console.log('WebApp URL:', webAppUrl);

if (!token) {
  console.error('❌ BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Тестовый бот запущен...');

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '✅ Тестовый бот работает!');
});

bot.onText(/\/clear/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '🧹 Команда /clear получена и работает!');
});

bot.on('message', (msg) => {
  console.log('📨 Получено сообщение:', msg.text);
});

console.log('✅ Бот готов к работе');