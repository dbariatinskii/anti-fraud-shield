#!/usr/bin/env node

/**
 * CLI для запуска Anti-Fraud Shield.
 *
 * Команды:
 *   npx anti-fraud-shield          — HTTP-сервер на localhost:3000
 *   npx anti-fraud-shield --port   — сервер на указанном порту
 *   npx anti-fraud-shield --static — генерация single HTML
 *   npx anti-fraud-shield --help   — справка
 */

import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import serveHandler from 'serve-handler';
import open from 'open';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const STATIC_DIR = resolve(ROOT_DIR, 'static');
const DIST_SINGLE_DIR = resolve(ROOT_DIR, 'dist-single');

// === Парсинг аргументов ===
const args = process.argv.slice(2);
const helpFlag = args.includes('--help') || args.includes('-h');
const staticFlag = args.includes('--static');
const portIdx = args.indexOf('--port');
const port = portIdx >= 0 ? parseInt(args[portIdx + 1], 10) : 3000;

// === Справка ===
if (helpFlag) {
  console.log(`
Anti-Fraud Shield — браузерная мини-игра

Использование:
  npx anti-fraud-shield              Запуск HTTP-сервера (порт 3000)
  npx anti-fraud-shield --port 8080  Запуск на указанном порту
  npx anti-fraud-shield --static     Генерация single HTML файла
  npx anti-fraud-shield --help       Показать справку
`);
  process.exit(0);
}

// === Режим: Single HTML ===
if (staticFlag) {
  console.log('📦 Генерация single HTML...');

  try {
    // Проверяем что static/ существует
    if (!existsSync(STATIC_DIR)) {
      console.log('  → Сборка проекта...');
      execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
    }

    // Запускаем генератор
    execSync('node bin/build-static.mjs', { cwd: ROOT_DIR, stdio: 'inherit' });

    const htmlPath = resolve(DIST_SINGLE_DIR, 'anti-fraud-shield.html');
    if (existsSync(htmlPath)) {
      console.log(`✅ Файл создан: ${htmlPath}`);
      open(htmlPath);
    } else {
      console.error('❌ Ошибка генерации single HTML');
      process.exit(1);
    }
  } catch {
    console.error('❌ Ошибка при генерации single HTML');
    process.exit(1);
  }
  process.exit(0);
}

// === Режим: HTTP-сервер ===
// Проверяем наличие static/
if (!existsSync(STATIC_DIR)) {
  console.log('📦 Директория static/ не найдена. Запускаю сборку...');
  try {
    execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch {
    console.error('❌ Сборка не удалась');
    process.exit(1);
  }
}

// Ищем свободный порт (максимум 100 попыток)
function findFreePort(startPort, attempts = 0) {
  const MAX_ATTEMPTS = 100;
  if (attempts >= MAX_ATTEMPTS) {
    throw new Error(`Не удалось найти свободный порт после ${MAX_ATTEMPTS} попыток`);
  }
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const { port: freePort } = server.address();
      server.close(() => resolve(freePort));
    });
    server.on('error', () => {
      // Порт занят, пробуем следующий
      findFreePort(startPort + 1, attempts + 1).then(resolve).catch(reject);
    });
  });
}

// Запускаем сервер
async function startServer() {
  const actualPort = await findFreePort(port);

  const server = createServer((req, res) => {
    return serveHandler(req, res, {
      public: STATIC_DIR,
      headers: [
        {
          source: '**/*',
          headers: [
            { key: 'Cache-Control', value: 'no-cache' },
          ],
        },
      ],
    });
  });

  server.listen(actualPort, () => {
    const url = `http://localhost:${actualPort}`;
    console.log(`🛡️  Anti-Fraud Shield запущен: ${url}`);
    console.log('Нажмите Ctrl+C для остановки');
    open(url);
  });

  // Обработка остановки
  process.on('SIGINT', () => {
    console.log('\n👋 Остановка сервера...');
    server.close(() => process.exit(0));
  });
}

startServer();
