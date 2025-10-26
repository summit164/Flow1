const express = require('express');
const { Api } = require('grammy');
const router = express.Router();

const token = process.env.TELEGRAM_BOT_TOKEN;
const groupId = process.env.TELEGRAM_HELPERS_GROUP_ID; // пример: -1001234567890
const api = token ? new Api(token) : null;

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

router.post('/', async (req, res) => {
  const { helperId, studentName, contact, message, subject, grade, course } = req.body || {};
  if (!helperId || !studentName || !contact) {
    return res.status(400).json({ error: 'Required fields: helperId, studentName, contact' });
  }
  const order = {
    id: Date.now(),
    helperId,
    studentName,
    contact,
    subject: subject || '',
    grade: grade || '',
    course: course || '',
    message: message || '',
    createdAt: new Date().toISOString(),
  };

  // Сформируем текст заявки для Telegram (HTML)
  const text = [
    '<b>Новая заявка</b>',
    `Хелпер: <code>${escapeHtml(helperId)}</code>`,
    `Студент: <b>${escapeHtml(studentName)}</b>`,
    `Контакт: ${escapeHtml(contact)}`,
    subject ? `Предмет: ${escapeHtml(subject)}` : null,
    grade ? `Класс/курс: ${escapeHtml(grade || course)}` : (course ? `Курс: ${escapeHtml(course)}` : null),
    order.message ? `Комментарий: ${escapeHtml(order.message)}` : null,
    `Время: ${escapeHtml(order.createdAt)}`,
  ].filter(Boolean).join('\n');

  // Отправка в Telegram‑группу, если настроено
  if (!api || !groupId) {
    return res.status(201).json({ status: 'created', order, forwarded: false, reason: 'Telegram not configured' });
  }

  try {
    await api.sendMessage(groupId, text, { parse_mode: 'HTML' });
    return res.status(201).json({ status: 'created', order, forwarded: true });
  } catch (err) {
    console.error('Failed to send to Telegram:', err?.message || err);
    return res.status(201).json({ status: 'created', order, forwarded: false, error: 'telegram_send_failed' });
  }
});

module.exports = router;