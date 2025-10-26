require('dotenv').config();

const { Bot, Keyboard } = require('grammy');

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL || 'http://localhost:3000';

if (!token) {
  throw new Error('Отсутствует TELEGRAM_BOT_TOKEN в переменных окружения');
}

const bot = new Bot(token);

// Приветственное сообщение (используется в /start)
const welcomeMessage = 'Привет! Для пользования платформой открой мини-приложение по кнопке ниже.';

// Клавиатура с кнопкой открытия WebApp (видна рядом с полем ввода)
const keyboard = new Keyboard()
  .webApp('StudyFlow', webAppUrl)
  .resized();

bot.command('start', async (ctx) => {
  await ctx.reply(welcomeMessage, { reply_markup: keyboard });
});

// Вспомогательная команда: узнать chat.id
bot.command('chatid', async (ctx) => {
  const chatId = ctx.chat?.id;
  console.log('Chat ID:', chatId);
  await ctx.reply(`Chat ID: ${chatId}`);
});

// Установка кнопки меню бота для открытия WebApp
async function setupMenuButton() {
  try {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: 'StudyFlow',
        web_app: { url: webAppUrl },
      },
    });
    console.log('Меню‑кнопка WebApp установлена (StudyFlow)');
  } catch (err) {
    console.error('Не удалось установить меню‑кнопку:', err?.message || err);
  }
}

// Установка описания бота, которое видно до нажатия "Start"
async function setupBotMeta() {
  try {
    await bot.api.setMyShortDescription({
      short_description: 'StudyFlow — платформа для апгрейда студентов и Хелперов НГУ',
    });
    // Возвращаем установку описания как было — используем welcomeMessage
    await bot.api.setMyDescription({ description: welcomeMessage });
    console.log('Описание бота обновлено (welcomeMessage)');
  } catch (err) {
    console.error('Не удалось обновить описание бота:', err?.message || err);
  }
}

async function main() {
  await setupMenuButton();
  await setupBotMeta();
  bot.start();
  console.log('Бот запущен. Ожидаю сообщения…');
}

main();