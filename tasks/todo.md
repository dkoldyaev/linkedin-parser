# Task Checklist: SPA Migration (Remove Next.js -> Vite + React Router v7)

## Phase 1: Backend Payload Separation
- [x] **Task 1:** Separate lightweight list fields (`vacancy:read`) from detail fields (`vacancy:detail`) in Symfony (`Vacancy.php`, `VacancyActionController.php`), keeping `VacancyFilterExtension.php` intact.

## Phase 2: Vite + React Router v7 Foundation & Next.js Removal
- [x] **Task 2:** Replace Next.js toolchain in `frontend/` with Vite 8 + `react-router-dom` v7 (`package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `vitest.config.ts`).
- [x] **Task 3:** Delete Next.js App Router (`frontend/src/app/**`), `next.config.mjs`, `next-env.d.ts`, `middleware.ts`, `middleware.test.ts`, and `serverApi.ts`; update `frontend/.gitignore`.
- [x] **Task 4:** Migrate `AppShell`, navigation links (`NavDrawer`, `PageHeader`, `HomeHeaderSection`, `AboutPage`, `LandingPage`) to `react-router-dom` and add silent `401` token refresh in `apiClient.ts`.
- [x] **Task 5:** Create `frontend/src/main.tsx`, `frontend/src/AppRouter.tsx`, and design-system `frontend/src/views/NotFoundPage.tsx`.
- [x] **Checkpoint 1:** Zero `next/*` imports remain; backend list/detail groups verified.

## Phase 3: Global Single-Load Store & CSS `display: none` URL Filtering
- [x] **Task 6:** Implement app-level `BoardStoreContext` (single `GET /api/v2/vacancies` call without query params on startup, persistent across routes, Mercure sync without dropping closed cards, client-derived `countries/cities/sources/tags`).
- [x] **Task 7:** Implement URL-driven filters & burst-history search (`useSearchParams` + `display: none` card hiding, blank filtered columns, fix `handleMoveAllClosedToRejected` to target only `v.is_closed`).
- [x] **Checkpoint 2:** Single startup fetch & Back/Forward filter/search `display: none` verified.

## Phase 4: URL-Driven Vacancy Modal, Uncached Skeletons & 404 Handling
- [x] **Task 8:** Implement `useVacancyDetailLoader` (uncached `GET /api/v2/vacancies/:id` on every open with cancellation) and `<Skeleton />` states in `VacancyModal` detail sections.
- [x] **Task 9:** Connect `/vacancies/:id` route params to `VacancyModal` (`push` `/vacancies/:id` on open, always `push` `/` on close, automatic Back/Forward, `<NotFoundPage />` on invalid/404/403).

## Phase 5: Docker Nginx/Vite Runner & Verification
- [x] **Task 10:** Update `frontend/Dockerfile` (`nginx:1.27-alpine` static SPA runner on `:3000` + Vite `dev` target; reverse proxy delegated to `docker-compose.override.yml` / Dokploy Traefik) and clean `.next`/`NEXT_TELEMETRY_DISABLED`/`BACKEND_INTERNAL_URL` from Compose/Dokploy files.
- [x] **Task 11:** Write Vitest SPA test suite covering single-fetch invariant, URL modal Back/Forward, uncached detail skeletons, `display: none` filter/search history, 404 page, and Mercure updates.
- [x] **Checkpoint 3 (Definition of Done):** All tests, `oxlint` on SPA modules, `typecheck`, `vite build`, and Symfony PHPUnit pass with 0 errors.
