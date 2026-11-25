# Implementation Plan: Remove Next.js SSR & Migrate to Pure Client-Side SPA (Vite + React Router v7)

## Overview

Completely remove Next.js and all server-side rendering (SSR) from the project, replacing it with a pure client-side Single-Page Application (SPA) built with **Vite 8** and **React Router v7** (declarative library mode). All vacancies load strictly **once** per user session via `GET /api/v2/vacancies` (lightweight card/filter fields only, without server-side filtering) into an application-level store so route transitions never re-fetch the board. Filters and search operate purely on the client by toggling `display: none` on non-matching cards while keeping URL query parameters synchronized with browser Back/Forward history. Vacancy details (`description`, `company_info`, `notes`, `history`, `compatibility`) are excluded from the list payload and fetched fresh via `GET /api/v2/vacancies/:id` with `<Skeleton />` placeholders on every modal open; opening/closing cards pushes `/vacancies/:id` and `/` into browser history, and missing/foreign cards render a dedicated 404 screen.

## Architecture Decisions

1. **Bundler & Router (`Vite 8` + `react-router-dom` v7 declarative SPA)**
   - Eliminates Next.js server components, App Router (`frontend/src/app/`), `middleware.ts`, `serverApi.ts`, and Node.js runtime overhead in production.
   - `/` and `/vacancies/:id` render the exact same mounted `<HomePage />` route element so opening, closing, or stepping Back/Forward between cards never unmounts or resets the Kanban board scroll position.
2. **Docker & Dokploy Compatibility (`frontend:3000` with Nginx in `runner`, Vite in `dev`)**
   - Production `runner` target uses `nginx:1.27-alpine` on port `3000` with `try_files $uri $uri/ /index.html;` for SPA deep links and reverse-proxy rules for `/api`, `/admin`, `/bundles`, `/admin-assets`, `/extension.zip`, and `/.well-known` to `BACKEND_INTERNAL_URL`.
   - Both Nginx entrypoint (`runner`) and `vite.config.ts` (`dev`) enforce **fail-fast startup validation** if `BACKEND_INTERNAL_URL` is missing or empty (zero implicit fallbacks).
3. **Backend List vs Detail Payload Separation (`Vacancy.php`)**
   - `GET /api/v2/vacancies` (`vacancy:read`) returns only card and filter attributes (`id`, `url`, `title`, `company`, `source`, `location`, `city`, `country`, `workplace_type`, `is_closed`, `salary_*`, `ai_summary`, `tech_stack`, `tags`, `match_score`, `calculated_score`, `status`, `lane`, `sort_order`, timestamps).
   - Heavy fields (`description`, `company_info`, `notes`, `history`) belong exclusively to `vacancy:detail` (`GET /api/v2/vacancies/:id`, `PATCH /api/v2/vacancies/:id`, and history mutation endpoints).
   - `VacancyFilterExtension.php` remains on the backend untouched, while the SPA never passes filter query parameters to `GET /api/v2/vacancies`.
4. **Global Single-Fetch Store & Client-Derived Filter Metadata**
   - `BoardStoreProvider` sits above `<Routes>` (inside `AppShell`), fetching `GET /api/v2/vacancies` once after `authService.getMe()` resolves and keeping cards synchronized via Mercure SSE. Navigating `/` → `/cv` → `/` reuses in-memory state with zero network calls.
   - Filter dropdown options (`countries`, `cities`, `sources`, `tags`) are computed synchronously via `useMemo` from the full `vacancies` array rather than 4 separate metadata endpoints.
   - Silent `POST /api/v2/auth/refresh` retry on `401` in `apiClient.ts` replaces the former Next.js `middleware.ts` token refresh for long-lived SPA sessions.
5. **URL History Semantics for Cards, Filters & Search**
   - **Cards**: Clicking a card pushes `/vacancies/:id` (preserving active query params). Closing a card (X / Esc / backdrop) **always pushes** `/` (preserving active query params) so browser **Back** reopens the closed card. Browser Back/Forward derives modal state purely from `useParams().id`.
   - **Uncached Detail Skeletons & 404**: Every modal open displays available list-level card fields immediately, renders `<Skeleton />` placeholders on detail sections (`Company`, `History`, `Notes`, `Raw Description`, `Compatibility`), and fetches fresh `/api/v2/vacancies/:id` without caching details across opens. If `:id` is invalid or returns `404`/`403`, `<NotFoundPage />` renders in place without mutating the URL.
   - **Filters & Search**: Select/tag changes push to URL search params. Text search hides cards in `0 ms` via local input state + `display: none`, committing to URL history with burst-grouping (first input in a burst does `push`, rapid keystrokes within 500 ms do `replace` on that entry) so browser Back steps cleanly per search phrase. Columns whose cards are all hidden via `display: none` remain visually blank (`EmptyState` renders only when a column physically has 0 cards).

## Dependency Graph

```
Task 1 (Symfony vacancy:read vs vacancy:detail)
  │
  ▼
Task 2 (Vite + React Router v7 toolchain) ──► Task 3 (Delete Next.js files)
                                                    │
                                                    ▼
                                              Task 4 (AppShell, Links, silent 401 refresh)
                                                    │
                                                    ▼
                                              Task 5 (main.tsx, AppRouter, NotFoundPage)
                                                    │
                              ┌─────────────────────┴─────────────────────┐
                              ▼                                           ▼
              Task 6 (Global BoardStoreContext)             Task 8 (VacancyModal Skeletons & Loader)
                              │                                           │
                              ▼                                           ▼
              Task 7 (URL Filters/Search + display:none) ──► Task 9 (/vacancies/:id Routing & 404)
                                                                          │
                                                    ┌─────────────────────┴─────────────────────┐
                                                    ▼                                           ▼
                                      Task 10 (Docker Nginx + Vite dev)           Task 11 (Vitest SPA Suite)
```

---

## Task Breakdown

### Phase 1: Backend Payload Separation

#### Task 1: Separate lightweight list fields (`vacancy:read`) from detail fields (`vacancy:detail`)
**Description:** Move `description`, `companyInfo`, `notes`, and `history` out of `vacancy:read` into `vacancy:detail` in Symfony so `GET /api/v2/vacancies` returns a fast, lightweight list without N+1 history queries, while `GET /api/v2/vacancies/{id}`, `PATCH /api/v2/vacancies/{id}`, and history comment endpoints return full details. Keep `VacancyFilterExtension.php` untouched.

**Acceptance criteria:**
- [ ] `GET /api/v2/vacancies` response items omit `description`, `company_info`, `notes`, and `history`, while keeping all card & filter fields (`id`, `title`, `company`, `url`, `source`, `location`, `city`, `country`, `workplace_type`, `is_closed`, `salary_*`, `ai_summary`, `tech_stack`, `tags`, `match_score`, `calculated_score`, `status`, `lane`, `sort_order`).
- [ ] `GET /api/v2/vacancies/{id}`, `PATCH /api/v2/vacancies/{id}`, and `/api/v2/vacancies/{id}/history*` include `description`, `company_info`, `notes`, and `history`.
- [ ] `VacancyFilterExtension.php` remains intact.

**Verification:**
- [ ] PHPUnit / backend tests pass for vacancy list vs detail serialization.

**Dependencies:** None  
**Files likely touched:**
- `backend-symfony/src/Entity/Vacancy.php`
- `backend-symfony/src/Controller/VacancyActionController.php`
- `backend-symfony/tests/Api/VacancySerializationTest.php`  
**Estimated scope:** Small (3 files)

---

### Phase 2: Vite + React Router v7 Foundation & Next.js Removal

#### Task 2: Replace Next.js toolchain with Vite 8 & React Router v7 configuration
**Description:** Remove `next` from `frontend/package.json`, install `react-router-dom` v7, configure `frontend/index.html`, `frontend/vite.config.ts` (with fail-fast `BACKEND_INTERNAL_URL` proxy validation), `frontend/tsconfig.json`, and `frontend/vitest.config.ts`.

**Acceptance criteria:**
- [ ] `next` dependency and Next.js scripts are removed from `frontend/package.json`; `react-router-dom` is installed; `dev`, `build`, `preview`, `typecheck`, `lint`, and `test` scripts use Vite/TypeScript/Oxlint/Vitest.
- [ ] `frontend/vite.config.ts` proxies `/api`, `/admin`, `/bundles`, `/admin-assets`, `/extension.zip`, and `/.well-known` to `BACKEND_INTERNAL_URL` during `vite dev`/`preview` and throws an explicit fatal error if `BACKEND_INTERNAL_URL` is unset or empty (no fallback URLs).
- [ ] `frontend/index.html` initializes `data-theme`, loads fonts/icons, and mounts `/src/main.tsx`.

**Verification:**
- [ ] `npm --prefix frontend install` succeeds with zero `next` packages remaining.

**Dependencies:** None  
**Files likely touched:**
- `frontend/package.json`
- `frontend/index.html`
- `frontend/vite.config.ts`
- `frontend/tsconfig.json`
- `frontend/vitest.config.ts`  
**Estimated scope:** Medium (5 files)

#### Task 3: Delete Next.js App Router, SSR utilities, and Next middleware
**Description:** Remove all Next.js-only directories, configuration files, server cookie helpers, and SSR middleware files from `frontend/`.

**Acceptance criteria:**
- [ ] `frontend/src/app/` (all routes, `layout.tsx`, `not-found.tsx`, `ssr_seams.test.tsx`), `frontend/src/middleware.ts`, `frontend/src/middleware.test.ts`, `frontend/src/utils/serverApi.ts`, `frontend/next.config.mjs`, and `frontend/next-env.d.ts` are deleted.
- [ ] `frontend/.gitignore` ignores `dist` instead of `.next`.

**Verification:**
- [ ] `grep -rn "next/" frontend/src/` only shows remaining component imports to be migrated in Task 4.

**Dependencies:** Task 2  
**Files likely touched:**
- `frontend/next.config.mjs` (delete)
- `frontend/next-env.d.ts` (delete)
- `frontend/src/middleware.ts` & `frontend/src/middleware.test.ts` (delete)
- `frontend/src/utils/serverApi.ts` (delete)
- `frontend/src/app/**` & `frontend/.gitignore`  
**Estimated scope:** Medium (cleanup across Next-only files)

#### Task 4: Migrate `AppShell`, navigation links, and silent auth refresh to SPA
**Description:** Replace all remaining `next/link` and `next/navigation` usages across components/views with `react-router-dom` (`Link`, `useLocation`, `useNavigate`, `useSearchParams`), strip obsolete `'use client'` directives, and add silent `POST /api/v2/auth/refresh` retry on `401` in `apiClient.ts` so long-running SPA sessions renew expired access tokens seamlessly.

**Acceptance criteria:**
- [ ] Zero imports from `next/*` exist anywhere in `frontend/src/`.
- [ ] `apiClient.ts` retries once after `POST /api/v2/auth/refresh` on `401` responses (excluding auth endpoints themselves to avoid loops).
- [ ] `AppShell.tsx` resolves `authService.getMe()` once on mount and gates protected routes behind `LoginModal` when unauthenticated while keeping `/about`, `/landing`, and `/howtouse` public.

**Verification:**
- [ ] `grep -rn "from ['\"]next" frontend/src/` returns 0 matches.

**Dependencies:** Task 3  
**Files likely touched:**
- `frontend/src/services/apiClient.ts`
- `frontend/src/components/AppShell.tsx`
- `frontend/src/components/NavDrawer.tsx`
- `frontend/src/components/PageHeader.tsx`
- `frontend/src/views/HomeHeaderSection.tsx`, `AboutPage.tsx`, `LandingPage.tsx`  
**Estimated scope:** Medium (5–7 small edits)

#### Task 5: Create SPA `main.tsx`, `AppRouter.tsx`, and design-system `NotFoundPage.tsx`
**Description:** Wire up the client-side React 19 root (`main.tsx`), declarative `AppRouter.tsx` with all application routes, and a dedicated design-system `NotFoundPage.tsx` for unknown URLs and missing/foreign vacancies.

**Acceptance criteria:**
- [ ] `<Routes>` maps `/` and `/vacancies/:id` to the shared `<HomePage />` route element, `/cv`, `/stat`, `/apikeys`, `/users`, `/about`, `/landing`, `/howtouse` to their respective views, and `*` to `<NotFoundPage />`.
- [ ] `NotFoundPage` displays localized 404 messaging in the Blueprint UI Kit design system with «Вернуться на доску» (`/`) and «Сменить аккаунт / Войти» (`LoginModal` trigger), without overwriting `window.location` so browser Back returns cleanly.

**Verification:**
- [ ] `npm --prefix frontend run typecheck` and `npm --prefix frontend run build` succeed (once HomePage hooks are updated or stubbed cleanly).

**Dependencies:** Task 4  
**Files likely touched:**
- `frontend/src/main.tsx`
- `frontend/src/AppRouter.tsx`
- `frontend/src/views/NotFoundPage.tsx`  
**Estimated scope:** Small (3 files)

### Checkpoint 1: After Tasks 1–5
- [ ] Next.js is 100% removed from dependencies and source files.
- [ ] Backend `GET /api/v2/vacancies` returns lightweight list payloads while `GET /api/v2/vacancies/:id` returns full detail payloads.

---

### Phase 3: Global Single-Load Store & CSS `display: none` URL Filtering

#### Task 6: Implement app-level `BoardStoreContext` (single startup load + Mercure + client metadata)
**Description:** Create an application-level `BoardStoreProvider` mounted inside `AppShell` (above `<Routes>`) that loads `GET /api/v2/vacancies` (with zero query parameters), `GET /api/v2/columns`, and `GET /api/v2/queue/status` strictly once per authenticated/guest user session, maintains realtime updates via Mercure SSE without ever dropping closed/filtered cards from memory, and derives `allCountries`, `allCities`, `allSources`, and `allTags` synchronously from `vacancies`.

**Acceptance criteria:**
- [ ] `GET /api/v2/vacancies` is called strictly once on startup (and on explicit user login/logout change), never passing query parameters, and navigating `/` → `/stat` → `/` triggers zero additional `/api/v2/vacancies` calls.
- [ ] `useMercureRealtime` and `applyVacancyUpdateToList` keep all vacancies in memory regardless of active `is_closed` or other filters.
- [ ] Client-side `matchesFilters` searches card-level fields (`title`, `company`, `ai_summary`, `tech_stack`, `tags`, `location`, `city`, `country`, `source`), and dynamic select builders preserve any active URL filter value in options even if 0 cards currently match.

**Verification:**
- [ ] Unit tests in `homeFilterHelpers.test.ts` pass; `npm --prefix frontend run lint` passes.

**Dependencies:** Task 1, Task 5  
**Files likely touched:**
- `frontend/src/store/BoardStoreContext.tsx`
- `frontend/src/store/boardMetadataHelpers.ts`
- `frontend/src/views/useMercureRealtime.ts`
- `frontend/src/views/homeFilterHelpers.ts`  
**Estimated scope:** Medium (4 files)

#### Task 7: Implement URL-driven Filters & Burst-History Search with `display: none`
**Description:** Refactor `useHomeVacanciesData.ts` and `useVacancyBoardActions.ts` so URL search params (`useSearchParams`) are the reactive source of truth for filters/search, hiding non-matching cards via `style={{ display: 'none' }}` (`hiddenVacancyIds`). Implement burst-grouped history recording for search (`push` on first edit in a burst, `replace` within 500 ms of continued typing) and fix `handleMoveAllClosedToRejected` to target only closed vacancies (`v.is_closed && v.status !== rejectedStatusId`).

**Acceptance criteria:**
- [ ] Opening a link with query params (e.g. `/?country=Germany&workplace_type=remote&search=go`) activates those filters immediately and hides non-matching cards with `display: none`.
- [ ] Changing any select/tag filter pushes a new URL entry (preserving `/vacancies/:id` pathname if a card is open); typing in search hides cards in `0 ms` and writes phrase-level steps to browser history so Back/Forward restores previous search/filter states and updates `display: none` cards.
- [ ] Columns where all cards are hidden via `display: none` remain visually blank (`EmptyState` renders only when `columnVacancies.length === 0`).
- [ ] `handleMoveAllClosedToRejected` moves only `v.is_closed` cards, never open cards.

**Verification:**
- [ ] `npm --prefix frontend run test` and `npm --prefix frontend run lint` pass.

**Dependencies:** Task 6  
**Files likely touched:**
- `frontend/src/views/useHomeVacanciesData.ts`
- `frontend/src/views/useVacancyBoardActions.ts`
- `frontend/src/views/HomeFilterSection.tsx`
- `frontend/src/views/homeFilterHelpers.test.ts`  
**Estimated scope:** Medium (4 files)

### Checkpoint 2: After Tasks 6–7
- [ ] Single startup fetch verified; zero network calls on filter/search/tab navigation.
- [ ] Browser Back/Forward across filter and search states updates controls and toggles `display: none` accurately.

---

### Phase 4: URL-Driven Vacancy Modal, Uncached Skeletons & 404 Handling

#### Task 8: Add `<Skeleton />` loading states to `VacancyModal` & uncached `/api/v2/vacancies/:id` loader
**Description:** Build `useVacancyDetailLoader` so every time `VacancyModal` opens for an `:id`, it starts with fresh detail loading state (no caching across opens), displays available list-level card info immediately, renders `@blueprint/ui-kit` `<Skeleton />` placeholders inside `VacancyCompanySection`, `VacancyHistorySection`, `VacancyNotesSection`, and `VacancyDescriptionSection` (`Raw Data` tab), and populates them once `GET /api/v2/vacancies/:id` resolves (or flags `notFound` on `404`/`403`).

**Acceptance criteria:**
- [ ] Opening a card immediately shows header/summary/salary/skills from the board card while rendering `<Skeleton />` blocks on Company Info, History, Notes, Raw Description, and Compatibility until `GET /api/v2/vacancies/:id` completes.
- [ ] Closing and reopening the same card (via click or browser Back) clears previous detail data, renders `<Skeleton />` again, and fetches fresh `GET /api/v2/vacancies/:id`.
- [ ] Cold-opening `/vacancies/:id` before the board list finishes loading shows skeletons gracefully and resolves to `<NotFoundPage />` if `GET /api/v2/vacancies/:id` returns `404` or `403`.

**Verification:**
- [ ] `npm --prefix frontend run typecheck` and `npm --prefix frontend run lint` pass (respecting `oxlint` complexity and max-lines rules).

**Dependencies:** Task 1, Task 5  
**Files likely touched:**
- `frontend/src/components/VacancyModal/useVacancyDetailLoader.ts`
- `frontend/src/components/VacancyModal/VacancyModal.tsx`
- `frontend/src/components/VacancyModal/VacancyCompanySection.tsx`
- `frontend/src/components/VacancyModal/VacancyHistorySection.tsx`
- `frontend/src/components/VacancyModal/VacancyNotesSection.tsx` & `VacancyDescriptionSection.tsx`  
**Estimated scope:** Medium (5–6 files)

#### Task 9: Connect `/vacancies/:id` route params to `VacancyModal` open/close, Back/Forward & 404
**Description:** Refactor `useHomeModalController.ts` and `HomePage.tsx` to drive modal visibility declaratively from React Router `useParams().id`, pushing `/vacancies/:id` (with current search params) on card click, always pushing `/` (with current search params) on modal close, and rendering `<NotFoundPage />` when `:id` is invalid or `notFound` is returned by the detail loader.

**Acceptance criteria:**
- [ ] Clicking card `#42` pushes `/vacancies/42` (preserving `?search=...&country=...`) and opens the modal.
- [ ] Closing the modal via X, Esc, or backdrop click **always pushes** `/` (preserving query params), so pressing browser **Back** reopens `/vacancies/42`.
- [ ] Browser Back/Forward opens and closes cards automatically without manual `popstate` listeners or board remounts.
- [ ] Invalid `/vacancies/abc` or missing/foreign `/vacancies/99999` renders `<NotFoundPage />` while keeping the URL intact.

**Verification:**
- [ ] `npm --prefix frontend run typecheck`, `npm --prefix frontend run lint`, and `npm --prefix frontend run build` pass.

**Dependencies:** Task 7, Task 8  
**Files likely touched:**
- `frontend/src/views/useHomeModalController.ts`
- `frontend/src/views/HomeModalsContainer.tsx`
- `frontend/src/views/HomePage.tsx`  
**Estimated scope:** Small (3 files)

---

### Phase 5: Docker Nginx/Vite Runner & End-to-End Verification

#### Task 10: Update `frontend/Dockerfile` (Nginx SPA runner + Vite dev) & Docker Compose files
**Description:** Replace the Next.js standalone Node container in `frontend/Dockerfile` with `nginx:1.27-alpine` in `runner` (serving Vite `dist/` on `:3000` with SPA fallback to `/index.html` and reverse-proxying `/api`, `/admin`, `/bundles`, `/admin-assets`, `/extension.zip`, `/.well-known` to `BACKEND_INTERNAL_URL` with fail-fast startup check) and Vite dev server on `:3000` in `dev`. Remove obsolete `.next` and `NEXT_TELEMETRY_DISABLED` settings from Compose files.

**Acceptance criteria:**
- [ ] `frontend/Dockerfile` `runner` builds cleanly, fails fast on startup if `BACKEND_INTERNAL_URL` is missing/empty, serves `/`, `/vacancies/123`, `/cv`, and unknown SPA paths with `index.html`, and proxies backend routes to `BACKEND_INTERNAL_URL`.
- [ ] `frontend/Dockerfile` `dev` runs `vite --host 0.0.0.0 --port 3000`.
- [ ] `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.override.yml.example`, `docker-compose.e2e.yml`, and `scripts/create-dokploy-env.mjs` contain zero `.next` or `NEXT_TELEMETRY_DISABLED` remnants while keeping `frontend:3000` compatible with Dokploy/Traefik.

**Verification:**
- [ ] `docker build --target runner -f frontend/Dockerfile .` succeeds and container serves SPA routes on `:3000`.

**Dependencies:** Task 9  
**Files likely touched:**
- `frontend/Dockerfile`
- `frontend/nginx.conf.template` & `frontend/docker-entrypoint.sh`
- `docker-compose.yml` & `docker-compose.dev.yml`
- `docker-compose.override.yml.example` & `docker-compose.e2e.yml`
- `scripts/create-dokploy-env.mjs`  
**Estimated scope:** Medium (5–6 files)

#### Task 11: Comprehensive Vitest SPA Routing, Filtering, History & Skeleton Test Suite
**Description:** Replace obsolete Next.js SSR tests with comprehensive Vitest + React Testing Library integration tests verifying all user-specified SPA behaviors and strict configuration rules.

**Acceptance criteria:**
- [ ] Tests verify `GET /api/v2/vacancies` is called strictly once without filter query params across initial load, filter changes, modal navigation, and `/` → `/about` → `/` transitions.
- [ ] Tests verify card open pushes `/vacancies/:id`, displays skeletons while `GET /api/v2/vacancies/:id` resolves, clears & re-shows skeletons on reopen (no cache), pushes `/` on close, and opens/closes on Back/Forward.
- [ ] Tests verify direct entry and Back/Forward with filter/search URLs toggle `style="display: none"` on non-matching cards while keeping empty-filtered columns blank.
- [ ] Tests verify `404`/`403` on `/vacancies/:id` and unknown paths render `NotFoundPage` without changing URL, and Mercure SSE events update the global store cleanly.

**Verification:**
- [ ] `npm --prefix frontend run test` — 100% green.
- [ ] `npm --prefix frontend run lint` & `npm --prefix frontend run lint:boundaries` — 0 errors.
- [ ] `npm --prefix frontend run typecheck` & `npm --prefix frontend run build` — 0 errors.

**Dependencies:** Task 9, Task 10  
**Files likely touched:**
- `frontend/src/spa_routing_and_filters.test.tsx`
- `frontend/src/api_v2_mercure_seam.test.tsx`
- `frontend/src/vite_proxy_config.test.ts`  
**Estimated scope:** Medium (3 files)

### Checkpoint 3: Complete (Definition of Done)
- [ ] All 11 tasks completed and verified.
- [ ] Frontend Vitest suite, Oxlint, TypeScript typecheck, Vite production build, Backend PHPUnit tests, and Docker `runner` image build all pass with 0 errors.
- [ ] Zero Next.js files, imports, or env vars remain.
- [ ] Strict compliance with Zero Implicit Fallbacks & No Default Function Parameters rules verified.

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Cold visit without cookies firing parallel API requests before guest session cookie is created | High | Bootstrap `authService.getMe()` in `AppShell` first; trigger `BoardStoreProvider` and remote settings fetch only after `authLoading` finishes and `user` is established. |
| Access token expiring during long-lived SPA session (previously refreshed by Next.js `middleware.ts` on navigation) | High | Add single-flight `POST /api/v2/auth/refresh` retry on `401` inside `apiClient.ts`. |
| Search input polluting browser history on every character or overwriting pre-search URL | Medium | Local input state drives `0 ms` `display: none` filtering; history uses burst-grouping (`push` on first keystroke of burst, `replace` within 500 ms window). |
| Stale `GET /api/v2/vacancies/:id` response arriving after user quickly switches to another card via Back/Forward | Medium | Pass `AbortSignal` / request token inside `useVacancyDetailLoader` so aborted/outdated responses never overwrite current modal state. |
| Strict `oxlint` limits (`complexity <= 7`, `max-lines-per-function <= 80`, `react/no-multi-comp`) | Low | Keep hooks and skeleton subcomponents modular (one component per file, small pure helper functions without default parameter values). |
