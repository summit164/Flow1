import { google } from 'googleapis';

// Конфигурация Google Sheets
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
let SHEET_NAME = 'Orders'; // Название листа в таблице (по умолчанию)



// Настройка аутентификации
// Подготовим ключ: поддерживаем GOOGLE_PRIVATE_KEY и GOOGLE_PRIVATE_KEY_B64
const rawKey = process.env.GOOGLE_PRIVATE_KEY_B64
  ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
  : (process.env.GOOGLE_PRIVATE_KEY || '');

const normalizedPrivateKey = rawKey
  .replace(/\\n/g, '\n')    // однострочный JSON -> реальные переводы строк
  .replace(/\r/g, '')         // убрать CR
  .replace(/^['"]|['"]$/g, '') // убрать случайные кавычки вокруг
  .trim();

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: normalizedPrivateKey,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.GOOGLE_CLIENT_EMAIL}`,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderData } = req.body;

    if (!orderData) {
      return res.status(400).json({ error: 'Order data is required' });
    }

    // Проверяем наличие необходимых переменных окружения
    if (!SPREADSHEET_ID) {
      console.error('GOOGLE_SPREADSHEET_ID not configured');
      return res.status(500).json({ error: 'Google Sheets not configured' });
    }

    // Получаем информацию о таблице и листах
    try {
      const spreadsheetInfo = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
      });
      
      const availableSheets = spreadsheetInfo.data.sheets.map(sheet => sheet.properties.title);
      console.log('Available sheets:', availableSheets);
      
      // Если лист "Orders" не существует, используем первый доступный лист
      if (!availableSheets.includes(SHEET_NAME)) {
        SHEET_NAME = availableSheets[0];
        console.log(`Sheet "Orders" not found, using "${SHEET_NAME}" instead`);
      }
    } catch (error) {
      console.error('Error getting spreadsheet info:', error);
      return res.status(500).json({ error: 'Failed to access Google Sheets' });
    }

    // Форматируем данные для записи в таблицу
    const timestamp = new Date(orderData.timestamp).toLocaleString('ru-RU', {
      timeZone: 'Europe/Moscow',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const items = orderData.items.map(item => 
      `${item.flower.name} x${item.quantity} (${item.flower.price}₽)`
    ).join('; ');

    // Убеждаемся, что все строки правильно кодированы в UTF-8
    const rowData = [
      timestamp,                    // Время заказа
      String(orderData.userId || ''),            // ID пользователя
      String(orderData.phoneNumber || ''), // Номер телефона
      String(items || ''),                       // Товары
      `${orderData.total || 0}₽`,       // Общая сумма
      String(orderData.address || ''),     // Адрес доставки
      String(orderData.status || 'новый')  // Статус заказа
    ];

    console.log('Sending row data to Google Sheets:', rowData);

    // Записываем данные в таблицу
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'USER_ENTERED', // Изменено с RAW на USER_ENTERED для лучшей обработки UTF-8
      resource: {
        values: [rowData],
      },
    });

    console.log('Order logged to Google Sheets:', orderData.userId);
    res.status(200).json({ success: true, message: 'Order logged successfully' });

  } catch (error) {
    console.error('Error logging to Google Sheets:', error);
    
    // Возвращаем успех даже при ошибке, чтобы не блокировать основной процесс заказа
    res.status(200).json({ 
      success: false, 
      message: 'Order processed but logging failed',
      error: error.message 
    });
  }
}