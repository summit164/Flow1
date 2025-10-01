# 🌸 Flower Shop - Полная настройка проекта

Этот документ описывает новую архитектуру проекта с разделенными frontend и backend компонентами.

## 📁 Структура проекта

```
d:\Проекты в Trae/
├── frontend/                   # Next.js приложение
│   ├── src/
│   │   ├── app/               # App Router (Next.js 13+)
│   │   ├── components/        # React компоненты
│   │   ├── lib/              # Утилиты и библиотеки
│   │   └── pages/            # Страницы (если используется)
│   ├── public/               # Статические файлы
│   ├── package.json
│   └── next.config.ts
│
└── backend/                   # Централизованный backend
    ├── api/                  # Express API сервер
    ├── telegram_bot/         # Telegram бот
    ├── orders/              # Хранилище заказов
    ├── config/              # Конфигурация
    ├── package.json
    └── README.md
```

## 🚀 Быстрый старт

### 1. Запуск Backend (обязательно первым!)

```bash
# Переход в backend папку
cd "d:\Проекты в Trae\backend"

# Установка зависимостей
npm install

# Запуск API сервера
npm run dev
```

Backend будет доступен на: `http://localhost:3001`

### 2. Запуск Frontend

```bash
# Переход в frontend папку
cd "d:\Проекты в Trae\frontend"

# Установка зависимостей (если еще не установлены)
npm install

# Запуск development сервера
npm run dev
```

Frontend будет доступен на: `http://localhost:3000`

## 🔗 Взаимодействие Frontend ↔ Backend

### API Endpoints для Frontend:

```javascript
// Получение всех заказов
fetch('http://localhost:3001/api/orders')

// Создание нового заказа
fetch('http://localhost:3001/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customerName: 'Иван Иванов',
    phone: '+7 (999) 123-45-67',
    bouquetType: 'Романтический букет',
    price: 2500
  })
})
```

## 🤖 Telegram Bot (опционально)

```bash
# Переход в backend папку
cd "d:\Проекты в Trae\backend"

# Настройка .env файла с токеном бота
# TELEGRAM_BOT_TOKEN=your_token_here

# Запуск бота
npm run bot
```

## 🛠️ Разработка

### Добавление новых API маршрутов:

1. Откройте `d:\Проекты в Trae\backend\api\server.js`
2. Добавьте новый маршрут:

```javascript
app.get('/api/new-endpoint', (req, res) => {
  res.json({ message: 'New endpoint' });
});
```

### Добавление новых React компонентов:

1. Создайте файл в `d:\Проекты в Trae\frontend\src\components\`
2. Импортируйте в нужную страницу

### Работа с заказами:

- Все заказы автоматически сохраняются в `d:\Проекты в Trae\backend\orders\`
- Индивидуальные файлы: `order_timestamp.json`
- Сводный файл: `all_orders.json`

## 🔧 Полезные команды

### Backend:
```bash
npm start          # Запуск в production
npm run dev        # Запуск с автоперезагрузкой
npm run bot        # Запуск Telegram бота
npm run https      # Запуск HTTPS сервера
npm run cert       # Генерация SSL сертификатов
```

### Frontend:
```bash
npm run dev        # Development сервер
npm run build      # Сборка для production
npm run start      # Запуск production сборки
npm run lint       # Проверка кода
```

## 📝 Важные изменения

### ✅ Что изменилось:
- Backend полностью вынесен в отдельную папку
- API теперь работает на порту 3001
- Все backend файлы централизованы
- Добавлена поддержка CORS для связи frontend ↔ backend

### ⚠️ Что нужно обновить в коде:

Если в frontend есть прямые импорты backend файлов, замените их на API вызовы:

```javascript
// СТАРЫЙ способ (больше не работает):
import { saveOrder } from '../api/orders/route'

// НОВЫЙ способ:
const response = await fetch('http://localhost:3001/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

## 🚨 Устранение проблем

### Backend не запускается:
1. Проверьте, что порт 3001 свободен
2. Убедитесь, что установлены зависимости: `npm install`
3. Проверьте файл `.env` с настройками

### Frontend не может подключиться к Backend:
1. Убедитесь, что backend запущен на порту 3001
2. Проверьте CORS настройки в `backend/api/server.js`
3. Убедитесь, что используете правильный URL: `http://localhost:3001`

### Telegram бот не работает:
1. Проверьте токен в `.env` файле
2. Убедитесь, что бот создан через @BotFather
3. Проверьте интернет соединение

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи в консоли backend и frontend
2. Убедитесь, что оба сервера запущены
3. Проверьте правильность API endpoints
4. Обратитесь к документации в `backend/README.md`

---

**Теперь все backend компоненты централизованы и готовы для дальнейшей разработки! 🎉**