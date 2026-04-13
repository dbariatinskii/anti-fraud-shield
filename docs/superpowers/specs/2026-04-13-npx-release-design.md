# Дизайн: Публикация Anti-Fraud Shield через npx + CI/CD

**Дата:** 2026-04-13
**Автор:** Qwen Code
**Статус:** Draft

---

## Цель

Подготовить проект к полноценному релизу:
1. Распространение через `npx anti-fraud-shield` (CLI-сервер по умолчанию, single HTML через `--static`)
2. Публикация на GitHub Package Registry
3. Автоматизация через GitHub Actions (CI + авто-CHANGELOG + publish)
4. Документация (README.md)

---

## 1. CLI-обёртка (`bin/cli.js`)

### Что делает

| Команда | Поведение |
|---------|-----------|
| `npx anti-fraud-shield` | Запускает HTTP-сервер на `localhost:3000`, открывает браузер |
| `npx anti-fraud-shield --port 8080` | Запускает на указанном порту |
| `npx anti-fraud-shield --static` | Генерирует `dist-single/anti-fraud-shield.html` (single-file), открывает |
| `npx anti-fraud-shield --help` | Показывает справку |

### Реализация

- `bin/cli.js` — ES-модуль, парсинг аргументов через нативный `process.argv` (без внешних парсеров)
- Зависимости CLI: `open` (открытие браузера), `serve-handler` (статический сервер)
- Обе зависимости — `devDependencies`, bundled через esbuild в `bin/`
- Перед запуском проверяет наличие `static/`; если нет — запускает `npm run build`
- Сервер ищет свободный порт начиная с 3000

### Скрипт single HTML (`bin/build-static.mjs`)

- Читает `static/index.html` и встраивает все CSS/JS inline
- Генерирует `dist-single/anti-fraud-shield.html`
- Используется при флаге `--static`

---

## 2. Структура npm-пакета

### Что публикуется

```
anti-fraud-shield/
├── bin/cli.js              ← #!/usr/bin/env node
├── bin/build-static.mjs    ← генерация single HTML
├── static/                 ← собранный бандл
├── package.json            ← метаданные
├── README.md               ← документация
├── CHANGELOG.md            ← история версий
└── LICENSE                 ← MIT
```

### Не публикуется

`src/`, `docs/`, `node_modules/`, `dist/`, `.github/`, конфиги (`vite.config.ts`, `tsconfig.json`)

### .npmignore

```
src/
docs/
dist/
.github/
.playwright-mcp/
vite.config.ts
tsconfig.json
tsconfig.*.json
.gitignore
.npmignore
PROJECT-SUMMARY.md
*.tsbuildinfo
```

### package.json (ключевые изменения)

```jsonc
{
  "name": "@<user>/anti-fraud-shield",
  "version": "0.4.0",
  "private": false,             // убираем
  "type": "module",
  "bin": { "anti-fraud-shield": "./bin/cli.js" },
  "files": ["bin/", "static/", "README.md", "CHANGELOG.md", "LICENSE"],
  "repository": "github:<user>/anti-fraud-shield",
  "license": "MIT",
  "engines": { "node": ">=18" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build --outDir static",
    "build:static": "node bin/build-static.mjs",
    "lint": "eslint src/ bin/",
    "size": "size-limit",
    "prepublishOnly": "npm run build"
  }
}
```

---

## 3. README.md

### Структура

1. Заголовок + краткое описание
2. Быстрый старт (одна команда `npx`)
3. Таблица режимов игры
4. Механика (правила, щит, типы карточек)
5. Для разработчиков (клонирование, dev, build)
6. Лицензия

Без скриншотов.

---

## 4. CI/CD (GitHub Actions)

### Файл: `.github/workflows/release.yml`

### Job: CI (каждый push/PR)

1. `npm ci`
2. `npm run lint` (eslint + typecheck встроен в tsc)
3. `npm run build` (сборка в `static/`)
4. `npm run size` (лимит: JS < 60KB gzipped)

### Job: Changelog (при push тега `v*`)

1. `conventional-changelog-cli` — генерация CHANGELOG.md из conventional commits
2. Коммит и пуш обновлённого CHANGELOG

### Job: Publish (при push тега `v*`)

1. `npm ci && npm run build`
2. `npm publish` на GPR (через `@actions/setup-node` с `registry-url`)
3. Создание GitHub Release с тегами и CHANGELOG

### Триггеры

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  push:
    tags: ['v*']
```

### Секреты

- `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` — для GPR

---

## 5. Новые зависимости

| Пакет | Назначение |
|-------|-----------|
| `open` | Открытие браузера из CLI |
| `serve-handler` | Статический HTTP-сервер |
| `esbuild` | Bundling CLI-скриптов в один файл |
| `eslint` | Линтинг (Flat Config, v9+) |
| `size-limit` + `@size-limit/file` | Контроль размера бандла |
| `conventional-changelog-cli` | Авто-CHANGELOG |

Все — `devDependencies`.

---

## 6. Имена пакетов

- **npm name:** `@<user>/anti-fraud-shield` (scoped для GPR)
- **GitHub repo:** `<user>/anti-fraud-shield`
- **Первый релиз:** v0.4.0 (следующий после текущих коммитов)

---

## 7. Порядок создания файлов

1. `bin/cli.js` — CLI-обёртка
2. `bin/build-static.mjs` — генератор single HTML
3. `README.md` — документация
4. `LICENSE` — MIT
5. `.npmignore` — исключение из пакета
6. `package.json` — обновление метаданных
7. `.github/workflows/release.yml` — CI/CD
8. `.gitignore` — добавление `static/`, `dist-single/`
9. `.eslintrc.json` + `eslint.config.js` — конфиг линтера
10. `.size-limit.json` — лимит бандла
