# LinkedIn Vacancy Parser & Kanban Board Tracker

Удобный и быстрый инструмент для организации поиска работы: парсинг вакансий с LinkedIn пачками, автоматический сбор информации о компании и технологиях, генерация AI-саммари (Mistral / Gemini) и ведение задач по воронке на Jira-подобной Канбан-доске.

---

## Возможности

- **Пакетный импорт ссылок**: вставляете пачку ссылок LinkedIn (по одной на строку) — система автоматически извлекает название, компанию, локацию/страну, ссылку на компанию и полное описание.
- **Публичный guest-парсер**: извлекает данные напрямую через LinkedIn Guest API/эндпоинты **без необходимости ввода логина/пароля или кук** личного аккаунта LinkedIn (нет риска блокировки).
- **AI-саммари на Mistral или Gemini**:
  - Краткое резюме сути вакансии (что конкретно нужно делать в 2-3 предложениях на русском).
  - Выделенный список ключевых технологий и инструментов.
  - Краткая информация о сфере деятельности компании.
  - Возможность легкого переключения между **Mistral** и **Gemini** (в `.env` или прямо через кнопку настроек в Web UI).
- **Канбан-доска в стиле Jira**:
  - 5 колонок воронки:
    1. **Еще не написан**
    2. **Написал**
    3. **Собеседование**
    4. **Тестовое**
    5. **Оффер**
  - Поддержка Drag-and-Drop и быстрых кнопок перемещения.
  - Кастомные цветные метки (теги) с быстрой фильтрацией по клику.
  - Личные заметки к каждой вакансии (контакты рекрутера, зарплатные ожидания, даты созвонов).
  - Полнотекстовый живой поиск по названию, компании и технологиям.
- **Хранилище**: SQLite с WAL-режимом (монтируется в `./data`), не требует внешних тяжелых баз данных.

---

## Быстрый запуск в Docker Compose (Рекомендуется)

1. Скопируйте `.env.example` в `.env` и укажите ваш API-ключ (Mistral или Gemini):
   ```bash
   cp .env.example .env
   ```

2. Запустите контейнер:
   ```bash
   npm run docker:up
   # или: docker compose up -d --build
   ```

3. Откройте приложение в браузере:
   ```
   http://localhost:8000
   ```

---

## Локальный запуск для разработки

Требования: Python 3.10+ с `virtualenv`, Node.js 18+.

1. Активируйте виртуальное окружение и установите зависимости:
   ```bash
   python3 -m venv .venv
   ./.venv/bin/pip install -r backend/requirements.txt
   ```

2. Установите зависимости фронтенда и соберите бандл:
   ```bash
   npm --prefix frontend install
   npm run build
   ```

3. Запустите бэкенд:
   ```bash
   npm run start
   # или: npm run backend:dev (с автоперезагрузкой при изменении кода)
   ```

---

## Доступные npm скрипты

- `npm run docker:up` — сборка и запуск в фоновом режиме через Docker Compose.
- `npm run docker:down` — остановка Docker Compose контейнеров.
- `npm run docker:logs` — просмотр логов Docker.
- `npm run test:backend` — запуск интеграционного теста парсера и базы данных.
- `npm run backend:dev` — запуск FastAPI с live-reload на порту 8000.
- `npm run frontend:dev` — запуск Vite dev-сервера на порту 5173.
- `npm run frontend:build` — сборка production фронтенда в `frontend/dist`.
- `npm run extension:build` — dev-сборка расширения в `extension/dist` (API из `APP_URL` в `.env`).
- `npm run extension:build:prod` — сборка для Chrome Web Store + zip (нужен https `APP_URL` в `.env.production` или в окружении).

---

## Chrome-расширение

Исходники: `extension/background.js`, `extension/popup-src/`. Манифест генерируется из
`extension/build/manifest.mjs` — `extension/dist/` не редактировать.

1. `npm run extension:build`
2. `chrome://extensions` → Developer mode → **Load unpacked** → папка `extension/dist`
3. Скопировать выведенный ID в `.env` как `EXTENSION_ID=…` и перезапустить backend —
   по нему веб-приложение проверяет, установлено ли расширение (`externally_connectable`).

Для публикации: `APP_URL=https://your-domain npm run extension:build:prod` → загрузить
`extension/job-tracker-extension-<version>.zip` в Developer Dashboard. Версия берётся из
`extension/popup-src/package.json`.

---

## Настройка AI (Mistral / Google Gemini)

Ключи и модель можно настроить двумя путями:
1. В файле `.env`:
   - `LLM_PROVIDER`: `mistral` или `gemini`
   - `MISTRAL_API_KEY`: ваш ключ от Mistral AI Console
   - `MISTRAL_MODEL`: `mistral-small-latest` (по умолчанию)
   - `GEMINI_API_KEY`: ваш ключ от Google AI Studio
   - `GEMINI_MODEL`: `gemini-2.5-flash` (по умолчанию)
2. В интерфейсе приложения:
   - Нажмите на иконку шестеренки **«Настройки AI»** в правом верхнем углу шапки.
   - Выберите активного провайдера и введите ключ. Настройки сохранятся в базе данных.

---

## Model Context Protocol (MCP) Server & API Токены

Приложение предоставляет полноценный **MCP-сервер** для подключения AI-ассистентов (Claude Desktop, Cursor, Antigravity, VS Code, Goose и др.) к вашей Канбан-доске вакансий.

Благодаря поддержке **`npx`**, сервер не требует предварительной установки Python, виртуальных окружений или зависимостей — всё запускается в одну строку.

### 1. Генерация токена доступа в Web UI
1. Откройте приложение в браузере и нажмите на иконку шестеренки **«Настройки»** в правом верхнем углу шапки.
2. Перейдите во вкладку **«MCP / API»**.
3. Введите название токена (например, *Claude Desktop* или *Cursor*) и нажмите **«Создать токен»**.
4. Скопируйте сгенерированный токен `mcp_...`.

### 2. Подключение к Claude Desktop (без установки, через npx)
Добавьте в ваш файл конфигурации Claude Desktop (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "job-tracker": {
      "command": "npx",
      "args": [
        "-y",
        "github:dkoldyaev/linkedin-parser#create_mcp_token_auth"
      ],
      "env": {
        "JOB_TRACKER_URL": "https://create-mcp-token-auth.linkedinparser.build.dkoldyaev.com",
        "JOB_TRACKER_API_KEY": "mcp_ваш_токен"
      }
    }
  }
}
```

### 3. Подключение к Cursor / Antigravity
Создайте или отредактируйте `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "job-tracker": {
      "command": "npx",
      "args": [
        "-y",
        "github:dkoldyaev/linkedin-parser#create_mcp_token_auth"
      ],
      "env": {
        "JOB_TRACKER_URL": "https://create-mcp-token-auth.linkedinparser.build.dkoldyaev.com",
        "JOB_TRACKER_API_KEY": "mcp_ваш_токен"
      }
    }
  }
}
```

### 4. Быстрый запуск из CLI
```bash
# Через npx (без клонирования и установки):
npx -y github:dkoldyaev/linkedin-parser#create_mcp_token_auth \
  --url "https://create-mcp-token-auth.linkedinparser.build.dkoldyaev.com" \
  --api-key "mcp_ваш_токен"

# Или внутри клонированного репозитория:
npm run mcp -- --api-key="mcp_ваш_токен"
# или на Python:
npm run mcp:py -- --api-key="mcp_ваш_токен"
```

### Доступные MCP Инструменты (Tools):
- `list_vacancies`: Поиск и фильтрация сохраненных вакансий по статусу, компании, тегам, городам, странам и ключевым словам.
- `get_vacancy`: Получение полных данных по вакансии (полное описание, AI-саммари, стек технологий, зарплата, история статусов).
- `create_vacancy`: Ручное добавление вакансии в трекер.
- `import_vacancies`: Пакетный импорт по ссылкам (LinkedIn, Habr Career, HeadHunter, Upwork, Avito и др.) с автоматическим парсингом и AI-анализом.
- `update_vacancy`: Перемещение карточек по колонкам воронки («Написал», «Собеседование», «Тестовое», «Оффер», «Отказ»), обновление заметок, тегов, зарплаты.
- `delete_vacancy`: Удаление вакансии.
- `add_status_history`: Фиксация комментариев по этапам собеседований в истории вакансии.
- `resummarize_vacancy`: Перегенерация AI-саммари и стека.
- `reparse_vacancy`: Повторный сбор данных с сайта вакансии.
- `get_stats`: Метрики и конверсия воронки откликов.
- `get_columns`: Список активных колонок Канбан-доски.
- `get_tags`: Список используемых тегов.
- `check_duplicates`: Проверка ссылок на дубликаты.

### MCP Ресурсы:
- `job-tracker://vacancies`, `job-tracker://stats`, `job-tracker://columns`.

---

## Обновления в реальном времени (WebSocket & Mercure)

Приложение поддерживает трансляцию изменений вакансий и статусов очередей в реальном времени:

1. **WebSocket (`/api/ws` или `/ws`)**:
   - Работает прямо в основном backend-процессе FastAPI (порт 8000), не требует отдельных демонов или внешних портов.
   - Поддерживает аутентификацию через сессионные cookies, заголовок `Authorization` или query-параметр: `ws://localhost:8000/api/ws?token=mcp_...`.
   - Изолирует события по пользователю: события вакансий отправляются только подключенным сокетам соответствующего пользователя.
   - Поддерживает ping/pong для контроля соединения.

2. **Mercure Hub (SSE)**:
   - В `docker-compose.yml` открыт порт Mercure: `"${MERCURE_PORT:-3000}:80"`.
   - Frontend автоматически подключается к WebSocket (`/api/ws`), а в случае разрыва соединения автоматически переключается на Mercure SSE hub.

