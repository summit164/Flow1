# 🌸 Flower Shop Backend

Централизованный backend для интернет-магазина цветов с полной архитектурой API, Telegram ботом и интеграцией с Google Sheets.

## 📁 Структура проекта

### 📂 api/
- `server.js` - Основной Express сервер с API маршрутами
- `orders/route.ts` - API маршруты для обработки заказов (legacy)
- `sheets.js` - Интеграция с Google Sheets

### 📂 telegram_bot/
- `bot.js` - Основной файл Telegram бота
- `debug_bot.js` - Отладочная версия бота
- `test_bot.js` - Тестовая версия бота
- `package.json` - Зависимости для бота
- `.env.example` - Пример конфигурации

### 📂 orders/
- `all_orders.json` - Сводный файл всех заказов
- Индивидуальные файлы заказов (автоматически создаются)

### 📂 config/
- `https-server.js` - HTTPS сервер
- `generate-cert.js` - Генерация SSL сертификатов
- `GOOGLE_SHEETS_SETUP.md` - Настройка Google Sheets

## 🚀 Технологии

- **Node.js** (>=16.0.0) - Серверная платформа
- **Express.js** - Web фреймворк для API
- **Telegram Bot API** - Интеграция с Telegram
- **Google Sheets API** - Работа с таблицами
- **CORS** - Поддержка кросс-доменных запросов
- **HTTPS** - Безопасное соединение

## 🛠️ Установка и настройка

### 1. Установка зависимостей
```bash
# Основные зависимости backend
npm install

# Зависимости для Telegram бота (если нужно запускать отдельно)
npm run install:bot
```

### 2. Настройка переменных окружения
Создайте файл `.env` в корне backend папки:
```env
# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# API Settings
PORT=3001
NODE_ENV=development

# Google Sheets (если используется)
GOOGLE_SHEETS_ID=your_sheets_id
GOOGLE_CLIENT_EMAIL=your_client_email
GOOGLE_PRIVATE_KEY=your_private_key
```

## 📋 Команды запуска

### 🌐 API Server (Основной)
```bash
# Запуск в production режиме
npm start

# Запуск в development режиме с автоперезагрузкой
npm run dev
```
API будет доступен по адресу: `http://localhost:3001`

### 🤖 Telegram Bot
```bash
# Запуск основного бота
npm run bot

# Запуск бота в development режиме
npm run bot:dev
```

### 🔒 HTTPS Server
```bash
# Генерация SSL сертификатов
npm run cert

# Запуск HTTPS сервера
npm run https
```

## 🔗 API Endpoints

### Основные маршруты:
- `GET /` - Информация о API
- `GET /health` - Проверка состояния сервера
- `GET /api/orders` - Получить все заказы
- `POST /api/orders` - Создать новый заказ
- `GET /api/sheets` - Интеграция с Google Sheets

### Пример запроса создания заказа:
```javascript
POST /api/orders
Content-Type: application/json

{
  "customerName": "Иван Иванов",
  "phone": "+7 (999) 123-45-67",
  "bouquetType": "Романтический букет",
  "price": 2500,
  "deliveryAddress": "ул. Цветочная, 15"
}
```

## 🔄 Интеграция с Frontend

Backend настроен для работы с frontend на `http://localhost:3000` с поддержкой CORS.

Все API запросы из frontend должны направляться на `http://localhost:3001/api/`

## 📝 Логирование

Все операции логируются в консоль. В production рекомендуется настроить файловое логирование.

## 🔧 Разработка

### Структура для новых функций:
1. **API маршруты** → добавлять в `api/server.js`
2. **Telegram функции** → модифицировать файлы в `telegram_bot/`
3. **Конфигурация** → добавлять в `config/`
4. **Данные** → сохранять в `orders/` или создать новые папки

### Рекомендации:
- Используйте ES6 модули (`import/export`)
- Следуйте принципам RESTful API
- Добавляйте обработку ошибок для всех маршрутов
- Документируйте новые endpoints в этом README

## 🚨 Важные замечания

- Все backend файлы теперь централизованы в этой папке
- Frontend больше не содержит backend логики
- Telegram бот может работать независимо от API сервера
- SSL сертификаты генерируются автоматически для HTTPS

## 📞 Поддержка

При возникновении проблем проверьте:
1. Установлены ли все зависимости (`npm install`)
2. Правильно ли настроены переменные окружения
3. Доступны ли порты 3001 (API) и 3000 (Frontend)
4. Корректность токенов для внешних сервисов