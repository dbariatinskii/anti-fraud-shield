#!/usr/bin/env node

/**
 * Генерирует single HTML из Vite-сборки.
 * Встраивает CSS и JS inline в index.html.
 * Результат: dist-single/anti-fraud-shield.html
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = resolve(__dirname, '..');
const STATIC_DIR = resolve(ROOT_DIR, 'static');
const DIST_SINGLE_DIR = resolve(ROOT_DIR, 'dist-single');

/**
 * Проверить что путь находится внутри базовой директории (защита от path traversal).
 */
function isSafePath(filePath, baseDir) {
  const resolved = resolve(baseDir, filePath);
  return resolved.startsWith(baseDir);
}

try {
  // Проверяем наличие static/
  if (!existsSync(STATIC_DIR)) {
    console.error('❌ Директория static/ не найдена. Запустите: npm run build');
    process.exit(1);
  }

  // Читаем index.html
  const indexPath = resolve(STATIC_DIR, 'index.html');
  let html = readFileSync(indexPath, 'utf-8');

  // Встраиваем CSS: ищем <link ... rel="stylesheet" ... href="..."> (атрибуты в любом порядке, кавычки любые)
  html = html.replace(
    /<link\s[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*>/g,
    (_match, href) => {
      const filename = href.replace(/^\//, '');
      if (!isSafePath(filename, STATIC_DIR)) {
        console.warn(`⚠️  Опасный путь CSS, пропущен: ${href}`);
        return _match;
      }
      const cssPath = resolve(STATIC_DIR, filename);
      try {
        const css = readFileSync(cssPath, 'utf-8');
        return `<style>\n${css}\n</style>`;
      } catch {
        console.warn(`⚠️  CSS файл не найден: ${cssPath}`);
        return _match;
      }
    }
  );

  // Встраиваем JS: ищем <script type="module" ... src="..."> (кавычки любые)
  html = html.replace(
    /<script\s+type=["']module["'][^>]*src=["']([^"']+)["'][^>]*><\/script>/g,
    (_match, src) => {
      const filename = src.replace(/^\//, '');
      if (!isSafePath(filename, STATIC_DIR)) {
        console.warn(`⚠️  Опасный путь JS, пропущен: ${src}`);
        return _match;
      }
      const jsPath = resolve(STATIC_DIR, filename);
      try {
        const js = readFileSync(jsPath, 'utf-8');
        return `<script>\n${js}\n</script>`;
      } catch {
        console.warn(`⚠️  JS файл не найден: ${jsPath}`);
        return _match;
      }
    }
  );

  // Убираем ссылки на preload/prefetch скрипты
  html = html.replace(/<link\s+rel=["']modulepreload["'][^>]+>/g, '');

  // Создаём output директорию
  mkdirSync(DIST_SINGLE_DIR, { recursive: true });

  // Записываем результат
  const outputPath = resolve(DIST_SINGLE_DIR, 'anti-fraud-shield.html');
  writeFileSync(outputPath, html, 'utf-8');

  console.log(`✅ Single HTML создан: ${outputPath}`);
} catch (err) {
  console.error(`❌ Ошибка сборки: ${err.message}`);
  process.exit(1);
}
