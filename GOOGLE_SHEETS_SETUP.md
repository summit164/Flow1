# Настройка Google Sheets для логирования заказов

## Шаг 1: Создание проекта в Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Sheets API:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Google Sheets API" и включите его

## Шаг 2: Создание Service Account

1. Перейдите в "APIs & Services" > "Credentials"
2. Нажмите "Create Credentials" > "Service Account"
3. Заполните информацию о Service Account
4. После создания, нажмите на созданный Service Account
5. Перейдите на вкладку "Keys"
6. Нажмите "Add Key" > "Create new key" > "JSON"
7. Скачайте JSON файл с ключами

## Шаг 3: Создание Google Таблицы

1. Создайте новую [Google Таблицу](https://sheets.google.com)
2. Назовите лист "Orders" (или измените название в коде)
3. Добавьте заголовки в первую строку:
   - A1: Время заказа
   - B1: ID пользователя
   - C1: Номер телефона
   - D1: Товары
   - E1: Сумма
   - F1: Адрес
   - G1: Статус
4. Поделитесь таблицей с email Service Account (из JSON файла)
   - Нажмите "Share" в правом верхнем углу
   - Добавьте email Service Account с правами "Editor"

## Шаг 4: Настройка переменных окружения

1. Скопируйте `.env.local.example` в `.env.local`
2. Заполните переменные данными из JSON файла:

```env
GOOGLE_SPREADSHEET_ID=ваш_id_таблицы_из_url
GOOGLE_PROJECT_ID=значение_project_id_из_json
GOOGLE_PRIVATE_KEY_ID=значение_private_key_id_из_json
GOOGLE_PRIVATE_KEY="значение_private_key_из_json_с_переносами_строк"
GOOGLE_CLIENT_EMAIL=значение_client_email_из_json
GOOGLE_CLIENT_ID=значение_client_id_из_json
```

## Получение ID таблицы

ID таблицы находится в URL между `/d/` и `/edit`:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

## Проверка работы

После настройки переменных окружения:
1. Перезапустите сервер разработки
2. Сделайте тестовый заказ на сайте
3. Проверьте, что данные появились в Google Таблице

## Устранение неполадок

- Убедитесь, что Service Account имеет доступ к таблице
- Проверьте правильность всех переменных окружения
- Убедитесь, что Google Sheets API включен в проекте
- Проверьте логи сервера на наличие ошибок