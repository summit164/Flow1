const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔐 Генерация самоподписанного SSL сертификата...');

try {
  // Создаем директорию для сертификатов
  const certDir = path.join(__dirname, 'certs');
  if (!fs.existsSync(certDir)) {
    fs.mkdirSync(certDir);
  }

  // Генерируем приватный ключ
  execSync(`openssl genrsa -out ${path.join(certDir, 'key.pem')} 2048`, { stdio: 'inherit' });
  
  // Генерируем сертификат
  execSync(`openssl req -new -x509 -key ${path.join(certDir, 'key.pem')} -out ${path.join(certDir, 'cert.pem')} -days 365 -subj "/C=RU/ST=State/L=City/O=Organization/CN=192.168.1.6"`, { stdio: 'inherit' });
  
  console.log('✅ SSL сертификат создан успешно!');
  console.log('📁 Файлы сохранены в:', certDir);
  
} catch (error) {
  console.error('❌ Ошибка при создании сертификата:', error.message);
  console.log('💡 Попробуйте установить OpenSSL или используйте альтернативный метод');
}