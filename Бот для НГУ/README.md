# План разработки: Бот для НГУ и мини‑приложение

Цель: создать Telegram‑бота и мини‑приложение (Telegram Web App) с платформой для студентов, где можно:
- зарегистрироваться как Хелпер (ввод персональных данных);
- подать заявку на помощь (курс, предмет, условие/описание, дедлайн и пр.).

## Технологический стек
- Backend: `Next.js` (App Router) с API‑роутами на Node.js
- БД: `SQLite` (через ORM `Prisma`)
- UI: `Next.js` + `TypeScript` + `Tailwind` (или другой CSS подход)
- Telegram Bot: `grammY` или `node-telegram-bot-api` (Webhook через Next.js API)
- Dev‑инструменты: `ngrok` для вебхуков локально, `dotenv` для переменных окружения

## Архитектура (высокоуровнево)
- `apps/web` (Next.js):
  - страницы мини‑приложения: регистрация Хелпера, заявка на помощь, кабинет
  - API роуты: CRUD для хелперов и заявок, вебхук бота
- `apps/bot` (бот‑логика): команды `/start`, открытие WebApp, ответы на базовые запросы
- `data/db.sqlite`: файл базы данных SQLite
- Интеграция Telegram WebApp: авторизация пользователя через `initData` и верификацию подписи

## Модель данных (SQLite)
Предварительная схема таблиц (упрощённо):

### helpers
- `id` (PK, int)
- `telegram_id` (string, unique)
- `name` (string)
- `faculty` (string)
- `course` (int)
- `subjects` (json/text)
- `contact` (string) — username, телефон или другой канал
- `created_at` (datetime)

### help_requests
- `id` (PK, int)
- `requester_telegram_id` (string)
- `course` (int)
- `subject` (string)
- `description` (text)
- `deadline` (datetime, nullable)
- `status` (string: `new|assigned|in_progress|done|canceled`)
- `helper_id` (int, FK helpers.id, nullable)
- `created_at` (datetime)
- `updated_at` (datetime)

При необходимости можно добавить таблицы: `skills`, `attachments`, `messages` (для переписки).

## API (черновой план)
- `POST /api/helpers` — создать хелпера
- `GET /api/helpers/:id` — получить хелпера
- `PATCH /api/helpers/:id` — обновить данные
- `POST /api/requests` — создать заявку
- `GET /api/requests` — список/фильтрация заявок
- `PATCH /api/requests/:id` — обновить статус/назначить хелпера
- `POST /api/telegram/webhook` — входящие апдейты от Telegram (бот)

## UI (Next.js, Telegram Web App)
- `Регистрация Хелпера` — форма ввода: имя, факультет, курс, предметы, контакты
- `Заявка на помощь` — форма: курс, предмет, описание/условие, дедлайн
- `Кабинет` — профиль хелпера, список заявок, статус, базовые фильтры
- Авторизация внутри Mini App: проверка `Telegram.WebApp.initData` на сервере
- Минимальная адаптация для мобильных (Telegram)

## Безопасность и авторизация
- Верификация `initData` мини‑приложения согласно документации Telegram Web Apps
- Минимальная авторизация по Telegram ID (для MVP)
- Rate limiting на API (на уровне middleware)

## Переменные окружения
- `TELEGRAM_BOT_TOKEN` — токен бота
- `WEBAPP_URL` — URL мини‑приложения (например `http://localhost:3000`)
- `DATABASE_URL` — `file:./data/db.sqlite`
- `TELEGRAM_WEBHOOK_URL` — публичный URL вебхука (через ngrok при разработке)

## Пошаговый план работ
1. Инициализация проекта
   - Создать монорепо или одну Next.js‑аппку: `npm create next-app`
   - Настроить TypeScript, ESLint, Tailwind (по желанию)
   - Добавить `prisma`, `@prisma/client`, `sqlite3`
2. Настройка БД
   - Создать `prisma/schema.prisma` с таблицами `helpers`, `help_requests`
   - `npx prisma migrate dev` и `npx prisma generate`
3. Базовые API роуты
   - `POST /api/helpers` и `POST /api/requests`
   - `GET /api/requests` с фильтрами (курс, предмет, статус)
4. UI мини‑приложения
   - Страницы и формы: регистрация хелпера, создание заявки
   - Валидация форм, UX для мобильных
5. Интеграция Telegram
   - Поднять бот: `grammY` или `node-telegram-bot-api`
   - Команда `/start` с кнопкой `web_app` на `WEBAPP_URL`
   - Вебхук: `POST /api/telegram/webhook`; локально — через `ngrok`
   - Верификация `initData` и привязка `telegram_id`
6. Кабинет и базовые сценарии
   - Просмотр заявок, изменение статусов, назначение хелпера
7. Тестирование и полировка
   - Юнит‑тесты на API, проверка валидации
   - QA мини‑приложения внутри Telegram

## Локальная разработка (черновые команды)
```bash
# Next.js
npm install
npm run dev

# Prisma
npx prisma migrate dev
npx prisma studio

# ngrok (пример)
ngrok http 3000  # взять публичный https URL и настроить вебхук бота
```

## Деплой (варианты)
- Vercel для фронта и API (если вебхуки подходят)
- Либо отдельный Node сервер (Render/Fly/Heroku) для стабильных вебхуков

## Вехи (MVP → расширение)
1. MVP (1–2 недели)
   - БД, базовые API, формы регистрации/заявки, интеграция бота и Mini App
2. Расширение
   - Фильтры/поиск, уведомления, базовая модерация, аналитика
3. production
   - Логирование, мониторинг, защита от спама, бэкапы SQLite

---

Следующий шаг: инициализировать Next.js проект, добавить Prisma и набросать `schema.prisma` с таблицами `helpers` и `help_requests`, затем сделать формы и подключить бота с вебхуком через `ngrok`.