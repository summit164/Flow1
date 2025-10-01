# 🌸 Flower Shop Application

Полнофункциональное веб-приложение для цветочного магазина с интеграцией Google Sheets и Telegram бота.

## 🚀 Возможности

### Frontend (Next.js)
- 🛒 Интерактивная корзина покупок
- 📱 Адаптивный дизайн
- ✨ Современный UI/UX
- 🔄 Автоматическое обновление корзины
- 📋 Форма оформления заказа

### Backend (Node.js)
- 🔌 RESTful API для обработки заказов
- 📊 Интеграция с Google Sheets для логирования заказов
- 🤖 Telegram бот для уведомлений
- 💾 Сохранение заказов в JSON файлы
- 🔒 Обработка переменных окружения

### Интеграции
- **Google Sheets**: Автоматическое логирование всех заказов
- **Telegram Bot**: Уведомления о новых заказах
- **CORS**: Настроенная поддержка кросс-доменных запросов

## 📁 Структура проекта

```
├── frontend/          # Next.js приложение
│   ├── src/
│   │   ├── components/    # React компоненты
│   │   ├── pages/         # Страницы приложения
│   │   └── lib/           # Утилиты и хелперы
│   └── package.json
├── backend/           # Node.js API сервер
│   ├── api/
│   │   └── server.js      # Основной сервер
│   ├── orders/            # Сохраненные заказы
│   ├── telegram_bot/      # Telegram бот
│   └── package.json
└── README.md
```

## 🛠️ Установка и запуск

### Предварительные требования
- Node.js (версия 16 или выше)
- npm или yarn
- Google Sheets API credentials
- Telegram Bot Token

### 1. Клонирование репозитория
```bash
git clone https://github.com/summit164/Flow1.git
cd Flow1
```

### 2. Настройка Backend
```bash
cd backend
npm install

# Создайте .env файл с переменными окружения:
# GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id
# GOOGLE_SHEETS_CREDENTIALS=your_service_account_credentials
# TELEGRAM_BOT_TOKEN=your_bot_token
# TELEGRAM_CHAT_ID=your_chat_id

npm start
```

### 3. Настройка Frontend
```bash
cd frontend
npm install
npm run dev
```

### 4. Доступ к приложению
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## 🔧 Конфигурация

### Google Sheets
1. Создайте Google Sheets документ
2. Получите Service Account credentials
3. Добавьте credentials в переменные окружения

### Telegram Bot
1. Создайте бота через @BotFather
2. Получите токен бота
3. Добавьте токен в переменные окружения

## 📝 API Endpoints

### POST /api/orders
Создание нового заказа

**Тело запроса:**
```json
{
  "items": [
    {
      "id": "1",
      "name": "Роза красная",
      "price": 150,
      "quantity": 2
    }
  ],
  "customerInfo": {
    "phone": "89234663525",
    "telegramId": "704179386",
    "address": "Дом пупучий"
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "orderId": "order_1759319951990",
  "message": "Заказ успешно создан"
}
```

## 🎨 Особенности UI

### Корзина
- Sticky кнопка "Оформить заказ" всегда видна
- Автоматический подсчет общей суммы
- Возможность изменения количества товаров
- Очистка корзины одним кликом

### Адаптивность
- Оптимизировано для мобильных устройств
- Поддержка различных размеров экранов
- Современные CSS Grid и Flexbox

## 🔄 Последние обновления

- ✅ Исправлена видимость кнопки заказа в корзине
- ✅ Улучшена прокрутка в корзине
- ✅ Добавлена интеграция с Google Sheets
- ✅ Настроен Telegram бот для уведомлений
- ✅ Очищены debug логи для продакшена

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit изменения (`git commit -m 'Add some AmazingFeature'`)
4. Push в branch (`git push origin feature/AmazingFeature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект распространяется под лицензией MIT. См. файл `LICENSE` для подробностей.

## 📞 Контакты

Если у вас есть вопросы или предложения, создайте issue в репозитории.

---

Сделано с ❤️ для цветочного бизнеса