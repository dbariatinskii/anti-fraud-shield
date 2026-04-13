# Anti-Fraud Shield — Релиз через npx + CI/CD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Подготовить проект к публикации на GPR через npx с CLI-обёрткой, CI/CD и документацией.

**Architecture:** CLI-скрипты (bin/) bundled через esbuild в self-contained файлы. `static/` — результат Vite-сборки. GitHub Actions автоматизирует CI, CHANGELOG и публикацию.

**Tech Stack:** Vite, TypeScript, esbuild, serve-handler, open, eslint (Flat Config), size-limit, conventional-changelog-cli

---

## Карта файлов

### Создаются:
- `bin/cli.mjs` — исходник CLI (парсинг аргументов, сервер, static-генератор)
- `bin/build-static.mjs` — генерация single HTML (inline CSS/JS)
- `README.md` — документация
- `LICENSE` — MIT лицензия
- `.npmignore` — исключения из npm-пакета
- `.github/workflows/release.yml` — CI/CD пайплайн
- `eslint.config.js` — Flat Config для eslint
- `.size-limit.json` — лимиты размера бандла

### Модифицируются:
- `package.json` — метаданные, bin, scripts, dependencies
- `.gitignore` — добавить `static/`, `dist-single/`

### Не создаются (решение):
- `bin/src/` поддиректория — CLI достаточно мал, исходник прямо в `bin/`
- Отдельный конфиг для conventional-changelog — используем дефолтный

---

### Task 1: Установить зависимости и обновить package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Установить devDependencies**

```bash
npm install -D open serve-handler esbuild eslint @eslint/js @size-limit/file size-limit conventional-changelog-cli
```

- [ ] **Step 2: Обновить package.json**

Заменить содержимое `package.json`:

```json
{
  "name": "@<GITHUB_USERNAME>/anti-fraud-shield",
  "version": "0.4.0",
  "type": "module",
  "description": "Браузерная мини-игра: симулятор оператора антифрод-мониторинга",
  "bin": {
    "anti-fraud-shield": "./bin/cli.js"
  },
  "files": [
    "bin/",
    "static/",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/<GITHUB_USERNAME>/anti-fraud-shield.git"
  },
  "license": "MIT",
  "engines": {
    "node": ">=18"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build --outDir static",
    "build:cli": "esbuild bin/cli.mjs --bundle --outfile=bin/cli.js --platform=node --format=esm --packages=external --banner:js=\"import { createRequire } from 'module'; const require = createRequire(import.meta.url);\"",
    "build:static": "node bin/build-static.mjs",
    "build:all": "npm run build && npm run build:cli && npm run build:static",
    "lint": "eslint src/ bin/",
    "size": "size-limit",
    "preview": "vite preview",
    "prepublishOnly": "npm run build:all"
  },
  "devDependencies": {
    "typescript": "~5.8.0",
    "vite": "^7.0.0",
    "open": "^10.1.0",
    "serve-handler": "^6.1.6",
    "esbuild": "^0.25.0",
    "eslint": "^9.20.0",
    "@eslint/js": "^9.20.0",
    "@size-limit/file": "^11.2.0",
    "size-limit": "^11.2.0",
    "conventional-changelog-cli": "^5.0.0"
  }
}
```

**Важно:** Заменить `<GITHUB_USERNAME>` на реальный username (из `git remote get-url origin`).

- [ ] **Step 3: Проверить установку**

```bash
npm install
```

Ожидаемый результат: `added X packages` без ошибок.

- [ ] **Step 4: Проверить сборку CLI**

```bash
npm run build:cli
```

Ожидаемый результат: файл `bin/cli.js` создан, без ошибок.

- [ ] **Step 5: Коммит**

```bash
git add package.json package-lock.json bin/cli.js
git commit -m "chore: добавить CLI-зависимости и обновить package.json"
```

---

### Task 2: Создать CLI-обёртку (`bin/cli.mjs`)

**Files:**
- Create: `bin/cli.mjs`

- [ ] **Step 1: Создать `bin/cli.mjs`**

```javascript
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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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

// Ищем свободный порт
function findFreePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(startPort, () => {
      const { port: freePort } = server.address();
      server.close(() => resolve(freePort));
    });
    server.on('error', () => {
      // Порт занят, пробуем следующий
      findFreePort(startPort + 1).then(resolve).catch(reject);
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
```

- [ ] **Step 2: Проверить справку**

```bash
node bin/cli.mjs --help
```

Ожидаемый вывод: текст справки с описанием команд.

- [ ] **Step 3: Коммит**

```bash
git add bin/cli.mjs
git commit -m "feat: создать CLI-обёртку (bin/cli.mjs)"
```

---

### Task 3: Создать генератор single HTML (`bin/build-static.mjs`)

**Files:**
- Create: `bin/build-static.mjs`

- [ ] **Step 1: Создать `bin/build-static.mjs`**

```javascript
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

// Проверяем наличие static/
if (!existsSync(STATIC_DIR)) {
  console.error('❌ Директория static/ не найдена. Запустите: npm run build');
  process.exit(1);
}

// Читаем index.html
const indexPath = resolve(STATIC_DIR, 'index.html');
let html = readFileSync(indexPath, 'utf-8');

// Встраиваем CSS: ищем <link rel="stylesheet" href="/assets/...">
html = html.replace(
  /<link\s+rel="stylesheet"\s+href="\/assets\/([^"]+)"/g,
  (_match, filename) => {
    const cssPath = resolve(STATIC_DIR, 'assets', filename);
    try {
      const css = readFileSync(cssPath, 'utf-8');
      return `<style>\n${css}\n</style>`;
    } catch {
      console.warn(`⚠️  CSS файл не найден: ${cssPath}`);
      return _match;
    }
  }
);

// Встраиваем JS: ищем <script type="module" crossorigin src="/assets/...">
html = html.replace(
  /<script\s+type="module"\s+crossorigin\s+src="\/assets\/([^"]+)"[^>]*><\/script>/g,
  (_match, filename) => {
    const jsPath = resolve(STATIC_DIR, 'assets', filename);
    try {
      const js = readFileSync(jsPath, 'utf-8');
      return `<script>\n${js}\n<\/script>`;
    } catch {
      console.warn(`⚠️  JS файл не найден: ${jsPath}`);
      return _match;
    }
  }
);

// Убираем ссылки на preload/prefetch скрипты
html = html.replace(/<link\s+rel="modulepreload"\s+[^>]+>/g, '');

// Создаём output директорию
mkdirSync(DIST_SINGLE_DIR, { recursive: true });

// Записываем результат
const outputPath = resolve(DIST_SINGLE_DIR, 'anti-fraud-shield.html');
writeFileSync(outputPath, html, 'utf-8');

console.log(`✅ Single HTML создан: ${outputPath}`);
```

- [ ] **Step 2: Предварительно собрать static/**

```bash
npm run build
```

- [ ] **Step 3: Проверить генерацию single HTML**

```bash
npm run build:static
```

Ожидаемый вывод: `✅ Single HTML создан: .../dist-single/anti-fraud-shield.html`

- [ ] **Step 4: Проверить что файл существует и не пустой**

```bash
node -e "const fs=require('fs'); const f='dist-single/anti-fraud-shield.html'; console.log('Размер:', fs.statSync(f).size, 'bytes'); const c=fs.readFileSync(f,'utf-8'); console.log('Содержит <style>:', c.includes('<style>')); console.log('Содержит <script>:', c.includes('<script>')); console.log('Нет <link stylesheet>:', !c.includes('<link rel=\"stylesheet\"'));"
```

Ожидаемый результат: размер > 10KB, содержит `<style>` и `<script>`, нет `<link rel="stylesheet"`.

- [ ] **Step 5: Коммит**

```bash
git add bin/build-static.mjs
git commit -m "feat: создать генератор single HTML (bin/build-static.mjs)"
```

---

### Task 4: Создать документацию (README.md + LICENSE)

**Files:**
- Create: `README.md`
- Create: `LICENSE`

- [ ] **Step 1: Создать README.md**

```markdown
# 🛡️ Anti-Fraud Shield

Браузерная мини-игра: симулятор работы оператора антифрод-мониторинга. Классифицируйте банковские транзакции в реальном времени — блокируйте мошеннические и пропускайте легитимные.

## Быстрый старт

```bash
npx anti-fraud-shield
```

Игра откроется в браузере на `http://localhost:3000`.

### Опции

| Команда | Описание |
|---------|----------|
| `npx anti-fraud-shield --port 8080` | Запуск на указанном порту |
| `npx anti-fraud-shield --static` | Генерация single HTML файла |
| `npx anti-fraud-shield --help` | Справка |

## Режимы игры

| Режим | Описание |
|-------|----------|
| 🏆 Классика | 60 сек, нарастающая сложность, щит, очки, лидерборд |
| 🔰 Обучение | Автодемо → практика → сводка паттернов |
| ⚔️ Дуэль | Hot-seat, best of 3, сравнение результатов |
| 📊 Рекорды | Таблица лучших результатов (localStorage) |

## Механика

- Карточки транзакций падают сверху вниз
- 🛡️ **Щит** — запас безопасности (начинается со 100 HP)
- **Риск-карточки** — блокируй кликом: крупные суммы, ночные операции, неизвестные получатели, множественные платежи
- **Нормальные карточки** — пропускай: бытовые покупки, коммунальные платежи, местные магазины
- Ошибки уменьшают щит. Щит = 0 → игра окончена

### Подсказки

В правом верхнем углу экрана игры есть кнопка 💡. По умолчанию подсказки включены — карточки подсвечиваются цветом (красный = риск, зелёный = норма). Нажмите на кнопку чтобы выключить подсказки — все карточки станут серыми, усложняя игру.

## Для разработчиков

```bash
git clone https://github.com/<GITHUB_USERNAME>/anti-fraud-shield.git
cd anti-fraud-shield
npm install
npm run dev        # dev-сервер с HMR
npm run build      # сборка в static/
npm run lint       # проверка кода
```

## Стек

- TypeScript + Vite
- Canvas API (частицы) + DOM (карточки)
- 0 внешних зависимостей в рантайме игры

## Лицензия

MIT
```

**Важно:** Заменить `<GITHUB_USERNAME>` на реальный username.

- [ ] **Step 2: Создать LICENSE**

```
MIT License

Copyright (c) 2026 Anti-Fraud Shield

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 3: Создать .npmignore**

```
src/
docs/
dist/
.github/
.playwright-mcp/
dist-single/
vite.config.ts
tsconfig.json
tsconfig.*.json
.gitignore
.npmignore
eslint.config.js
.size-limit.json
PROJECT-SUMMARY.md
*.tsbuildinfo
```

- [ ] **Step 4: Коммит**

```bash
git add README.md LICENSE .npmignore
git commit -m "docs: добавить README, LICENSE и .npmignore"
```

---

### Task 5: Настроить eslint

**Files:**
- Create: `eslint.config.js`

- [ ] **Step 1: Создать `eslint.config.js`**

```javascript
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.ts', 'bin/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
];
```

- [ ] **Step 2: Проверить линтинг**

```bash
npm run lint
```

Ожидаемый результат: предупреждения допустимы, критических ошибок нет.

- [ ] **Step 3: Коммит**

```bash
git add eslint.config.js
git commit -m "chore: добавить eslint конфиг"
```

---

### Task 6: Настроить size-limit

**Files:**
- Create: `.size-limit.json`

- [ ] **Step 1: Создать `.size-limit.json`**

```json
[
  {
    "path": "static/assets/*.js",
    "limit": "60 KB",
    "gzip": true
  },
  {
    "path": "static/assets/*.css",
    "limit": "15 KB",
    "gzip": true
  }
]
```

- [ ] **Step 2: Собрать и проверить размер**

```bash
npm run build
npm run size
```

Ожидаемый результат: `Package size limit has not exceeded` для обоих файлов.

- [ ] **Step 3: Коммит**

```bash
git add .size-limit.json
git commit -m "chore: добавить size-limit конфиг"
```

---

### Task 7: Обновить .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Добавить в .gitignore**

Добавить в конец файла `.gitignore`:

```
# Release artifacts
static/
dist-single/
bin/cli.js
```

- [ ] **Step 2: Коммит**

```bash
git add .gitignore
git commit -m "chore: добавить static/ и dist-single/ в .gitignore"
```

---

### Task 8: Создать CI/CD пайплайн

**Files:**
- Create: `.github/workflows/release.yml`

- [ ] **Step 1: Создать `.github/workflows/release.yml`**

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  push:
    tags: ['v*']

jobs:
  # === CI: проверка кода ===
  ci:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build:all

      - name: Check bundle size
        run: npm run size

  # === Changelog: автогенерация при теге ===
  changelog:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    needs: ci
    permissions:
      contents: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Generate CHANGELOG
        run: npx conventional-changelog-cli -p conventionalcommits -i CHANGELOG.md -s

      - name: Commit CHANGELOG
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add CHANGELOG.md
          git commit -m "docs: update CHANGELOG for ${{ github.ref_name }}" || echo "No changes"
          git push

  # === Publish: публикация на GPR ===
  publish:
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    needs: [ci, changelog]
    permissions:
      contents: write
      packages: write
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://npm.pkg.github.com'
          scope: '@<GITHUB_USERNAME>'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build:all

      - name: Publish to GitHub Packages
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Create GitHub Release
        uses: actions/github-script@v7
        with:
          script: |
            const changelog = require('fs').readFileSync('CHANGELOG.md', 'utf-8');
            await github.rest.repos.createRelease({
              owner: context.repo.owner,
              repo: context.repo.repo,
              tag_name: context.ref.replace('refs/tags/', ''),
              name: context.ref.replace('refs/tags/', ''),
              body: changelog,
              draft: false,
              prerelease: false,
            });
```

**Важно:** Заменить `<GITHUB_USERNAME>` на реальный username (в двух местах: в `scope` и нужно убедиться что `name` в package.json совпадает).

- [ ] **Step 2: Коммит**

```bash
git add .github/workflows/release.yml
git commit -m "ci: добавить GitHub Actions пайплайн (CI + CHANGELOG + publish)"
```

---

### Task 9: Финальная проверка — симуляция npm pack

**Files:** проверка

- [ ] **Step 1: Собрать всё**

```bash
npm run build:all
```

- [ ] **Step 2: Создать CHANGELOG.md (пустой для первого раза)**

```bash
echo "# Changelog" > CHANGELOG.md
```

- [ ] **Step 3: Проверить что будет в пакете**

```bash
npm pack --dry-run
```

Ожидаемый вывод: список файлов включающий `bin/cli.js`, `static/`, `README.md`, `LICENSE`, `CHANGELOG.md`.

- [ ] **Step 4: Проверить что CLI работает из пакета**

```bash
node bin/cli.mjs --help
```

Ожидаемый вывод: текст справки.

- [ ] **Step 5: Финальный коммит**

```bash
git status
git add -A
git commit -m "chore: финальная подготовка к релизу v0.4.0"
```

---

### Task 10: Инструкция по публикации (для пользователя)

**Files:** документация

- [ ] **Step 1: Добавить инструкцию в конец README.md**

Добавить секцию перед "Лицензия":

```markdown
## Публикация

Для публикации нового релиза:

```bash
# Обновите версию в package.json
npm version 0.4.0

# Создайте тег и запуште
git push origin main --tags
```

GitHub Actions автоматически:
1. Проверит код (lint + build + size)
2. Сгенерирует CHANGELOG.md
3. Опубликует пакет на GitHub Packages
4. Создаст GitHub Release
```

- [ ] **Step 2: Коммит**

```bash
git add README.md
git commit -m "docs: добавить инструкцию по публикации"
```
