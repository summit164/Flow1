require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');

// Получаем токен бота и URL веб-приложения из переменных окружения
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEBAPP_URL;

// Создаем экземпляр бота
const bot = new TelegramBot(token, { polling: true });

// Функция для очистки webhook и принудительного обновления настроек
async function clearWebhookAndRefresh() {
  try {
    // Удаляем webhook, если он был установлен
    await bot.setWebHook('');
    console.log('Webhook удален');
    
    // Устанавливаем команды бота заново
    await bot.setMyCommands([
      { command: 'start', description: 'Запустить бота и открыть каталог' },
      { command: 'phone', description: 'Зарегистрировать номер телефона' },
      { command: 'myorders', description: 'Мои заказы' },
      { command: 'clear', description: 'Очистить кэш' }
    ]);
    console.log('Команды бота обновлены');
    
    // Устанавливаем кнопку меню, чтобы она всегда была видна
    await bot.setChatMenuButton({
      type: 'commands'
    });
    console.log('Кнопка меню установлена');
    
    console.log('Настройки бота обновлены. URL веб-приложения:', webAppUrl);
  } catch (error) {
    console.log('Ошибка при обновлении настроек:', error.message);
  }
}

// Функция будет вызвана в конце файла после инициализации всех обработчиков

// Функция для полной очистки настроек бота
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
      { command: 'start', description: 'Запустить бота и открыть каталог' },
      { command: 'phone', description: 'Зарегистрировать номер телефона' },
      { command: 'myorders', description: 'Мои заказы' },
      { command: 'clear', description: 'Очистить кэш' }
    ]);
    console.log('✅ Новые команды установлены');
    
    // Устанавливаем кнопку меню, чтобы она всегда была видна
    await bot.setChatMenuButton({
      type: 'commands'
    });
    console.log('✅ Кнопка меню установлена');
    
    console.log('🎉 Полная очистка завершена!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка при очистке настроек:', error);
    return false;
  }
}



// Обработчик команды /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name;

  // Устанавливаем кнопку меню для этого чата
  try {
    await bot.setChatMenuButton({
      chat_id: chatId,
      type: 'commands'
    });
    console.log('Кнопка меню установлена для чата:', chatId);
  } catch (error) {
    console.log('Ошибка при установке кнопки меню:', error.message);
  }

  // Выводим URL для отладки
  console.log('Используемый URL веб-приложения:', webAppUrl);
  
  // Отправляем URL в чат для проверки
  bot.sendMessage(chatId, `Текущий URL веб-приложения: ${webAppUrl}`);

  // Создаем клавиатуру с веб-приложением
  const keyboard = {
    reply_markup: {
      keyboard: [
        [{ text: '🌺 Каталог', web_app: { url: webAppUrl } }],
        [{ text: '🛒 Моя корзина' }],
        [{ text: '📞 Связаться с нами' }]
      ],
      resize_keyboard: true,
      persistent: true
    }
  };

  // Отправляем приветственное сообщение с клавиатурой
  bot.sendMessage(
    chatId,
    `Привет, ${firstName}! 👋\n\nДобро пожаловать в магазин цветов! 🌹\n\nНажмите на кнопку "🌺 Каталог", чтобы перейти в наш каталог и выбрать букет.`,
    keyboard
  );
});

// Хранилище для связи Telegram ID с номерами телефонов
const userPhones = new Map();

// Обработчик команды /phone
bot.onText(/\/phone/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  bot.sendMessage(
    chatId,
    '📱 Для связи заказов с вашим аккаунтом, пожалуйста, отправьте ваш номер телефона.\n\n' +
    'Формат: +7 (999) 123-45-67 или 89991234567\n\n' +
    '💡 После регистрации номера вы сможете видеть все свои заказы в боте.',
    {
      reply_markup: {
        force_reply: true,
        input_field_placeholder: '+7 (999) 123-45-67'
      }
    }
  );
  
  // Устанавливаем флаг ожидания номера телефона
  userPhones.set(userId, { waitingForPhone: true });
});

// Обработчик команды /myorders
bot.onText(/\/myorders/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    let orders = [];
    
    // Сначала пытаемся найти заказы по Telegram ID
    const telegramOrders = await getUserOrders(userId.toString());
    if (telegramOrders && telegramOrders.length > 0) {
      orders = telegramOrders;
    } else {
      // Если заказов по Telegram ID нет, проверяем по номеру телефона
      const userPhone = userPhones.get(userId);
      
      if (userPhone && userPhone.phone) {
        // Пытаемся найти заказы по нормализованному номеру (с префиксом 7)
        const normalizedPhoneId = `phone_${userPhone.phone.replace(/\D/g, '')}`;
        let phoneOrders = await getUserOrders(normalizedPhoneId);
        
        // Если не найдено, пытаемся найти по оригинальному номеру (с префиксом 8)
        if (!phoneOrders || phoneOrders.length === 0) {
          const originalPhone = userPhone.phone.replace(/\D/g, '');
          const originalPhoneId = originalPhone.startsWith('7') ? 
            `phone_8${originalPhone.slice(1)}` : `phone_${originalPhone}`;
          phoneOrders = await getUserOrders(originalPhoneId);
        }
        
        if (phoneOrders && phoneOrders.length > 0) {
          orders = phoneOrders;
        }
      }
    }
    
    // Если заказов не найдено
    if (orders.length === 0) {
      const userPhone = userPhones.get(userId);
      let message = '📋 У вас пока нет заказов.\n\n';
      
      if (!userPhone || !userPhone.phone) {
        message += '💡 Для связи заказов с ботом:\n';
        message += '• При оформлении заказа на сайте укажите ваш Telegram ID: ' + userId + '\n';
        message += '• Или зарегистрируйте номер телефона командой /phone';
      } else {
        message += '💡 При оформлении заказа на сайте укажите:\n';
        message += '• Telegram ID: ' + userId + '\n';
        message += '• Или номер телефона: +' + userPhone.phone;
      }
      
      bot.sendMessage(chatId, message);
      return;
    }
    
    if (orders.length === 0) {
      bot.sendMessage(
        chatId,
        '🛒 У вас пока нет заказов.\n\n' +
        'Перейдите в каталог, чтобы выбрать букеты и цветы.\n\n' +
        '💡 При оформлении заказа на сайте укажите ваш номер телефона: ' + userPhone.phone
      );
      return;
    }
    
    let message = `📋 Ваши заказы (${orders.length}):\n\n`;
    
    orders.forEach((order, index) => {
      message += `${index + 1}. ${formatOrder(order)}\n\n`;
    });
    
    message += `📞 Для вопросов по заказам свяжитесь с нами:\n`;
    message += `📱 Telegram: @RyazanovKirill\n`;
    message += `💬 WhatsApp: wa.me/79999999999`;
    
    bot.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('Error in myorders handler:', error);
    bot.sendMessage(
      chatId,
      '❌ Произошла ошибка при загрузке заказов. Попробуйте позже.'
    );
  }
});

// Обработчик команды /clear
bot.onText(/\/clear/i, async (msg) => {
  console.log('📞 Получена команда /clear');
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, '🧹 Начинаю полную очистку настроек бота...');
  
  const success = await clearAllBotSettings();
  
  if (success) {
    await bot.sendMessage(chatId, '✅ Настройки успешно очищены!\n\n🎉 Все команды обновлены, кэш очищен. Теперь бот работает с чистыми настройками.');
  } else {
    await bot.sendMessage(chatId, '❌ Ошибка при очистке настроек. Попробуйте еще раз.');
  }
});





// Обработчики текстовых команд
bot.onText(/^(clear|очистить|клир)$/i, async (msg) => {
  console.log('📞 Получена текстовая команда очистки');
  const chatId = msg.chat.id;
  await bot.sendMessage(chatId, '🧹 Начинаю полную очистку настроек бота...');
  const success = await clearAllBotSettings();
  
  if (success) {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const clearUrl = `${webAppUrl}?clear=true&t=${timestamp}&id=${randomId}&force=true`;
    
    await bot.sendMessage(chatId, '✅ Настройки очищены! Попробуйте новую ссылку:', {
      reply_markup: {
        inline_keyboard: [[
          { text: '🆕 НОВАЯ ССЫЛКА НА КАТАЛОГ', web_app: { url: clearUrl } }
        ]]
      }
    });
  } else {
    await bot.sendMessage(chatId, '❌ Ошибка при очистке настроек. Попробуйте еще раз.');
  }
});





// Функция для получения заказов пользователя
async function getUserOrders(userId) {
  try {
    const response = await axios.get(`${webAppUrl}/api/orders?userId=${userId}`);
    return response.data.orders || [];
  } catch (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }
}

// Функция для форматирования заказа
function formatOrder(order) {
  let message = `📦 Заказ #${order.orderId.slice(-6)}\n`;
  message += `📅 Дата: ${new Date(order.timestamp).toLocaleString('ru-RU')}\n`;
  message += `💰 Сумма: ${order.total} ₽\n`;
  message += `📋 Статус: ${order.status === 'pending' ? 'Ожидает подтверждения' : order.status}\n\n`;
  
  message += `🌸 Состав заказа:\n`;
  order.items.forEach((item, index) => {
    message += `${index + 1}. ${item.flower.emoji} ${item.flower.name}\n`;
    message += `   Количество: ${item.quantity} шт.\n`;
    message += `   Цена: ${item.flower.price * item.quantity} ₽\n\n`;
  });
  
  return message;
}

// Команда для получения Telegram ID
bot.onText(/\/myid/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  bot.sendMessage(
    chatId,
    `🆔 Ваш Telegram ID: ${userId}\n\n` +
    `💡 Используйте этот ID при оформлении заказа на сайте, ` +
    `чтобы потом просматривать заказы в боте через кнопку "🛒 Моя корзина".`
  );
});


// Обработчик для кнопки "Моя корзина"
bot.onText(/🛒 Моя корзина/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  try {
    let orders = [];
    
    // Сначала пытаемся найти заказы по Telegram ID
    const telegramOrders = await getUserOrders(userId.toString());
    if (telegramOrders && telegramOrders.length > 0) {
      orders = telegramOrders;
    } else {
      // Если заказов по Telegram ID нет, проверяем по номеру телефона
      const userPhone = userPhones.get(userId);
      
      if (userPhone && userPhone.phone) {
        // Пытаемся найти заказы по нормализованному номеру (с префиксом 7)
        const normalizedPhoneId = `phone_${userPhone.phone.replace(/\D/g, '')}`;
        let phoneOrders = await getUserOrders(normalizedPhoneId);
        
        // Если не найдено, пытаемся найти по оригинальному номеру (с префиксом 8)
        if (!phoneOrders || phoneOrders.length === 0) {
          const originalPhone = userPhone.phone.replace(/\D/g, '');
          const originalPhoneId = originalPhone.startsWith('7') ? 
            `phone_8${originalPhone.slice(1)}` : `phone_${originalPhone}`;
          phoneOrders = await getUserOrders(originalPhoneId);
        }
        
        if (phoneOrders && phoneOrders.length > 0) {
          orders = phoneOrders;
        }
      }
    }
    
    // Если заказов не найдено, предлагаем зарегистрировать номер или использовать Telegram ID
    if (orders.length === 0) {
      const userPhone = userPhones.get(userId);
      let message = '🛒 У вас пока нет заказов.\n\n';
      
      if (!userPhone || !userPhone.phone) {
        message += '💡 Для связи заказов с ботом:\n';
        message += '• При оформлении заказа на сайте укажите ваш Telegram ID: ' + userId + '\n';
        message += '• Или зарегистрируйте номер телефона командой /phone\n\n';
        message += 'Перейдите в каталог, чтобы выбрать букеты и цветы.';
      } else {
        message += 'Перейдите в каталог, чтобы выбрать букеты и цветы.\n\n';
        message += '💡 При оформлении заказа на сайте укажите:\n';
        message += '• Telegram ID: ' + userId + '\n';
        message += '• Или номер телефона: +' + userPhone.phone;
      }
      
      bot.sendMessage(chatId, message);
      return;
    }
    
    if (orders.length === 0) {
      bot.sendMessage(
        chatId,
        '🛒 У вас пока нет заказов.\n\n' +
        'Перейдите в каталог, чтобы выбрать букеты и цветы.\n\n' +
        '💡 При оформлении заказа на сайте укажите ваш номер телефона: +' + userPhone.phone
      );
      return;
    }
    
    // Показываем последний заказ (самый актуальный)
    const latestOrder = orders[orders.length - 1];
    let message = `🛒 Ваш последний заказ:\n\n`;
    message += formatOrder(latestOrder);
    
    if (orders.length > 1) {
      message += `\n📊 У вас ${orders.length} заказов всего. Используйте /myorders для просмотра всех.`;
    }
    
    message += `\n\n💬 Для подтверждения заказа свяжитесь с нами:\n`;
    message += `📞 Телефон: 89999999999\n`;
    message += `📱 Telegram: @RyazanovKirill\n`;
    message += `💬 WhatsApp: wa.me/79999999999`;
    
    bot.sendMessage(chatId, message);
    
  } catch (error) {
    console.error('Error in cart handler:', error);
    bot.sendMessage(
      chatId,
      '❌ Произошла ошибка при загрузке корзины. Попробуйте позже.'
    );
  }
});

// Обработчик для кнопки "🌺 Каталог"
bot.onText(/🌺 Каталог/, async (msg) => {
  const chatId = msg.chat.id;
  
  // Создаем уникальный URL с параметрами для принудительного обновления
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(7);
  const catalogUrl = `${webAppUrl}?catalog=true&t=${timestamp}&id=${randomId}`;
  
  console.log('Открываем каталог по URL:', catalogUrl);
  
  // Отправляем inline-кнопку с веб-приложением
  bot.sendMessage(
    chatId,
    '🌺 Каталог цветов готов к просмотру!\n\nНажмите кнопку ниже, чтобы открыть каталог:',
    {
      reply_markup: {
        inline_keyboard: [[
          { text: '🌸 Открыть каталог цветов', web_app: { url: catalogUrl } }
        ]]
      }
    }
  );
});

// Обработчик для кнопки "Связаться с нами"
bot.onText(/📞 Связаться с нами/, (msg) => {
  const chatId = msg.chat.id;
  
  bot.sendMessage(
    chatId,
    'Вы можете связаться с нами по телефону: +7 (XXX) XXX-XX-XX\n\nИли написать нам на email: flowers@example.com'
  );
});

// Обработчик данных, полученных из веб-приложения
bot.on('web_app_data', (msg) => {
  const chatId = msg.chat.id;
  const data = msg.web_app_data.data;
  
  try {
    // Предполагаем, что данные приходят в формате JSON
    const parsedData = JSON.parse(data);
    
    // Здесь будет логика обработки данных из веб-приложения
    // Например, добавление товаров в корзину
    
    bot.sendMessage(
      chatId,
      `Данные получены: ${JSON.stringify(parsedData, null, 2)}`
    );
  } catch (error) {
    bot.sendMessage(
      chatId,
      'Произошла ошибка при обработке данных из веб-приложения.'
    );
    console.error('Error parsing web app data:', error);
  }
});

// Логирование всех входящих сообщений (в конце, чтобы не мешать другим обработчикам)
bot.on('message', (msg) => {
  console.log('=== ВХОДЯЩЕЕ СООБЩЕНИЕ ===');
  console.log('Текст:', msg.text);
  console.log('Тип:', msg.chat.type);
  console.log('ID чата:', msg.chat.id);
  console.log('Пользователь:', msg.from.username || msg.from.first_name);
  console.log('========================');
  
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  // Проверяем, ожидаем ли мы номер телефона от этого пользователя
  const userState = userPhones.get(userId);
  if (userState && userState.waitingForPhone && msg.text && !msg.text.startsWith('/')) {
    const phoneText = msg.text.trim();
    
    // Простая валидация номера телефона
    const phoneRegex = /^(\+7|8|7)?[\s\-\(\)]?(\d{3})[\s\-\(\)]?(\d{3})[\s\-]?(\d{2})[\s\-]?(\d{2})$/;
    
    if (phoneRegex.test(phoneText)) {
      // Нормализуем номер телефона
      const cleanPhone = phoneText.replace(/\D/g, '');
      const normalizedPhone = cleanPhone.startsWith('8') ? '7' + cleanPhone.slice(1) : 
                             cleanPhone.startsWith('7') ? cleanPhone : '7' + cleanPhone;
      
      // Сохраняем номер телефона
      userPhones.set(userId, { 
        phone: normalizedPhone,
        waitingForPhone: false,
        registeredAt: new Date().toISOString()
      });
      
      bot.sendMessage(
        chatId,
        `✅ Номер телефона успешно зарегистрирован: +${normalizedPhone}\n\n` +
        '🎉 Теперь при оформлении заказов на сайте указывайте этот номер, ' +
        'и вы сможете просматривать все свои заказы командой /myorders\n\n' +
        '💡 Также заказы будут отображаться в кнопке "🛒 Моя корзина"',
        {
          reply_markup: {
            keyboard: [
              [{ text: '🌺 Каталог', web_app: { url: webAppUrl } }],
              [{ text: '🛒 Моя корзина' }, { text: '📞 Связаться с нами' }]
            ],
            resize_keyboard: true,
            persistent: true
          }
        }
      );
      return;
    } else {
      bot.sendMessage(
        chatId,
        '❌ Неверный формат номера телефона.\n\n' +
        'Пожалуйста, введите номер в формате:\n' +
        '+7 (999) 123-45-67\n' +
        '89991234567\n' +
        '79991234567\n\n' +
        'Попробуйте еще раз:'
      );
      return;
    }
  }
  
  // Игнорируем сообщения, которые уже обработаны другими обработчиками
  if (
    msg.text && (
      msg.text.startsWith('/') ||
      msg.text === '🛒 Моя корзина' ||
      msg.text === '📞 Связаться с нами' ||
      msg.text === '🔄 Обновить' ||
      msg.text.includes('Каталог цветов') ||
      /^(refresh|рефреш|обновить|clear|очистить|клир|newurl|новая ссылка|новый урл)$/i.test(msg.text)
    ) ||
    msg.web_app_data
  ) {
    return;
  }

  // Отвечаем на все остальные сообщения
  bot.sendMessage(
    chatId,
    'Извините, я не понимаю эту команду. Пожалуйста, используйте кнопки меню или команды:\n\n/start - Главное меню\n/clear - Очистить кэш\n/newurl - Новая ссылка'
  );
});

// Запускаем бота
console.log('Бот запущен и ожидает сообщений...');

// Инициализируем настройки бота после небольшой задержки
setTimeout(async () => {
  await clearWebhookAndRefresh();
}, 1000);