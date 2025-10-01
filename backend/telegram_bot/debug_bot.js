require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

console.log('Token:', token ? 'установлен' : 'НЕ УСТАНОВЛЕН');
console.log('WebApp URL:', webAppUrl);

if (!token) {
  console.error('❌ BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Бот запущен и готов к работе!');

// Простая функция очистки настроек
async function clearAllBotSettings() {
  try {
    console.log('🧹 Начинаем полную очистку настроек бота...');
    
    // Удаляем webhook
    await bot.setWebHook('');
    console.log('✅ Webhook удален');
    
    // Удаляем все команды
    await bot.setMyCommands([]);
    console.log('✅ Команды очищены');
    
    // Ждем немного
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Устанавливаем новые команды
    await bot.setMyCommands([
      { command: 'start', description: 'Запустить бота' },
      { command: 'clear', description: 'Очистить кэш' },
      { command: 'newurl', description: 'Новая ссылка' }
    ]);
    console.log('✅ Новые команды установлены');
    
    console.log('🎉 Полная очистка завершена!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка при очистке настроек:', error.message);
    console.error('Полная ошибка:', error);
    return false;
  }
}

// Обработчик команды /clear
bot.onText(/\/clear/, async (msg) => {
  const chatId = msg.chat.id;
  console.log('Получена команда /clear от пользователя:', chatId);
  
  try {
    await bot.sendMessage(chatId, '🧹 Начинаю полную очистку настроек бота...');
    
    const success = await clearAllBotSettings();
    
    if (success) {
      const clearUrl = `${webAppUrl}?t=${Date.now()}&clear=true`;
      await bot.sendMessage(chatId, '✅ Настройки успешно очищены!', {
        reply_markup: {
          inline_keyboard: [[
            { text: '🌸 Открыть каталог', web_app: { url: clearUrl } }
          ]]
        }
      });
    } else {
      await bot.sendMessage(chatId, '❌ Ошибка при очистке настроек. Попробуйте еще раз.');
    }
  } catch (error) {
    console.error('Ошибка в обработчике /clear:', error);
    await bot.sendMessage(chatId, '❌ Ошибка при очистке настроек. Попробуйте еще раз.');
  }
});

// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  console.log('Получена команда /start от пользователя:', chatId);
  
  const startUrl = `${webAppUrl}?t=${Date.now()}`;
  await bot.sendMessage(chatId, 'Добро пожаловать! 🌸', {
    reply_markup: {
      inline_keyboard: [[
        { text: '🌸 Открыть каталог', web_app: { url: startUrl } }
      ]]
    }
  });
});

// Обработка ошибок
bot.on('error', (error) => {
  console.error('Ошибка бота:', error);
});

bot.on('polling_error', (error) => {
  console.error('Ошибка polling:', error);
});