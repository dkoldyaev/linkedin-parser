# Архитектурные решения и допущения (`assumptions.md`)

Данный документ фиксирует все архитектурные решения и допущения, принятые при проектировании UI-библиотеки по методологии **Atomic Design** и подготовке миграции по паттерну **Strangler Fig**.

---

## 1. Размещение библиотеки: `frontend/src/ui-kit/`

- **Решение:** Разместить UI-библиотеку внутри фронтенд-приложения по пути `frontend/src/ui-kit/` (с алиасом `@ui-kit` в `vite.config.js` и `tsconfig.json`), а не в корневом `packages/ui`.
- **Обоснование:**
  1. Жёсткое ограничение задачи: *«Трогай только frontend часть. Не прикасайся к backend части»*. Корневой `package.json` содержит скрипты оркестрации Python-бэкенда, Docker и парсеров.
  2. Текущий `Dockerfile` и `frontend/` собираются независимо через `npm --prefix frontend run build`.
  3. Однонаправленность зависимостей (`приложение -> ui-kit`, запрет импортов из легаси в `ui-kit`) и иерархия Atomic Design (`tokens -> atoms -> molecules -> organisms -> templates`) строго контролируются через ESLint (`eslint-plugin-boundaries` и `no-restricted-imports`).

## 2. Язык и типизация: TypeScript (`strict: true`) для `ui-kit`, совместимость с `.jsx` в легаси

- **Решение:** Вся новая библиотека `frontend/src/ui-kit/` пишется на **TypeScript (`.ts` / `.tsx`)** со строгим режимом (`"strict": true`, `"allowJs": true`), при этом легаси-файлы (`.jsx` / `.js`) остаются без изменений и могут бесшовно импортировать компоненты и адаптеры из `ui-kit`.
- **Обоснование:**
  - В `frontend/package.json` уже установлены `@types/react` (`^19.2.18`) и `@types/react-dom` (`^19.2.4`), а Vite 8 нативно транспилирует `.ts`/`.tsx` через Oxc/esbuild без накладных расходов.
  - Строгая типизация в `ui-kit` необходима для автогенерации таблиц пропсов (`autodocs`) в Storybook и статической проверки контрактов компонентов.
  - В соответствии с глобальными правилами проекта в бизнес-логике, хуках и утилитах не используются скрытые fallback-конфигурации и значения параметров по умолчанию (за исключением стандартных дефолтов пропсов UI-компонентов React).

## 3. Изоляция стилей и темизация: CSS Modules (`*.module.css`) + CSS Cascade Layers (`@layer`)

- **Решение:** Использовать нативные для Vite **CSS Modules (`*.module.css`)** в сочетании с **CSS Cascade Layers** (`@layer legacy, ui-tokens, ui-reset, ui-atoms, ui-molecules, ui-organisms, ui-templates, ui-utilities;`) и дизайн-токенами на базе **CSS Custom Properties** (`--ui-*`).
- **Обоснование:**
  - Легаси-стили (`index.css` — 3 474 строки, `design-system.css` — 1 881 строка, `LandingPage.css` — 2 760 строк) содержат глобальные селекторы (включая `*, *::before, *::after { border-radius: 0 !important; }`, `button, input, select, textarea { font-family: var(--font-mono); }` и `.btn:not(.btn-icon)::before`) и суммарно **464 `!important`**.
  - CSS Modules гарантируют отсутствие коллизий имён классов с глобальными `.btn`, `.modal-content`, `.card-title`, `.form-input`, не требуя стороннего runtime CSS-in-JS.
  - Темизация (`dark` / `light`) работает через существующий атрибут `document.documentElement.dataset.theme` (`:root` / `:root[data-theme="light"]`), сохраняя визуальную систему **Blueprint Workspace** (`--ui-grid: 32px`, `--ui-grid-unit: 8px`).
  - Внутри `src/ui-kit/` действует полный запрет на `!important` и inline-стили `style={{...}}` (проверяется Stylelint и ESLint).

## 4. Headless-примитивы доступности (a11y): `@radix-ui`

- **Решение:** Использовать точечные пакеты **`@radix-ui/react-dialog`**, **`@radix-ui/react-select`**, **`@radix-ui/react-tabs`**, **`@radix-ui/react-tooltip`**, **`@radix-ui/react-slot`** для сложных интерактивных паттернов (`Modal`, `Select`, `Tabs`, `Tooltip`, полиморфный `asChild`).
- **Обоснование:**
  - Полная поддержка WAI-ARIA, клавиатурной навигации (Arrow keys, Home/End, Escape), захвата и возврата фокуса (`FocusTrap`) и порталов из коробки без привязки к стилям.
  - `@radix-ui/react-slot` обеспечивает идиоматичную реализацию паттерна `asChild` для полиморфных компонентов (`Button`, `Badge`, `Text`).
  - По сравнению с монолитными UI-фреймворками атомарные пакеты Radix UI не несут собственных стилей и легко стилизуются через CSS Modules и токены `--ui-*`.

## 5. Визуальный язык и 32px Blueprint Grid

- **Решение:** За основу токенов `ui-kit/tokens/` принята актуальная дизайн-система **Blueprint Workspace** из `design-system.css` и `redesign-todo.md`:
  - Базовый шаг сетки: `--ui-grid: 32px` (подсетка `--ui-grid-unit: 8px`, межстрочный ритм текста `calc(var(--ui-grid) * 0.75)` = `24px`).
  - Острые архитектурные углы (`--ui-radius-none: 0px`) по умолчанию в теме Blueprint с поддержкой токенов радиуса.
  - Контрастные палитры для тёмной (`#0a1729` / `#101f35` / `#79aeff` / `#7eddb0`) и светлой (`#f4f4f1` / `#ffffff` / `#304bde` / `#237844`) тем, проходящие проверки контрастности WCAG AA (`axe-core`).

## 6. Механизм Feature Flag (`useUiVersion`)

- **Решение:** Переключение между старым (`old`) и новым (`new`) UI осуществляется через единый хук `useUiVersion()`, который проверяет источники в следующем приоритете:
  1. Query-параметр URL: `?ui=new` или `?ui=old`
  2. `localStorage.getItem('ui-version')` (`'new'` | `'old'`)
  3. Переменная окружения Vite: `import.meta.env.VITE_UI_VERSION`
  4. По умолчанию (если ни один источник не задал `'new'`): **`'old'`** (100% сохранение легаси-поведения).
