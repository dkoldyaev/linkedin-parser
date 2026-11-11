# Фаза 0. Аудит фронтенда и инвентаризация UI (`00-audit.md`)

> [!IMPORTANT]
> Аудит проведён в режиме **Read-Only** на ветке после слияния `origin/redesign_todo_specifications` (`d1bcad0`). Проанализировано **27 JSX-файлов** (`10 687` строк кода), **11 JS-утилит** и **4 CSS-файла** (`8 300` строк стилей) в директории `frontend/src/`.

---

## 1. Технологический стек и инфраструктура

| Категория | Текущее решение в проекте | Детали и наблюдения |
| :--- | :--- | :--- |
| **UI-библиотека** | **React `^19.2.8`** + `react-dom` `^19.2.8` | Используется современный React 19 (`StrictMode`, `createRoot` в `frontend/src/main.jsx`). |
| **Сборщик** | **Vite `^8.2.2`** + `@vitejs/plugin-react` `^6.1.0` | Конфигурация в `frontend/vite.config.js`. Строгая валидация `APP_URL` из корневого `.env` при `vite serve`, проксирование `/api` на `env.APP_URL`. |
| **Язык** | **JavaScript (ES Modules, `.jsx`/`.js`)** | В `frontend/package.json` уже установлены `@types/react` (`^19.2.18`) и `@types/react-dom` (`^19.2.4`), но `tsconfig.json` во фронтенде отсутствует. |
| **Менеджер пакетов** | **npm** (`package-lock.json`) | В корне репозитория настроены npm workspaces (`packages/*`, `services/*`), при этом `frontend/` имеет собственный `package.json` и `package-lock.json`. |
| **Роутинг** | **React Router DOM `^7.18.4`** | В `App.jsx` настроены `BrowserRouter`, `Routes`, `Route` и `Layout` (`Outlet`): `/`, `/landing`, `/cv`, `/stat`, `/apikeys`, `/users`, `/admin`, `/howtouse`, `/about`. |
| **Управление состоянием** | **Локальный React State + Context + браузерные хранилища** | Глобального стейт-менеджера нет. Используются: `useState` (до 47 хуков в одном компоненте), `useRef`, React Context (`I18nContext.jsx`, `menuContext.js`), `localStorage` (`workspace-theme`, `unlocked_board`), `sessionStorage`, `IndexedDB` (`cvIndexedDB.js`) и прямые `fetch()` + `EventSource` (Mercure SSE). |
| **Иконки и UI-пакеты** | `lucide-react` `^1.42.0`, `@formkit/auto-animate` `^0.10.0` | Также в `dependencies`: `pdfjs-dist` `^6.5.438` и `compromise` `^14.19.0` (извлечение и анонимизация текста CV на клиенте). |
| **Линтеры и форматирование** | **Oxlint `^1.79.0`** (`frontend/.oxlintrc.json`) | Включены только 2 правила: `react/rules-of-hooks` и `react/only-export-components`. ESLint (для контроля границ Atomic Design), Stylelint и Prettier пока не настроены. |
| **Тестирование** | **Node.js native test runner** (`node --test`) | В `frontend/src/utils/` есть 2 unit-теста: `anonymizer.test.js` и `cvIndexedDB.test.js`. Тестов для React-компонентов и хуков (Vitest + Testing Library), а также Storybook и Playwright визуальных тестов во фронтенде пока нет. |

---

## 2. Масштаб технического долга в стилях и компонентах

### 2.1. Сводка по CSS-файлам и `!important`

В проекте одновременно загружаются 4 крупных глобальных CSS-файла, которые переопределяют друг друга по каскаду:

| CSS-файл | Строк кода | Кол-во `!important` | Назначение и проблемы каскада |
| :--- | ---: | ---: | :--- |
| `frontend/src/index.css` | 3 474 | **28** | Исходная тема *«Aspen Brutalist Void (`#090a0d`) + Making Software (`#2563eb`)»* со скруглёнными углами (`2px–8px`), шрифтом `Space Grotesk` и базовыми классами `.btn`, `.modal-*`, `.kanban-*`, `.form-*`. |
| `frontend/src/design-system.css` | 1 881 | **15** | Импортируется в самом конце `main.jsx` (строка 24) и **4 раза подряд переопределяет `:root`** (строки 2, 275, 346, 369, 382, 416): сначала ставит тему `#0a1729`, затем ASCII-псевдоэлементы `[ ]`, затем убирает их (`content: none`), затем обнуляет все скругления через `*, *::before, *::after { border-radius: 0 !important; }` и вводит сетку `--grid: 32px`. |
| `frontend/src/pages/LandingPage.css` | 2 760 | **421** | Изолирует и переопределяет стили карточек и модалок внутри интерактивного лендинга с помощью **421 декларации `!important`**. |
| `frontend/src/App.css` | 185 | **0** | Старый шаблонный файл Vite/React (`.counter`, `#center`, `#next-steps`), практически не используемый приложением. |
| **ИТОГО** | **8 300** | **464** | **Высокая связность селекторов, глобальное загрязнение и каскадные войны.** |

### 2.2. Распределение inline-стилей (`style={{...}}`) и примитивов по JSX-файлам

Всего в 27 JSX-файлах обнаружено **442 inline-стиля `style={{...}}`**, **108 нативных `<button>`**, **27 `<input>`**, **13 `<select>`**, **10 `<textarea>`** и **3 `<table>`**:

| Файл (`frontend/src/...`) | Строк | `style={{}}` | `<button>` | `<input>` | `<select>` | `<textarea>` | `<table>` | `<form>` |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `pages/LandingPage.jsx` | 2 022 | 16 | 2 | 0 | 0 | 0 | 0 | 0 |
| `components/VacancyModal.jsx` | 1 760 | **57** | **28** | 4 | 4 | 4 | 0 | 0 |
| `pages/HomePage.jsx` | 1 085 | 8 | 13 | 2 | 5 | 0 | 0 | 0 |
| `pages/AdminPage.jsx` | 1 051 | **170** | 9 | 3 | 1 | 0 | 2 | 0 |
| `components/KanbanBoard.jsx` | 553 | 4 | 5 | 0 | 0 | 0 | 0 | 0 |
| `components/SettingsModal.jsx` | 452 | 15 | 13 | 1 | 2 | 0 | 0 | 1 |
| `pages/CVManagementPage.jsx` | 383 | 6 | 3 | 2 | 0 | 1 | 0 | 0 |
| `components/BatchImportModal.jsx` | 372 | 18 | 5 | 1 | 0 | 1 | 0 | 1 |
| `components/KanbanCard.jsx` | 357 | 2 | 4 | 1 | 0 | 0 | 0 | 0 |
| `pages/StatsPage.jsx` | 345 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| `pages/UserManagementPage.jsx` | 304 | **40** | 1 | 2 | 0 | 0 | 1 | 0 |
| `pages/ApiKeysPage.jsx` | 297 | 5 | 3 | 2 | 0 | 0 | 0 | 1 |
| `components/ExtensionPromptModal.jsx` | 249 | **32** | 3 | 1 | 0 | 0 | 0 | 0 |
| `App.jsx` | 194 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/LoginModal.jsx` | 171 | 0 | 3 | 2 | 0 | 0 | 0 | 1 |
| `components/ColumnEditModal.jsx` | 167 | 15 | 4 | 3 | 0 | 0 | 0 | 1 |
| `components/ColumnCreateModal.jsx` | 161 | 14 | 4 | 3 | 0 | 0 | 0 | 1 |
| `pages/HowToUsePage.jsx` | 120 | 4 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/QueueModal.jsx` | 115 | 13 | 2 | 0 | 0 | 0 | 0 | 0 |
| `components/NavDrawer.jsx` | 115 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `components/HeaderControls.jsx` | 105 | 0 | 4 | 0 | 0 | 0 | 0 | 0 |
| `pages/AboutPage.jsx` | 89 | 3 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/ColumnDeleteModal.jsx` | 88 | 8 | 3 | 0 | 1 | 0 | 0 | 0 |
| `components/PageHeader.jsx` | 22 | 1 | 0 | 0 | 0 | 0 | 0 | 0 |
| `components/ThemeToggle.jsx` | 15 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| **ВСЕГО** | **10 687** | **442** | **108** | **27** | **13** | **10** | **3** | **6** |

---

## 3. Инвентарь повторяющихся UI-элементов

В проекте нет ни одного переиспользуемого базового UI-компонента (кроме `ThemeToggle.jsx` на 14 строк). Все кнопки, поля ввода, бейджи, модалки, табы и баннеры копируются вручную через HTML-теги + комбинации глобальных классов и inline-стилей:

| UI-элемент | Уровень Atomic Design | Где встречается (файлов / вхождений) | Вариации и проблемы дублирования |
| :--- | :--- | :--- | :--- |
| **Button / IconButton** | Atom | **18 файлов / 108 `<button>` + 12 `<a className="btn">`** | Классы `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-warning`, `.btn-mint`, `.btn-ghost`, `.btn-icon`, `.btn-sm`, `.quick-move-btn`, `.tokens-add-btn`, `.stage-tool-btn`, `.btn-google-login`, `.btn-dev-login`. В 20+ местах поверх `.btn` накладываются inline-стили (`background: '#ef4444'`, `background: '#059669'`, `padding: '4px 8px'`, `fontSize: '0.75rem'`). Состояние загрузки (`Loader2 className="spin"`) верстается вручную в 14 кнопках. |
| **Input (Text / Number / Search / Color)** | Atom | **12 файлов / 27 `<input>`** | Классы `.form-input`, `.search-input`, `.salary-field-input`, `.editable-token-input`, `.api-key-input`, `.column-color-picker`, плюс полностью inline-стили в `UserManagementPage.jsx` и `AdminPage.jsx`. |
| **Textarea** | Atom | **4 файла / 10 `<textarea>`** | `.form-textarea`, `.cv-textarea`, `.modal-title-input` (auto-resize), `.stage-comment-input`. |
| **Checkbox / Toggle** | Atom | **6 файлов / 7 чекбоксов** | `.card-checkbox` (в `KanbanCard`), чекбоксы в `ColumnCreateModal` / `ColumnEditModal`, `ExtensionPromptModal`, `SettingsModal`, `AdminPage`, `UserManagementPage` — все с разными inline-размерами (`12px`, `14px`, `16px`). |
| **Badge / Chip / Tag / StatusDot** | Atom | **15 файлов / 45+ мест** | `.column-badge` (`[N]`), `.tech-chip`, `.tag-chip`, `.editable-token`, `.card-match-badge` (`match-high`/`medium`/`low`), `.card-workplace-badge` (`remote`/`hybrid`/`onsite`), `.card-salary-badge`, `.card-closed-badge`, `.card-lane-badge`, `.compatibility-severity-badge` (`critical`/`high`/`medium`/`low`), `.cv-sync-badge` (`approved`/`outdated`/`draft`), `.bp-streak-pill`, `.queue-pill`, `.column-dot` (в 8 файлах), плюс inline-бейджи ролей в `AdminPage.jsx`. |
| **Spinner / Skeleton** | Atom | **9 файлов / 18 мест** | `<Loader2 className="spin" style={{ animation: 'spin 1s linear infinite' }} />` дублируется вручную в 8 файлах; `SkeletonBar` определён локально внутри `LandingPage.jsx`. |
| **FormField (Label + Control + Hint/Error)** | Molecule | **9 файлов / 22 группы** | `.form-group` + `.form-label` + `.form-input`/`.form-select` + inline-ошибки/подсказки. В `ColumnCreateModal`, `ColumnEditModal`, `BatchImportModal`, `SettingsModal`, `VacancyModal` размечается по-разному. |
| **SearchBar (Search icon + Input + Clear)** | Molecule | **3 файла (`HomePage`, `AdminPage`, `UserManagementPage`)** | В `HomePage` — `.search-bar` с кнопкой очистки; в `AdminPage` и `UserManagementPage` — заново свёрстанный `div` с `position: 'relative'` и абсолютной иконкой `<Search />`. |
| **Select / FilterSelect** | Molecule | **6 файлов / 13 `<select>`** | `.form-select`, `.form-input` на `<select>`, `.filter-select` (в `HomePage` с обёрткой `.filter-select-wrapper` + иконкой + `<ChevronDown />`), `.modal-status-select`, `.modal-workplace-select`. |
| **Tabs / SegmentedControl** | Molecule | **3 файла (`VacancyModal`, `SettingsModal`, `AdminPage`)** | `.settings-tabs` + `.settings-tab-btn` (используется и в `SettingsModal`, и в `VacancyModal`!), языковой переключатель `.settings-language-options`, переключатель вида и фильтра пользователей в `AdminPage`. |
| **EditableTokenList (Tags / Tech Stack)** | Molecule | **2 секции в `VacancyModal` + `KanbanCard`** | Списки технологий и тегов с кнопкой `+` в заголовке (`.tokens-section-header`), удалением токена (`×`) и inline-инпутом добавления через запятую/Enter/Escape. |
| **Alert / Banner / Toast** | Molecule | **10 файлов / 20+ мест** | `.info-banner`, `.bp-banner` (`is-error`, `is-success`), `.alert-banner` (в `AdminPage`), `.login-alert`, `.login-warning-box`, `.compatibility-notice` (`is-error`, `is-outdated`), `.guest-banner`, `.toast-container` / `.toast`. Почти в каждом файле цвета фона и рамок заданы inline (`rgba(239, 68, 68, 0.1)` и т.д.). |
| **Accordion / CollapsibleRow** | Molecule | **3 файла (`VacancyModal`, `KanbanBoard`, `LandingPage`)** | Сворачиваемое оригинальное описание (`.orig-desc-section`), строки требований в CV Compatibility (`.compatibility-row` с раскрытием `evidence`/`reason`), нижний блок «Отказ» (`.kanban-rejected-block`). |
| **ColorPicker (Preset swatches + input)** | Molecule | **2 файла (`ColumnCreateModal`, `ColumnEditModal`)** | Идентичный массив `PRESET_COLORS` и 30 строк inline-стилей кружков выбора цвета скопированы один-в-один между двумя модалками. |
| **EmptyState** | Molecule | **6 файлов** | `.empty-column`, `.kanban-rejected-empty`, `.stage-timeline-empty`, `.api-keys-empty`, пустой список в `QueueModal` и `AdminPage`. |
| **Modal / Dialog** | Organism | **9 файлов (`VacancyModal`, `SettingsModal`, `BatchImportModal`, `ExtensionPromptModal`, `ColumnCreateModal`, `ColumnEditModal`, `ColumnDeleteModal`, `QueueModal`, `LoginModal`)** | Во всех 8 стандартных модалках вручную дублируется `<div className="modal-overlay" onClick={onClose}><div className="modal-content" onClick={e => e.stopPropagation()}>`, `.modal-header`, `.modal-title`, `.modal-close-btn`, `.modal-body`, `.modal-footer`. При этом ни в одной модалке нет `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, Focus Trap и закрытия по `Escape`! |
| **Card (Vacancy / Info / Stat / Feature)** | Organism | **8 файлов** | `KanbanCard.jsx` (и её дубликат `LandingKanbanCard` в `LandingPage.jsx`), `.info-card`, `.stat-card`, `.feature-card`, карточки пользователей в `AdminPage.jsx`. |
| **DataTable** | Organism | **2 файла (`AdminPage.jsx`, `UserManagementPage.jsx`)** | Сортируемая таблица пользователей в `AdminPage` и таблица feature-флагов в `UserManagementPage`, полностью стилизованные через десятки inline-объектов `style={{ padding: '12px 16px', ... }}`. |
| **Header & FilterBar & NavDrawer** | Organism | **`PageHeader.jsx`, `HeaderControls.jsx`, `HomePage.jsx`, `NavDrawer.jsx`** | Шапка доски в `HomePage` дублирует бренд-блок из `PageHeader.jsx`; панель фильтров и массовых действий (`.filter-bar` / `.filter-bar-bulk`) встроена прямо в `HomePage.jsx`. |
| **PageLayout / BlueprintLayout** | Template | **`App.jsx`, `CVManagementPage`, `StatsPage`, `ApiKeysPage`, `HowToUsePage`, `AboutPage`** | Каркас `.app-shell` + `.bp-page` + `.bp-subbar` + `.bp-grid-row` повторяется на всех внутренних страницах. |

---

## 4. Декомпозиция 5 самых больших компонентов по Atomic Design

### 4.1. #1 — `frontend/src/pages/LandingPage.jsx` (`2 022` строки + `2 760` строк в `LandingPage.css`)
- **Текущая ответственность:** Интерактивный скролл-лендинг из 3 экранов (8 подшагов `1.1–3.2`), который рендерит собственные копии карточек и модалок (`LandingKanbanCard`, `LandingVacancyModal`, `LandingLinkedInOverlay`, `TypewriterText`, `SkeletonBar`), управляет скролл-триггерами, пошаговой анимацией воронки и расчётом `32px`-сетки.
- **Декомпозиция по Atomic Design:**
  - **Atoms:** `Button`, `Badge`, `StatusDot`, `Skeleton`, `Text`, `Icon`, `TypewriterText`.
  - **Molecules:** `StepBulletNav` (вертикальный навигатор `landing-vnav`), `CaptionCard` (`landing-caption-item`), `ScrollHintPrompt` (`landing-scroll-hint-btn`), `ColumnHeader`.
  - **Organisms:** `KanbanCard` (единый презентационный компонент вместо дубликата `LandingKanbanCard`), `VacancyDetailView` (презентационное ядро `VacancyModal` без API-вызовов), `BatchImportPreviewCard`.
  - **Templates:** `SplitShowcaseLayout` (двухколоночный sticky-каркас лендинга).
  - **Hooks:** `useBlueprintGridSnap`, `useFunnelStepper`.

### 4.2. #2 — `frontend/src/components/VacancyModal.jsx` (`1 760` строк, `47` `useState`, `7` `useRef`, `17` `fetch`-вызовов, `57` inline-стилей)
- **Текущая ответственность:** Самый перегруженный «God Component» приложения. Совмещает: модальную обёртку, расчёт `32px`-сетки через `ResizeObserver`/`MutationObserver`, inline-редактирование заголовка, смену статуса и формата работы, перепарсинг и AI-ресаммаризацию, inline-редактирование зарплаты со snapshot-откатом, редактирование списков технологий и тегов с очередью сохранения (`listSaveQueue`), таймлайн истории переходов с CRUD комментариев, заметки, сворачиваемое оригинальное описание с копированием в буфер, анализ совместимости с CV (4 группы аккордеонов) и версионирование адаптированного резюме с diff.
- **Декомпозиция по Atomic Design:**
  - **Atoms:** `Button`, `IconButton`, `Input`, `Select`, `Textarea`, `Badge`, `Tag`, `StatusDot`, `Spinner`, `Text`, `Label`.
  - **Molecules:** `Tabs`, `FormField`, `EditableTokenList` (общий для `tech_stack` и `tags`), `CollapsibleSection` (оригинальное описание и строки требований CV), `StatusSelectorBar`, `AlertBanner`, `CopyButton`.
  - **Organisms:** `Modal` (базовый доступный диалог), `SalaryInlineEditor`, `AiSummaryBlock`, `StageHistoryTimeline`, `CvCompatibilityPanel`.
  - **Hooks:** `useDisclosure`, `useCopyToClipboard`, `useAutoResizeTextarea`, `useEditableSnapshot`.

### 4.3. #3 — `frontend/src/pages/HomePage.jsx` (`1 085` строк, `26` `useState`, `17` `fetch`-вызовов, `8` inline-стилей)
- **Текущая ответственность:** Главная страница доски: загрузка вакансий/колонок/фильтров/очереди, подключение к Mercure SSE (`EventSource`) с обработкой 7 типов событий, шапка с поиском, гостевой баннер, панель из 6 фильтров и чипов тегов, панель массовых действий (multiselect), тост-уведомления и управление 4 модальными окнами.
- **Декомпозиция по Atomic Design:**
  - **Atoms:** `Button`, `IconButton`, `Input`, `Badge`, `Spinner`, `Divider`.
  - **Molecules:** `SearchBar`, `FilterSelect`, `TagFilterGroup`, `QueueStatusPill`, `Toast`, `GuestPromptBanner`.
  - **Organisms:** `AppHeader`, `BoardFilterBar`, `BulkActionsBar`, `KanbanBoard`.
  - **Templates:** `BoardPageLayout`.
  - **Hooks:** `useDebounce` (для поиска вместо ручного `setTimeout(..., 150)`), `useSelection` (multiselect карточек), `useDisclosure` (модалки).

### 4.4. #4 — `frontend/src/pages/AdminPage.jsx` (`1 051` строка, `11` `useState`, `170` inline-стилей!)
- **Текущая ответственность:** Панель администратора с поиском, фильтрацией по типу пользователя (все / зарегистрированные / гости), сортировкой по 6 полям, переключением режима отображения (`table` / `cards`), редактированием `feature_flags` и сохранением прав. Почти целиком свёрстана на inline-стилях (`170` объектов `style={{...}}`).
- **Декомпозиция по Atomic Design:**
  - **Atoms:** `Button`, `Input`, `Select`, `Checkbox`, `Badge`, `Avatar`, `Spinner`, `Text`.
  - **Molecules:** `SearchBar`, `SegmentedControl` (переключатель `All / Registered / Guests` и `Table / Cards`), `SortableColumnHeader`, `AlertBanner`, `EmptyState`.
  - **Organisms:** `DataTable` (переиспользуемая таблица с сортировкой и кастомными ячейками), `UserAdminCard`, `AdminToolbar`.
  - **Templates:** `PageLayout` / `DashboardLayout`.

### 4.5. #5 — `frontend/src/components/KanbanBoard.jsx` (`553` строки, `10` `useState`, `3` `useRef`)
- **Текущая ответственность:** Отрисовка воронки колонок, квантование ширины колонок и высоты карточек по сетке `32px`, HTML5 Drag-and-Drop (между колонками, внутри колонки и по дорожкам `lanes`), выпадающее меню колонки (закрытие по клику вне), нижняя сворачиваемая панель «Отказ» и модалки создания/редактирования/удаления колонок.
- **Декомпозиция по Atomic Design:**
  - **Atoms:** `Button`, `IconButton`, `Badge`, `StatusDot`, `Text`.
  - **Molecules:** `ColumnHeader`, `DropdownMenu` (меню действий колонки), `EmptyState`, `LaneDropzone`, `CollapsibleSection` (блок «Отказ»).
  - **Organisms:** `KanbanColumn`, `KanbanCard`, `RejectedDrawerBlock`, `ColumnFormModal`.
  - **Hooks:** `useClickOutside` (закрытие меню колонки), `useDisclosure`.

---

## 5. Аудит дизайн-токенов и рассинхронизации значений

Анализ `index.css`, `design-system.css`, `LandingPage.css` и inline-стилей показал, что одни и те же визуальные сущности записаны **3–5 разными способами**:

### 5.1. Цвета (Colors)

| Семантическая роль | В `index.css` (Legacy Dark) | В `design-system.css` (Blueprint Dark) | В `design-system.css` (Blueprint Light) | Hardcoded в CSS и inline `style={{}}` |
| :--- | :--- | :--- | :--- | :--- |
| **Фон страницы (`bg-main`)** | `--bg-main: #090a0d` | `--bg-main: #0a1729` (`--pixel-paper: #0b1c30`) | `--bg-main: #f4f4f1` | `#090a0d` (`UserManagementPage`), `#0d1d32` |
| **Фон поверхности / карточек** | `--bg-surface: #0f1118`, `--bg-card: #141722` | `--bg-surface: #101f35`, `--board-card-fill: rgba(16, 31, 53, .66)` | `--bg-surface: #fff`, `--board-card-fill: rgba(255, 255, 255, .70)` | `#101f35`, `#14263e`, `rgba(15, 23, 42, 0.5)` |
| **Основной акцент (`primary`)** | `--primary: #2563eb`, `--primary-hover: #1d4ed8` | `--primary: #79aeff`, `--primary-hover: #a2c9ff` | `--primary: #304bde`, `--primary-hover: #2137b1` | `#2563eb` (в 18 JSX-файлах напрямую в `color="#2563eb"`), `#60a5fa`, `#3b82f6`, `#93c5fd` |
| **Успех / Mint (`success`)** | `--aspen-mint: #10b981`, `--aspen-mint-bright: #34d399` | `--aspen-mint: #7eddb0`, `--aspen-mint-subtle: #173d3a` | `--aspen-mint: #237844`, `--aspen-mint-subtle: #e0f8e7` | `#10b981`, `#059669`, `#34d399`, `#6ee7b7`, `#9ee8bd` |
| **Опасность / Ошибка (`danger`)** | `--danger` *(используется в `QueueModal`, но не объявлен в `:root`!)* | `--card-match-edge: #ef4444` | `#b63840`, `#b91c1c` | `#ef4444`, `#dc2626`, `#e07575`, `#c65f66`, `#f87171`, `#fca5a5`, `#e05252` |
| **Предупреждение (`warning`)** | `--col-interview: #f59e0b` | — | `#80540b`, `#92400e`, `#b45309` | `#f59e0b`, `#d97706`, `#fbbf24`, `#eab308`, `#efc879` |
| **Текст (`text-*`)** | `#f8fafc` / `#94a3b8` / `#64748b` | `#e7f1ff` / `#b0c4db` / `#91a9c3` | `#222321` / `#555a54` / `#6c716a` | `--text-primary` и алиас `--text-main` (`AdminPage`) |
| **Границы (`border-*`)** | `rgba(255,255,255,0.08)` / `0.16` | `--border-subtle: #304c6c`, `--border-strong: #527292`, `--pixel-line: #527aa3` | `--border-subtle: #d7d8d2`, `--border-strong: #a8aaa4`, `--pixel-line: #98a8b8` | `--border-subtle` и алиас `--border-color` |

### 5.2. Типографика (Typography)

- **Семейства шрифтов (`font-family`):**
  - В `index.css`: `--font-display: 'Silkscreen', monospace`, `--font-sans: 'Space Grotesk', ...`, `--font-mono: 'JetBrains Mono', ...`.
  - В `design-system.css` (строка 2): все три переменные приравниваются к `'JetBrains Mono', monospace`.
  - В `design-system.css` (строка 346): `--font-sans` и `--font-display` переопределяются на `'Inter', 'Segoe UI', sans-serif` (при этом `Inter` не подключён в `@import`!).
- **Размеры шрифта (`font-size`) — обнаружено более 35 разрозненных значений:**
  - Мелкий технический капс/лейблы: `10px`, `11px`, `0.65rem` (`10.4px`), `0.66rem`, `0.68rem` (`10.88px`), `0.6875rem` (`11px`), `0.7rem` (`11.2px`), `0.72rem` (`11.52px`), `0.725rem`.
  - Базовый UI и вторичный текст: `12px`, `0.75rem` (`12px`), `0.78rem`, `0.8rem` (`12.8px`), `13px`, `0.8125rem` (`13px`), `0.85rem` (`13.6px`).
  - Основной текст: `0.875rem` (`14px`), `0.9rem`, `0.925rem`, `15px`, `0.95rem`, `1rem` (`16px`).
  - Заголовки: `1.1rem`, `1.15rem`, `1.2rem`, `1.25rem`, `1.3rem`, `1.4rem`, `1.5rem`, `1.75rem`, `clamp(2rem, 4vw, 3.5rem)`.

### 5.3. Отступы и сетка (Spacing & Grid)

- В `design-system.css` введена строгая система координат:
  - `--grid: 32px` (основная ячейка чертежной сетки Blueprint)
  - `--grid-unit: 8px` (`1/4` ячейки)
  - Межстрочный интервал текста: `calc(var(--grid) * 0.75)` (`24px`)
  - Половина ячейки: `calc(var(--grid) * 0.5)` (`16px`)
- При этом в JSX и старых правилах те же значения записаны вразнобой: `8px`, `var(--grid-unit)`, `0.5rem`; `16px`, `calc(2 * var(--grid-unit))`, `calc(var(--grid) / 2)`, `1rem`; `24px`, `calc(3 * var(--grid-unit))`, `calc(var(--grid) * 0.75)`; `32px`, `var(--grid)`, `2rem`.

### 5.4. Радиусы скругления (Border Radius)

- В `index.css`: `--radius-xs: 2px`, `--radius-sm: 3px`, `--radius-md: 4px`, `--radius-lg: 6px`, `--radius-xl: 8px`.
- В `design-system.css` (строка 346): переопределены на `3px / 4px / 6px / 8px / 10px`, а через 23 строки (строка 369) обнулены (`0px`) вместе с глобальным правилом `*, *::before, *::after { border-radius: 0 !important; }`.
- Одновременно в JSX в inline-стилях используются `borderRadius: 4`, `6`, `8`, `10`, `12`, `20`, `'50%'`, `'var(--radius-xs)'`, `'var(--radius-sm)'`, которые в рантайме принудительно подавляются глобальным `!important`.

### 5.5. Тени, Брейкпоинты и Z-Index

- **Тени (`box-shadow`):** В `design-system.css` большинство рамок реализовано через внутренние линии сетки `inset 0 -1px var(--border-subtle)`, `inset 0 1px var(--pixel-line)`, `inset 0 0 0 1px var(--border-subtle)` и внешние тени `--shadow-md: 0 8px 24px rgba(25, 27, 24, .08)`.
- **Брейкпоинты (`@media`) — 9 разных порогов без единой шкалы:** `400px`, `480px`, `600px`, `640px`, `700px` (основной mobile-брейкпоинт доски), `768px`, `800px`, `900px`, `960px`, `1024px`, `1360px`.
- **Слои (`z-index`) — хаотичные числа без токенов:** `0`, `1`, `2`, `4` (разделители колонок), `5`, `6`, `8`, `10`, `18`, `20` (`.app-header`), `25`, `30`, `40`, `45`, `50`, `100`, `999` (`.modal-overlay`), `9999` (`.toast-container`).
