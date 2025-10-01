import { google } from 'googleapis';

// Конфигурация Google Sheets
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
let SHEET_NAME = 'Orders'; // Название листа в таблице (по умолчанию)

// Настройка аутентификации
const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
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
      `${item.name} x${item.quantity} (${item.price}₽)`
    ).join('; ');

    const rowData = [
      timestamp,                    // Время заказа
      orderData.userId,            // ID пользователя
      orderData.phoneNumber || '', // Номер телефона
      items,                       // Товары
      `${orderData.total}₽`,       // Общая сумма
      orderData.address || '',     // Адрес доставки
      orderData.status || 'новый'  // Статус заказа
    ];

    // Записываем данные в таблицу
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:G`,
      valueInputOption: 'RAW',
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