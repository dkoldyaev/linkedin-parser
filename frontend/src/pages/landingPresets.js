/**
 * Role-specific Content Presets for the Interactive Blueprint Landing Page.
 *
 * Supported Roles:
 * 1. backend     - Senior / Staff Backend Engineer (Go, Kafka, PostgreSQL, Distributed Systems)
 * 2. frontend    - Senior / Staff Frontend Engineer (React 19, TypeScript, WebAssembly, Performance)
 * 3. designer    - Product / UX/UI Designer (Figma, Design Systems, UX Research, Prototyping)
 * 4. marketer    - Growth & Product Marketing Manager (CAC/LTV, Amplitude, GTM Strategy, B2B SaaS)
 * 5. ad_manager  - Performance Marketing & Traffic Lead (Meta Ads, Google Ads, AppsFlyer, ROAS)
 * 6. product     - Senior / Lead Product Manager (Roadmap, A/B Experiments, Checkout Conversion, P&L)
 */

export const DEFAULT_ROLE = 'backend';

/**
 * Resolves a content preset based on a GET-parameter (e.g. ?role=frontend).
 * Normalizes input, handles case-insensitivity, and matches common aliases.
 */
export function resolveRolePreset(rawRole) {
  if (!rawRole || typeof rawRole !== 'string') {
    return ROLE_PRESETS[DEFAULT_ROLE];
  }
  const normalized = rawRole.trim().toLowerCase();
  if (ROLE_PRESETS[normalized]) {
    return ROLE_PRESETS[normalized];
  }

  const aliasMap = {
    back: 'backend',
    be: 'backend',
    front: 'frontend',
    fe: 'frontend',
    design: 'designer',
    ui: 'designer',
    ux: 'designer',
    uiux: 'designer',
    marketing: 'marketer',
    growth: 'marketer',
    ad: 'ad_manager',
    ads: 'ad_manager',
    media_buyer: 'ad_manager',
    traffic: 'ad_manager',
    advert: 'ad_manager',
    advertising: 'ad_manager',
    pm: 'product',
    prod: 'product',
  };

  const matched = aliasMap[normalized];
  return matched && ROLE_PRESETS[matched]
    ? ROLE_PRESETS[matched]
    : ROLE_PRESETS[DEFAULT_ROLE];
}

export const ROLE_OPTIONS = [
  { key: 'backend', label: 'Бэкенд', labelEn: 'Backend', icon: '🛠', tag: 'GO · KAFKA · HIGHLOAD', tagEn: 'GO · KAFKA · HIGHLOAD' },
  { key: 'frontend', label: 'Фронтенд', labelEn: 'Frontend', icon: '⚡', tag: 'REACT · TS · WASM', tagEn: 'REACT · TS · WASM' },
  { key: 'designer', label: 'Дизайн', labelEn: 'Product Design', icon: '🎨', tag: 'FIGMA · DESIGN SYSTEMS', tagEn: 'FIGMA · DESIGN SYSTEMS' },
  { key: 'marketer', label: 'Маркетинг', labelEn: 'Marketing', icon: '📈', tag: 'GROWTH · B2B · CAC', tagEn: 'GROWTH · B2B · CAC' },
  { key: 'ad_manager', label: 'Реклама', labelEn: 'Ad & Performance', icon: '📢', tag: 'META · GOOGLE · ROAS', tagEn: 'META · GOOGLE · ROAS' },
  { key: 'product', label: 'Продакт', labelEn: 'Product Management', icon: '🧭', tag: 'ROADMAP · A/B · P&L', tagEn: 'ROADMAP · A/B · P&L' },
];

export const ROLE_PRESETS = {
  backend: {
    id: 'backend',
    label: 'Бэкенд-разработчик',
    labelEn: 'Backend Engineer',
    icon: '🛠',
    extractedLinks: [
      {
        id: 'li-backend-1',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4409263207/',
        shortUrl: 'linkedin.com/jobs/view/4409263207',
        title: 'Senior Backend Engineer (Payments)',
        company: 'Stripe',
        location: 'Berlin · Hybrid',
      },
      {
        id: 'li-backend-2',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4410891023/',
        shortUrl: 'linkedin.com/jobs/view/4410891023',
        title: 'Staff Product Engineer (Core Engine)',
        company: 'Linear',
        location: 'EU · Remote',
      },
      {
        id: 'li-backend-3',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4412004911/',
        shortUrl: 'linkedin.com/jobs/view/4412004911',
        title: 'Systems & Edge SRE',
        company: 'Cloudflare',
        location: 'Lisbon · Remote',
      },
    ],
    vacancies: [
      {
        id: 101,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4409263207/',
        title: 'Senior Backend Engineer (Payments)',
        company: 'Stripe',
        location: 'Berlin, Germany',
        workplace_type: 'hybrid',
        salary_min: 144000,
        salary_max: 168000,
        salary_currency: '$',
        salary_period: 'year',
        match_score: 84,
        ai_summary:
          'Разработка высоконагруженного ядра платежей и распределенного леджера (до 15 000 RPS). Требуется от 5 лет опыта с Go, PostgreSQL, Kafka, gRPC и эксплуатацией микросервисов в Kubernetes.',
        ai_summary_en:
          'Build high-throughput payment core and distributed ledger (up to 15,000 RPS). Requires 5+ years of experience with Go, PostgreSQL, Kafka, gRPC, and running microservices in Kubernetes.',
        company_info: 'Глобальная инфраструктура приема онлайн-платежей и финансового процессинга.',
        tech_stack: ['Go', 'PostgreSQL', 'Kafka', 'gRPC', 'Kubernetes'],
        tags: ['fintech', 'highload'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 2,
        has_comment: true,
      },
      {
        id: 102,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4410891023/',
        title: 'Staff Product Engineer (Core Engine)',
        company: 'Linear',
        location: 'Remote, EU',
        workplace_type: 'remote',
        salary_min: 9500,
        salary_max: 11500,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 79,
        ai_summary:
          'Развитие клиентского движка синхронизации данных и распределенных очередей задач. Опыт от 5 лет с Go/TypeScript, Redis и оптимизацией распределенных баз данных.',
        ai_summary_en:
          'Develop real-time data sync engine and distributed background workers. Requires 5+ years with Go/TypeScript, Redis, and distributed databases.',
        tech_stack: ['Go', 'TypeScript', 'Redis', 'PostgreSQL'],
        tags: ['remote', 'product'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 1,
        has_comment: false,
      },
      {
        id: 103,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4412004911/',
        title: 'Systems & Edge SRE',
        company: 'Cloudflare',
        location: 'Lisbon, Portugal',
        workplace_type: 'remote',
        salary_min: 8000,
        salary_max: 10000,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 91,
        ai_summary:
          'Поддержка и автоматизация глобальной anycast-сети и балансировщиков трафика на границе сети. Стек: Go, Rust, Linux eBPF, BGP, Terraform.',
        ai_summary_en:
          'Operate and automate global anycast network and edge load balancers. Stack: Go, Rust, Linux eBPF, BGP, Terraform.',
        tech_stack: ['Go', 'Rust', 'Linux', 'Terraform'],
        tags: ['remote', 'infra'],
        created_at: '13 мая',
        created_at_en: 'May 13',
        history_count: 3,
        has_comment: true,
      },
    ],
    bloatItems: [
      {
        id: 'bloat-1',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · О КОМПАНИИ',
        labelEn: 'CORPORATE FLUFF · WHO WE ARE',
        text: '🚀 Мы — гиперрастущий финтех-единорог, меняющий глобальную парадигму B2B-платежей! Мы верим в радикальную синергию, семейную атмосферу, проактивный майндсет и ищем визионера с горящими глазами.',
        textEn:
          '🚀 We are a hyper-growth fintech unicorn disrupting the global B2B payment paradigm! We believe in radical synergy, a fast-paced family culture, and bringing your 100% authentic visionary self.',
      },
      {
        id: 'bloat-2',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · КОГО МЫ ИЩЕМ',
        labelEn: 'CORPORATE FLUFF · WHO YOU ARE',
        text: '🌟 Ты — 10x рок-звезда и ниндзя кода, который обожает выходить из зоны комфорта, жонглировать приоритетами в условиях неопределенности и драйвить инсайты вместе с лидерами индустрии.',
        textEn:
          '🌟 You are a 10x rockstar ninja who thrives in ambiguity, loves stepping outside your comfort zone, wears multiple hats, and wakes up excited to move the needle with thought leaders.',
      },
      {
        id: 'bloat-3',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · ПЛЮШКИ',
        labelEn: 'CORPORATE FLUFF · PERKS',
        text: '🍕 У нас: молодой дружный коллектив, смузи, настольный футбол, пятничные ретроспективы, безлимитные печеньки и уникальная культура открытого фидбека!',
        textEn:
          '🍕 Perks: young vibrant team, smoothies, foosball tables, Friday retros, unlimited artisanal snacks, and a unique culture of radical candor!',
      },
      {
        id: 'core-4',
        isBloat: false,
        label: 'ЕДИНСТВЕННЫЙ АБЗАЦ ПО ДЕЛУ (СПРЯТАН В КОНЦЕ)',
        labelEn: 'THE ONLY REAL ENGINEERING PARAGRAPH (BURIED AT THE BOTTOM)',
        text: '🛠 Задачи и стек: разработка распределенного реестра транзакций на Go и PostgreSQL (до 15 000 RPS), шина событий Apache Kafka и gRPC, деплой в Kubernetes.',
        textEn:
          '🛠 Scope & Stack: build distributed payment ledgers in Go & PostgreSQL (up to 15,000 RPS), event streaming via Apache Kafka & gRPC, production deployment in Kubernetes.',
      },
    ],
    compatibility: {
      overall_score: 84,
      calculated_score: 82,
      matched_requirements: [
        {
          requirement: 'Go и микросервисная архитектура (5+ лет опыта)',
          requirementEn: 'Go & microservice architecture (5+ years experience)',
          evidence:
            'Цитата из CV: «Спроектировал и вывел в продакшен 14 микросервисов процессинга на Go 1.22 с пиковой нагрузкой до 12 000 RPS».',
          evidenceEn:
            'CV quote: "Designed and shipped 14 payment microservices in Go 1.22 handling up to 12,000 RPS peak load."',
        },
        {
          requirement: 'PostgreSQL: оптимизация запросов и партиционирование',
          requirementEn: 'PostgreSQL: query optimization & table partitioning',
          evidence:
            'Цитата из CV: «Партиционирование таблиц транзакций (4+ ТБ) в PostgreSQL 16, снижение p99 latency с 85 мс до 9 мс».',
          evidenceEn:
            'CV quote: "Partitioned 4+ TB transaction tables in PostgreSQL 16, cutting p99 latency from 85ms to 9ms."',
        },
        {
          requirement: 'Асинхронная шина Apache Kafka и контракты gRPC',
          requirementEn: 'Event streaming with Apache Kafka & gRPC contracts',
        },
      ],
      missing_requirements: [
        {
          requirement: 'Terraform / Infrastructure as Code',
          requirementEn: 'Terraform / Infrastructure as Code',
          severity: 'medium',
          reason: 'В резюме описана работа с Kubernetes и Helm, но Terraform явно не упомянут.',
          reasonEn: 'CV mentions Kubernetes and Helm, but Terraform is not explicitly listed.',
        },
        {
          requirement: 'Сертификация и аудит по стандарту PCI DSS',
          requirementEn: 'PCI DSS compliance & security audits',
          severity: 'low',
          reason: 'Указан опыт разработки платежного шлюза, но стандарт безопасности не назван.',
          reasonEn: 'Payment gateway experience is described, but PCI DSS is not named.',
        },
      ],
      critical_gaps: [
        {
          requirement: 'Гибридный график в офисе Берлина (3 дня в неделю)',
          requirementEn: 'Hybrid schedule in Berlin office (3 days/week)',
          reason:
            'В вашем CV указана локация Лиссабон и формат Full Remote — потребуется релокация или согласование удаленки.',
          reasonEn:
            'Your CV states Lisbon and Full Remote — relocation or remote approval will be required.',
        },
      ],
      recommendations: [
        'Вынесите метрики нагрузки (RPS и объем БД PostgreSQL) в первую строчку последнего места работы.',
        'Добавьте упоминание Terraform рядом с Kubernetes и CI/CD в блоке инфраструктурных навыков.',
        'Укажите стандарт PCI DSS в описании платежного проекта для прохождения ATS-скрининга.',
      ],
      recommendationsEn: [
        'Highlight throughput metrics (RPS and PostgreSQL DB size) in the first bullet of your latest role.',
        'Add Terraform next to Kubernetes and CI/CD in your infrastructure skills section.',
        'Mention PCI DSS explicitly in your payment gateway project to pass ATS screening.',
      ],
    },
  },

  frontend: {
    id: 'frontend',
    label: 'Фронтенд-разработчик',
    labelEn: 'Frontend Engineer',
    icon: '⚡',
    extractedLinks: [
      {
        id: 'li-front-1',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4413109201/',
        shortUrl: 'linkedin.com/jobs/view/4413109201',
        title: 'Staff Frontend Engineer (Performance)',
        company: 'Linear',
        location: 'EU · Remote',
      },
      {
        id: 'li-front-2',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4414092811/',
        shortUrl: 'linkedin.com/jobs/view/4414092811',
        title: 'Principal UI Engineer (Design Systems)',
        company: 'Vercel',
        location: 'Amsterdam · Hybrid',
      },
      {
        id: 'li-front-3',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4415812904/',
        shortUrl: 'linkedin.com/jobs/view/4415812904',
        title: 'Senior Web Graphics Engineer',
        company: 'Figma',
        location: 'London · Remote',
      },
    ],
    vacancies: [
      {
        id: 101,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4413109201/',
        title: 'Staff Frontend Engineer (Performance)',
        company: 'Linear',
        location: 'Remote, EU',
        workplace_type: 'remote',
        salary_min: 132000,
        salary_max: 156000,
        salary_currency: '$',
        salary_period: 'year',
        match_score: 88,
        ai_summary:
          'Разработка ультрабыстрого offline-first интерфейса на React 19, TypeScript и IndexedDB. Оптимизация 60 FPS рендеринга, кастомный виртуализатор списков и Web Workers.',
        ai_summary_en:
          'Build ultra-fast offline-first web client in React 19, TypeScript, and IndexedDB. 60 FPS rendering optimization, custom list virtualization, and Web Workers.',
        company_info: 'Инструмент управления разработкой нового поколения с акцентом на скорость отклика.',
        tech_stack: ['TypeScript', 'React 19', 'IndexedDB', 'Web Workers', 'Vite'],
        tags: ['frontend', 'performance'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 2,
        has_comment: true,
      },
      {
        id: 102,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4414092811/',
        title: 'Principal UI Engineer (Design Systems)',
        company: 'Vercel',
        location: 'Amsterdam, Netherlands',
        workplace_type: 'hybrid',
        salary_min: 10500,
        salary_max: 12500,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 82,
        ai_summary:
          'Развитие глобальной библиотеки headless-компонентов и дизайн-токенов. Поддержка Server Components (RSC), доступности (a11y) и микробенчмарков bundle size.',
        ai_summary_en:
          'Lead headless component architecture and design tokens across Next.js ecosystem. Deep focus on React Server Components (RSC), a11y, and bundle size.',
        tech_stack: ['Next.js', 'React', 'TypeScript', 'Tailwind', 'Radix UI'],
        tags: ['design-system', 'remote'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 1,
        has_comment: false,
      },
      {
        id: 103,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4415812904/',
        title: 'Senior Web Graphics Engineer',
        company: 'Figma',
        location: 'London, UK',
        workplace_type: 'remote',
        salary_min: 9500,
        salary_max: 11500,
        salary_currency: '£',
        salary_period: 'month',
        match_score: 74,
        ai_summary:
          'Рендеринг векторного холста редактора на WebGL и WebAssembly. Оптимизация потребления GPU-памяти и математика геометрических трансформаций векторных слоев.',
        ai_summary_en:
          'Render infinite vector canvas using WebGL, WebGPU, and WebAssembly. GPU memory profiling and matrix transformation algorithms for complex vector layers.',
        tech_stack: ['C++', 'WebAssembly', 'WebGL', 'TypeScript', 'GLSL'],
        tags: ['graphics', 'highload'],
        created_at: '13 мая',
        created_at_en: 'May 13',
        history_count: 3,
        has_comment: true,
      },
    ],
    bloatItems: [
      {
        id: 'bloat-front-1',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · О СТУДИИ',
        labelEn: 'CORPORATE FLUFF · CULTURE',
        text: '✨ Мы — дизайн-центричный стартап нового поколения! Ищем фронтенд-визионера, способного чувствовать каждый субпиксель и излучать творческую синергию.',
        textEn:
          '✨ We are a design-led hyper-scaling team building delightful magical experiences! We seek an intuitive frontend visionary who lives and breathes subpixel crafts.',
      },
      {
        id: 'bloat-front-2',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · КОГО МЫ ИЩЕМ',
        labelEn: 'CORPORATE FLUFF · WHO YOU ARE',
        text: '⚡ Ты — фронтенд-ниндзя, способный верстать с закрытыми глазами, вдохновлять стейкхолдеров и двигать пиксели со скоростью света!',
        textEn:
          '⚡ You are a CSS wizard and 10x UI craftsman who thrives in ambiguity, crafts joy with keyboard shortcuts, and champions craft over process!',
      },
      {
        id: 'bloat-front-3',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · БЕНЕФИТЫ',
        labelEn: 'CORPORATE FLUFF · PERKS',
        text: '☕ У нас: спешелти-кофе, безлимитные мониторы 5K Apple Studio Display, йога по средам и корпоративы в Лиссабоне.',
        textEn:
          '☕ Perks: artisanal pour-overs, unlimited 5K Apple Studio Displays, Wednesday breathwork, and annual offsites in sunny Lisbon.',
      },
      {
        id: 'core-front-4',
        isBloat: false,
        label: 'ЕДИНСТВЕННЫЙ АБЗАЦ ПО ДЕЛУ (СПРЯТАН В КОНЦЕ)',
        labelEn: 'THE ONLY REAL ENGINEERING PARAGRAPH (BURIED AT THE BOTTOM)',
        text: '🛠 Задачи и стек: разработка offline-first клиента на React 19 и TypeScript, синхронизация через WebSocket, минимизация TBT до <50ms и 60 FPS рендеринг списков на 50 000+ элементов.',
        textEn:
          '🛠 Scope & Stack: build offline-first web client in React 19 & TypeScript, WebSocket sync engine, keep TBT under 50ms, and ensure 60 FPS list virtualization over 50,000+ items.',
      },
    ],
    compatibility: {
      overall_score: 88,
      calculated_score: 86,
      matched_requirements: [
        {
          requirement: 'TypeScript и архитектура современного React (6+ лет опыта)',
          requirementEn: 'TypeScript & modern React architecture (6+ years experience)',
          evidence:
            'Цитата из CV: «Перевел ядро веб-клиента на React 19 и TypeScript strict mode, сократив время сборки на 40% и устранив 100% type-any».',
          evidenceEn:
            'CV quote: "Migrated web core to React 19 and TypeScript strict mode, cutting build times by 40% and eliminating 100% of untyped code."',
        },
        {
          requirement: 'Оптимизация Core Web Vitals и профилирование 60 FPS',
          requirementEn: 'Core Web Vitals & 60 FPS Chrome DevTools profiling',
          evidence:
            'Цитата из CV: «Снизил показатель INP с 280ms до 45ms и оптимизировал LCP до 1.1s за счет code-splitting и переноса тяжелых вычислений в Web Workers».',
          evidenceEn:
            'CV quote: "Cut INP from 280ms to 45ms and brought LCP to 1.1s via aggressive code-splitting and offloading heavy tasks to Web Workers."',
        },
        {
          requirement: 'Offline-First клиентское хранилище (IndexedDB / Dexie)',
          requirementEn: 'Offline-First local storage architecture (IndexedDB)',
        },
      ],
      missing_requirements: [
        {
          requirement: 'WebAssembly / Rust компиляция в браузер',
          requirementEn: 'WebAssembly / Rust compilation to browser targets',
          severity: 'medium',
          reason: 'В CV указан глубокий JS/TS опыт, но нет продакшен-проектов с Wasm.',
          reasonEn: 'Deep JS/TS experience in CV, but no production Wasm modules listed.',
        },
        {
          requirement: 'Написание сквозных e2e тестов в Playwright',
          requirementEn: 'End-to-end testing with Playwright',
          severity: 'low',
          reason: 'В резюме подробно описан Cypress, переход на Playwright займет минимум времени.',
          reasonEn: 'Cypress is thoroughly documented in CV; Playwright will be a fast ramp-up.',
        },
      ],
      critical_gaps: [
        {
          requirement: 'Гибридный офис в Амстердаме (2 дня в неделю)',
          requirementEn: 'Hybrid schedule in Amsterdam office (2 days/week)',
          reason:
            'В резюме указан Лиссабон и Full Remote — потребуется согласовать 100% удаленку или релокационный пакет.',
          reasonEn:
            'CV states Lisbon and Full Remote — 100% remote exception or relocation required.',
        },
      ],
      recommendations: [
        'Вынесите показатели Core Web Vitals (LCP 1.1s, INP 45ms) в верхний блок Summary вашего резюме.',
        'Укажите Playwright рядом с Cypress в блоке Testing (опишите опыт E2E-автоматизации).',
        'Прикрепите ссылку на живой GitHub-профиль или сложный интерактивный demo-компонент.',
      ],
      recommendationsEn: [
        'Highlight Core Web Vitals wins (LCP 1.1s, INP 45ms) in the top Summary section of your CV.',
        'Add Playwright alongside Cypress under Testing skills.',
        'Link to live open-source work or an interactive complex UI component demo.',
      ],
    },
  },

  designer: {
    id: 'designer',
    label: 'Продуктовый дизайнер',
    labelEn: 'Product Designer',
    icon: '🎨',
    extractedLinks: [
      {
        id: 'li-des-1',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4416991002/',
        shortUrl: 'linkedin.com/jobs/view/4416991002',
        title: 'Staff Product Designer (Core UX)',
        company: 'Airbnb',
        location: 'Dublin · Hybrid',
      },
      {
        id: 'li-des-2',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4417002931/',
        shortUrl: 'linkedin.com/jobs/view/4417002931',
        title: 'Lead Design Systems Designer',
        company: 'Revolut',
        location: 'London · Remote',
      },
      {
        id: 'li-des-3',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4418129033/',
        shortUrl: 'linkedin.com/jobs/view/4418129033',
        title: 'Senior Product Designer (Growth)',
        company: 'Notion',
        location: 'EU · Remote',
      },
    ],
    vacancies: [
      {
        id: 101,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4416991002/',
        title: 'Staff Product Designer (Core UX)',
        company: 'Airbnb',
        location: 'Dublin, Ireland',
        workplace_type: 'hybrid',
        salary_min: 120000,
        salary_max: 144000,
        salary_currency: '$',
        salary_period: 'year',
        match_score: 86,
        ai_summary:
          'Проектирование сквозных сценариев бронирования и чекаута на миллионной аудитории. Развитие компонентной базы Figma, проведение юзабилити-тестов и защита дизайн-решений.',
        ai_summary_en:
          'Lead end-to-end checkout and booking flows for millions of global guests. Advance Figma component architecture, run quantitative usability tests, and mentor product teams.',
        company_info: 'Глобальная платформа для путешествий и краткосрочной аренды жилья.',
        tech_stack: ['Figma', 'Design Systems', 'User Research', 'Prototyping', 'CJM'],
        tags: ['product-design', 'ux-ui'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 2,
        has_comment: true,
      },
      {
        id: 102,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4417002931/',
        title: 'Lead Design Systems Designer',
        company: 'Revolut',
        location: 'London, UK',
        workplace_type: 'remote',
        salary_min: 8500,
        salary_max: 10500,
        salary_currency: '£',
        salary_period: 'month',
        match_score: 92,
        ai_summary:
          'Развитие мультиплатформенной дизайн-системы (iOS, Android, Web). Внедрение дизайн-токенов W3C, авто-лейаутов, переменных (Variables) и гайдлайнов доступности WCAG 2.1 AA.',
        ai_summary_en:
          'Maintain multi-platform design system (iOS, Android, Web). Architect W3C design tokens, nested auto-layouts, Figma Variables, and WCAG 2.1 AA accessibility guidelines.',
        tech_stack: ['Figma Variables', 'Tokens Studio', 'WCAG 2.1', 'Storybook', 'iOS/Android'],
        tags: ['design-system', 'fintech'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 1,
        has_comment: false,
      },
      {
        id: 103,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4418129033/',
        title: 'Senior Product Designer (Growth)',
        company: 'Notion',
        location: 'Remote, EU',
        workplace_type: 'remote',
        salary_min: 9000,
        salary_max: 11000,
        salary_currency: '$',
        salary_period: 'month',
        match_score: 78,
        ai_summary:
          'Проектирование воронок онбординга, активации новых команд и вирального шеринга. Коллаборация с Product Managers и Growth-инженерами по результатам A/B тестов.',
        ai_summary_en:
          'Design self-serve onboarding, team activation funnels, and viral workspace sharing mechanics in close partnership with Growth PMs and engineers.',
        tech_stack: ['Figma', 'ProtoPie', 'A/B Testing', 'Growth UX', 'Mixpanel'],
        tags: ['growth', 'remote'],
        created_at: '13 мая',
        created_at_en: 'May 13',
        history_count: 3,
        has_comment: true,
      },
    ],
    bloatItems: [
      {
        id: 'bloat-des-1',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · О ДИЗАЙН-КУЛЬТУРЕ',
        labelEn: 'CORPORATE FLUFF · PHILOSOPHY',
        text: '🎨 Мы создаем эмоциональный резонанс между человеком и цифровой вселенной! Ищем дизайн-визионера с глубокой эмпатией и чувством прекрасного.',
        textEn:
          '🎨 We create profound emotional resonance between humans and the digital cosmos! We seek a soulful design visionary with radical empathy.',
      },
      {
        id: 'bloat-des-2',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · КОГО МЫ ИЩЕМ',
        labelEn: 'CORPORATE FLUFF · WHO YOU ARE',
        text: '🌈 Ты — T-shaped творец, влюбленный в типографику, готовый фасилитировать воркшопы дизайн-мышления и генерировать вау-эффект в каждой итерации!',
        textEn:
          '🌈 You are a T-shaped design thinker, font purist, and storytelling pioneer who thrives when turning complex ambiguity into breathtaking simplicity!',
      },
      {
        id: 'bloat-des-3',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · ПЛЮШКИ',
        labelEn: 'CORPORATE FLUFF · PERKS',
        text: '🥑 У нас: кресла Herman Miller Embody, безлимитный матча-латте, подписки на шрифтовые студии и музейные абонементы.',
        textEn:
          '🥑 Perks: Herman Miller Embody chairs, bespoke ceremonial matcha, boundless type foundry budgets, and global museum passes.',
      },
      {
        id: 'core-des-4',
        isBloat: false,
        label: 'ЕДИНСТВЕННЫЙ АБЗАЦ ПО ДЕЛУ (СПРЯТАН В КОНЦЕ)',
        labelEn: 'THE ONLY REAL SCOPE PARAGRAPH (BURIED AT THE BOTTOM)',
        text: '🛠 Задачи и стек: проектирование сценариев платежного онбординга в Figma, токенизация компонентов (Figma Variables), проведение 15+ глубинных интервью в месяц и рост конверсии воронки на +14%.',
        textEn:
          '🛠 Scope & Stack: design payment onboarding flows in Figma, tokenized component libraries (Figma Variables), 15+ qualitative user interviews per month, driving +14% funnel conversion.',
      },
    ],
    compatibility: {
      overall_score: 86,
      calculated_score: 84,
      matched_requirements: [
        {
          requirement: 'Масштабные дизайн-системы и токены в Figma (5+ лет)',
          requirementEn: 'Design systems architecture & tokens in Figma (5+ years)',
          evidence:
            'Цитата из CV: «Спроектировал и поддерживал кросс-платформенную дизайн-систему из 240+ компонентов и 80 переменных (Variables), сократив time-to-market экранов на 35%».',
          evidenceEn:
            'CV quote: "Architected multi-platform design system with 240+ components and 80 Figma Variables, cutting screen time-to-market by 35%."',
        },
        {
          requirement: 'Проведение UX-исследований и количественных тестов',
          requirementEn: 'User research, CJM mapping & usability testing',
          evidence:
            'Цитата из CV: «Провел 45 юзабилити-тестов сценария чекаута, устранил 8 критических UX-барьеров и поднял конверсию шага оплаты на +12.4%».',
          evidenceEn:
            'CV quote: "Conducted 45 usability sessions on checkout flows, removing 8 friction points and raising payment step conversion by +12.4%."',
        },
        {
          requirement: 'Адаптивный дизайн и стандарты доступности (WCAG 2.1 AA)',
          requirementEn: 'Responsive web/mobile patterns & WCAG 2.1 AA accessibility',
        },
      ],
      missing_requirements: [
        {
          requirement: 'Интерактивное микро-прототипирование в ProtoPie',
          requirementEn: 'Complex sensor & variable prototyping in ProtoPie',
          severity: 'medium',
          reason: 'В портфолио показаны кликабельные прототипы Figma, но ProtoPie явно не упомянут.',
          reasonEn: 'Figma interactive prototypes shown in portfolio; ProtoPie not explicitly listed.',
        },
        {
          requirement: 'Базовый 3D-моделинг (Blender / Spline)',
          requirementEn: 'Basic 3D asset workflows (Blender / Spline)',
          severity: 'low',
          reason: 'Желательный навык для промо-страниц, не блокирует продуктовую работу.',
          reasonEn: 'Nice-to-have skill for marketing handoffs, non-blocking for core product UX.',
        },
      ],
      critical_gaps: [
        {
          requirement: 'Наличие кейсов под паролем (NDA-кейсы финтех-чекаута)',
          requirementEn: 'Password-protected portfolio with NDA fintech case studies',
          reason:
            'В открытом CV ссылка ведет на Dribbble без разбора продуктовых метрик — требуется кейс-стади с паролем.',
          reasonEn:
            'CV links to visual Dribbble shots without deep metric breakdowns — password-protected case study required.',
        },
      ],
      recommendations: [
        'Разместите ссылку на подробное портфолио с паролем в первой строчке шапки резюме.',
        'Оцифруйте бизнес-результаты каждого кейса (конверсия, Task Success Rate, SUS score).',
        'Добавьте ProtoPie в список инструментов интерактивного прототипирования.',
      ],
      recommendationsEn: [
        'Place your password-protected portfolio link directly in the top header of your CV.',
        'Quantify business impact for each case study (conversion lift, Task Success Rate, SUS score).',
        'Add ProtoPie under advanced prototyping tools.',
      ],
    },
  },

  marketer: {
    id: 'marketer',
    label: 'Маркетолог',
    labelEn: 'Growth Marketer',
    icon: '📈',
    extractedLinks: [
      {
        id: 'li-mkt-1',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4419203911/',
        shortUrl: 'linkedin.com/jobs/view/4419203911',
        title: 'Head of Growth Marketing (EMEA)',
        company: 'Wise',
        location: 'London · Hybrid',
      },
      {
        id: 'li-mkt-2',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4420192804/',
        shortUrl: 'linkedin.com/jobs/view/4420192804',
        title: 'Senior Product Marketing Manager',
        company: 'Miro',
        location: 'Amsterdam · Remote',
      },
      {
        id: 'li-mkt-3',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4421902811/',
        shortUrl: 'linkedin.com/jobs/view/4421902811',
        title: 'Lead B2B Marketing Manager (SaaS)',
        company: 'Datadog',
        location: 'Paris · Remote',
      },
    ],
    vacancies: [
      {
        id: 101,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4419203911/',
        title: 'Head of Growth Marketing (EMEA)',
        company: 'Wise',
        location: 'London, UK',
        workplace_type: 'hybrid',
        salary_min: 108000,
        salary_max: 132000,
        salary_currency: '£',
        salary_period: 'year',
        match_score: 85,
        ai_summary:
          'Масштабирование каналов привлечения B2B-клиентов в регионе EMEA с бюджетом $350,000/мес. Оптимизация LTV/CAC, проведение когортного анализа и руководство growth-командой.',
        ai_summary_en:
          'Scale B2B acquisition channels across EMEA with a $350k/mo budget. Optimize LTV/CAC ratios, build cohort retention models, and lead cross-functional growth squad.',
        company_info: 'Международный финтех-сервис прозрачных трансграничных переводов и счетов.',
        tech_stack: ['Amplitude', 'Mixpanel', 'HubSpot', 'Google Analytics 4', 'SQL'],
        tags: ['growth', 'b2b', 'fintech'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 2,
        has_comment: true,
      },
      {
        id: 102,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4420192804/',
        title: 'Senior Product Marketing Manager',
        company: 'Miro',
        location: 'Amsterdam, Netherlands',
        workplace_type: 'remote',
        salary_min: 8500,
        salary_max: 10500,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 89,
        ai_summary:
          'Позиционирование и запуск новых Enterprise-продуктов (Go-To-Market стратегии). Создание ценностных предложений, sales enablement материалов и конкурентный анализ (CI).',
        ai_summary_en:
          'Position and launch new Enterprise collaboration products (GTM strategy). Build high-converting value propositions, sales enablement collateral, and win/loss analysis.',
        tech_stack: ['GTM Strategy', 'Salesforce', 'Product Positioning', 'Crayon'],
        tags: ['product-marketing', 'enterprise'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 1,
        has_comment: false,
      },
      {
        id: 103,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4421902811/',
        title: 'Lead B2B Marketing Manager (SaaS)',
        company: 'Datadog',
        location: 'Paris, France',
        workplace_type: 'remote',
        salary_min: 8000,
        salary_max: 10000,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 76,
        ai_summary:
          'Лидогенерация для отдела корпоративных продаж (Enterprise Account-Based Marketing). Запуск омниканальных кампаний (LinkedIn Ads, вебинары, отраслевые саммиты).',
        ai_summary_en:
          'Drive enterprise pipeline via Account-Based Marketing (ABM). Execute multi-touch omnichannel campaigns across LinkedIn Ads, executive roundtables, and industry summits.',
        tech_stack: ['Marketo', 'Demandbase', 'LinkedIn Campaign Manager', 'Tableau'],
        tags: ['abm', 'lead-gen'],
        created_at: '13 мая',
        created_at_en: 'May 13',
        history_count: 3,
        has_comment: true,
      },
    ],
    bloatItems: [
      {
        id: 'bloat-mkt-1',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · О МАРКЕТИНГОВОЙ ЛАБОРАТОРИИ',
        labelEn: 'CORPORATE FLUFF · CULTURE',
        text: '🚀 Мы — взрывная growth-лаборатория, переосмысливающая ландшафт цифрового маркетинга! Ищем сторителлера с искрой в глазах, готового взрывать инфополе.',
        textEn:
          '🚀 We are an explosive growth engine redefining the digital marketing galaxy! Seeking an authentic storyteller ready to create virality and disrupt the zeitgeist.',
      },
      {
        id: 'bloat-mkt-2',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · ПОРТРЕТ КАНДИДАТА',
        labelEn: 'CORPORATE FLUFF · WHO YOU ARE',
        text: '📢 Ты — growth-хакер экстра-класса, умеющий читать мысли целевой аудитории, жонглировать гипотезами и масштабировать воронки до луны!',
        textEn:
          '📢 You are an omni-channel growth ninja with an insatiable appetite for hyper-scale, wearing multiple hats, and synthesizing qualitative intuition with big data!',
      },
      {
        id: 'bloat-mkt-3',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · ПЛЮШКИ',
        labelEn: 'CORPORATE FLUFF · PERKS',
        text: '🎉 У нас: корпоративные выезды на Бали, безлимитный бюджет на обучение, авторский мерч и открытая культура без иерархий.',
        textEn:
          '🎉 Perks: annual Bali retreats, unlimited personal growth budgets, cult-favorite merch drops, and a flat meritocratic hierarchy.',
      },
      {
        id: 'core-mkt-4',
        isBloat: false,
        label: 'ЕДИНСТВЕННЫЙ АБЗАЦ ПО ДЕЛУ (СПРЯТАН В КОНЦЕ)',
        labelEn: 'THE ONLY REAL BUSINESS PARAGRAPH (BURIED AT THE BOTTOM)',
        text: '🛠 Задачи и стек: управление маркетинговым бюджетом $350k/мес, снижение CAC на 22% при росте LTV, запуск 20+ A/B тестов посадочных страниц и сквозная аналитика в Amplitude и SQL.',
        textEn:
          '🛠 Scope & Stack: manage $350k/mo marketing spend, cut CAC by 22% while increasing LTV, run 20+ landing page A/B tests, and build full-funnel attribution in Amplitude & SQL.',
      },
    ],
    compatibility: {
      overall_score: 85,
      calculated_score: 83,
      matched_requirements: [
        {
          requirement: 'Управление маркетинговым спендом от $200k/мес и аналитика воронки',
          requirementEn: 'Managing $200k+/mo paid media budgets & funnel analytics',
          evidence:
            'Цитата из CV: «Управлял перформанс-бюджетом $280k/мес в B2B SaaS, снизил стоимость квалифицированного лида (SQL) на 26% при сохранении объемов».',
          evidenceEn:
            'CV quote: "Managed $280k/mo B2B SaaS acquisition budget, cutting Cost Per Sales Qualified Lead (SQL) by 26% while scaling volume."',
        },
        {
          requirement: 'Сквозная продуктовая и маркетинговая аналитика (Amplitude, SQL)',
          requirementEn: 'Product & growth analytics in Amplitude and raw SQL',
          evidence:
            'Цитата из CV: «Построил когортные дашборды в Amplitude и написал 30+ SQL-моделей для расчета когортного удержания (Retention D30/D90)».',
          evidenceEn:
            'CV quote: "Built cohort analytics models in Amplitude and authored 30+ SQL queries tracking D30/D90 enterprise retention curves."',
        },
        {
          requirement: 'Успешные Go-To-Market запуски продуктов на международные рынки',
          requirementEn: 'Proven international Go-To-Market launches for SaaS',
        },
      ],
      missing_requirements: [
        {
          requirement: 'Опыт работы с ABM-платформами (Demandbase / 6sense)',
          requirementEn: 'Hands-on experience with ABM suites (Demandbase / 6sense)',
          severity: 'medium',
          reason: 'В CV указан LinkedIn Campaign Manager и HubSpot, но нет специализированных ABM-платформ.',
          reasonEn: 'LinkedIn Campaign Manager and HubSpot documented; specialized ABM suites not listed.',
        },
        {
          requirement: 'Продвинутая настройка автоматизации в Marketo',
          requirementEn: 'Enterprise lead scoring and automation in Marketo',
          severity: 'low',
          reason: 'В резюме подробно описан HubSpot Enterprise, переход на Marketo не составит труда.',
          reasonEn: 'HubSpot Enterprise mastery documented; Marketo ramp-up will be straightforward.',
        },
      ],
      critical_gaps: [
        {
          requirement: 'Свободный бизнес-английский (C2 / Native) для публичных выступлений в Лондоне',
          requirementEn: 'Fluent executive English (C2 / Native) for London keynote presentations',
          reason:
            'В резюме указан уровень Upper-Intermediate (B2/C1) — для роли Head of Growth потребуется подтвердить C2.',
          reasonEn:
            'CV lists B2/C1 level — executive client facing and keynote presentations require verified C2.',
        },
      ],
      recommendations: [
        'Вынесите ключевые финансовые показатели (ROMI 340%, снижение CAC -26%) в верхнюю строчку резюме.',
        'Укажите опыт миграции с HubSpot на крупные Enterprise-системы.',
        'Прикрепите ссылки на публичные выступления, статьи или кейсы успешных продуктовых запусков.',
      ],
      recommendationsEn: [
        'Put headline ROI achievements (ROMI 340%, -26% CAC reduction) at the very top of your CV.',
        'Detail your experience with CRM/automation migrations towards enterprise stacks.',
        'Include links to published whitepapers, webinars, or product launch case studies.',
      ],
    },
  },

  ad_manager: {
    id: 'ad_manager',
    label: 'Менеджер по рекламе',
    labelEn: 'Ad & Performance Manager',
    icon: '📢',
    extractedLinks: [
      {
        id: 'li-ad-1',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4422891002/',
        shortUrl: 'linkedin.com/jobs/view/4422891002',
        title: 'Senior Performance Marketing Manager',
        company: 'Wolt / DoorDash',
        location: 'Helsinki · Remote',
      },
      {
        id: 'li-ad-2',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4423019284/',
        shortUrl: 'linkedin.com/jobs/view/4423019284',
        title: 'Lead User Acquisition Manager (Apps)',
        company: 'Bolt',
        location: 'Tallinn · Hybrid',
      },
      {
        id: 'li-ad-3',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4424910281/',
        shortUrl: 'linkedin.com/jobs/view/4424910281',
        title: 'Global Paid Social & Search Lead',
        company: 'Delivery Hero',
        location: 'Berlin · Remote',
      },
    ],
    vacancies: [
      {
        id: 101,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4422891002/',
        title: 'Senior Performance Marketing Manager',
        company: 'Wolt / DoorDash',
        location: 'Helsinki, Finland',
        workplace_type: 'remote',
        salary_min: 84000,
        salary_max: 102000,
        salary_currency: '€',
        salary_period: 'year',
        match_score: 87,
        ai_summary:
          'Закупка и оптимизация платного трафика в Meta Ads, Google Ads и TikTok с месячным спендом от $400,000. Работа с мобильной атрибуцией (AppsFlyer, SKAdNetwork 4.0) и креативными связками.',
        ai_summary_en:
          'Buy and scale performance media across Meta, Google Ads, and TikTok with $400k+/mo ad spend. Deep mobile measurement via AppsFlyer, SKAN 4.0, and creative iteration loops.',
        company_info: 'Международная технологическая платформа быстрой доставки еды и товаров.',
        tech_stack: ['Meta Ads', 'Google Ads', 'AppsFlyer', 'TikTok Ads', 'Looker'],
        tags: ['performance', 'user-acquisition'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 2,
        has_comment: true,
      },
      {
        id: 102,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4423019284/',
        title: 'Lead User Acquisition Manager (Apps)',
        company: 'Bolt',
        location: 'Tallinn, Estonia',
        workplace_type: 'hybrid',
        salary_min: 7500,
        salary_max: 9500,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 90,
        ai_summary:
          'Масштабирование платного привлечения водителей и пассажиров в 18 странах. A/B тестирование креативов, расчет CPI/CPA/LTV, предотвращение ad fraud и работа с Apple Search Ads.',
        ai_summary_en:
          'Scale paid rider and driver acquisition across 18 countries. Creative A/B testing, CPI/CPA/LTV attribution, anti-ad-fraud filters, and Apple Search Ads campaigns.',
        tech_stack: ['Apple Search Ads', 'Adjust', 'Meta Ads', 'Python/SQL'],
        tags: ['mobile-ua', 'growth'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 1,
        has_comment: false,
      },
      {
        id: 103,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4424910281/',
        title: 'Global Paid Social & Search Lead',
        company: 'Delivery Hero',
        location: 'Berlin, Germany',
        workplace_type: 'remote',
        salary_min: 8000,
        salary_max: 10000,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 81,
        ai_summary:
          'Стратегия закупки поискового и контекстного трафика (PMax, Search, YouTube). Управление агентствами, сквозная мультиканальная атрибуция и автоматизация ставок по tCPA.',
        ai_summary_en:
          'Global paid search and video media strategy (Performance Max, Google Search, YouTube). Agency management, multi-touch attribution, and automated smart bidding.',
        tech_stack: ['Google Ads API', 'Search Ads 360', 'BigQuery', 'Tableau'],
        tags: ['paid-search', 'automation'],
        created_at: '13 мая',
        created_at_en: 'May 13',
        history_count: 3,
        has_comment: true,
      },
    ],
    bloatItems: [
      {
        id: 'bloat-ad-1',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · О ПЕРФОРМАНС-ДНК',
        labelEn: 'CORPORATE FLUFF · CULTURE',
        text: '🔥 Ищем рок-звезду платного трафика и повелителя рекламных алгоритмов! Мы жжем бюджеты со смыслом и превращаем клики в чистую прибыль.',
        textEn:
          '🔥 Seeking an ad-spend rockstar and bidding algorithm conqueror! We turn clicks into cashflow and engineer exponential scale through raw performance intuition.',
      },
      {
        id: 'bloat-ad-2',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · КОГО МЫ ИЩЕМ',
        labelEn: 'CORPORATE FLUFF · WHO YOU ARE',
        text: '🎯 Ты — гуру таргета и виртуоз креативных связок, чувствующий настроение алгоритмов Meta на кончиках пальцев!',
        textEn:
          '🎯 You are a paid media maestro who lives inside Meta Ads Manager, reverse-engineers TikTok algorithms, and optimizes auction bidding in your sleep!',
      },
      {
        id: 'bloat-ad-3',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · БЕНЕФИТЫ',
        labelEn: 'CORPORATE FLUFF · PERKS',
        text: '🍕 Плюшки: скидки 50% на доставку еды, абонемент в фитнес-клуб, топовый ноутбук и свободный график работы.',
        textEn:
          '🍕 Perks: 50% food delivery stipends, premium gym memberships, flagship laptops, and asynchronous freedom.',
      },
      {
        id: 'core-ad-4',
        isBloat: false,
        label: 'ЕДИНСТВЕННЫЙ АБЗАЦ ПО ДЕЛУ (СПРЯТАН В КОНЦЕ)',
        labelEn: 'THE ONLY REAL MEDIA-BUYING PARAGRAPH (BURIED AT THE BOTTOM)',
        text: '🛠 Задачи и стек: управление рекламным бюджетом от $400,000/мес в Meta Ads и Google Ads, удержание ROAS > 280%, настройка postback-событий в AppsFlyer и SKAN 4.0, масштабирование связок.',
        textEn:
          '🛠 Scope & Stack: manage $400k+/mo across Meta Ads & Google Ads, maintain ROAS > 280%, configure server-to-server postbacks in AppsFlyer & SKAN 4.0, and scale winning creative angles.',
      },
    ],
    compatibility: {
      overall_score: 87,
      calculated_score: 85,
      matched_requirements: [
        {
          requirement: 'Опыт управления бюджетами от $250k/мес в Meta Ads и Google Ads',
          requirementEn: 'Scaling paid social & search budgets beyond $250k/mo',
          evidence:
            'Цитата из CV: «Управлял месячным рекламным бюджетом $380,000 в 12 гео, масштабировал кампании при сохранении целевого ROAS 290%».',
          evidenceEn:
            'CV quote: "Scaled monthly paid media spend to $380,000 across 12 countries while preserving target ROAS at 290%."',
        },
        {
          requirement: 'Мобильная атрибуция и аналитика (AppsFlyer, Adjust, SKAN 4.0)',
          requirementEn: 'Mobile app measurement (AppsFlyer, Adjust, SKAN 4.0)',
          evidence:
            'Цитата из CV: «Внедрил схему конверсий SKAdNetwork 4.0 и кастомные postback-события в AppsFlyer, снизив потерю атрибуции на 18%».',
          evidenceEn:
            'CV quote: "Implemented SKAN 4.0 coarse/fine conversion value schema and custom S2S postbacks in AppsFlyer, reducing untracked attribution by 18%."',
        },
        {
          requirement: 'Креативное A/B тестирование и работа с видео-моушн дизайнерами',
          requirementEn: 'Creative testing frameworks & UGC motion video pipelines',
        },
      ],
      missing_requirements: [
        {
          requirement: 'Автоматизация закупки через Google Ads Scripts / Marketing API',
          requirementEn: 'Custom bid automation via Google Ads Scripts & Marketing APIs',
          severity: 'medium',
          reason: 'В CV указан ручной и полуавтоматический smart-bidding, навыки скриптинга не описаны.',
          reasonEn: 'Smart-bidding documented in CV; Python/JavaScript bidding scripts not listed.',
        },
        {
          requirement: 'Опыт закупки в программатик-сетях (DV360 / The Trade Desk)',
          requirementEn: 'Programmatic DSP execution (DV360 / The Trade Desk)',
          severity: 'low',
          reason: 'Вакансия фокусируется на Paid Social/Search, DSP является вторичным каналом.',
          reasonEn: 'Primary focus is Meta/Google; DSP experience is an auxiliary bonus.',
        },
      ],
      critical_gaps: [
        {
          requirement: 'Обязателен опыт работы с бюджетами от $300k/мес в e-commerce / delivery приложениях',
          requirementEn: 'Mandatory experience managing $300k+/mo in food delivery/e-commerce apps',
          reason:
            'В резюме подтвержден опыт со спендом $380k/мес — совпадение подтверждено, критических стоп-факторов нет.',
          reasonEn:
            'CV validates $380k/mo spend in high-growth app — fully matched, zero critical blockers.',
        },
      ],
      recommendations: [
        'Вынесите суммарный управляемый бюджет ($5M+) и средний ROAS в заголовок резюме.',
        'Добавьте примеры связок (Hook Rate, CTR, ROAS, blended CPA) в описании последних кампаний.',
        'Подтвердите знание базового SQL для выгрузки сырых логов атрибуции из AppsFlyer.',
      ],
      recommendationsEn: [
        'Display lifetime managed budget ($5M+) and blended ROAS in your CV header.',
        'Add creative performance metrics (Hook Rate, CTR, ROAS, blended CPA) to campaign bullets.',
        'Highlight SQL competency for querying raw AppsFlyer/Adjust attribution events.',
      ],
    },
  },

  product: {
    id: 'product',
    label: 'Продакт-менеджер',
    labelEn: 'Product Manager',
    icon: '🧭',
    extractedLinks: [
      {
        id: 'li-pm-1',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4425810291/',
        shortUrl: 'linkedin.com/jobs/view/4425810291',
        title: 'Senior Product Manager (Payments & Checkout)',
        company: 'Klarna',
        location: 'Stockholm · Hybrid',
      },
      {
        id: 'li-pm-2',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4426019283/',
        shortUrl: 'linkedin.com/jobs/view/4426019283',
        title: 'Staff Technical Product Manager',
        company: 'Deliveroo',
        location: 'London · Remote',
      },
      {
        id: 'li-pm-3',
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4427819201/',
        shortUrl: 'linkedin.com/jobs/view/4427819201',
        title: 'Lead Product Manager (Driver Core)',
        company: 'Bolt',
        location: 'Berlin · Remote',
      },
    ],
    vacancies: [
      {
        id: 101,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4425810291/',
        title: 'Senior Product Manager (Payments & Checkout)',
        company: 'Klarna',
        location: 'Stockholm, Sweden',
        workplace_type: 'hybrid',
        salary_min: 96000,
        salary_max: 120000,
        salary_currency: '€',
        salary_period: 'year',
        match_score: 89,
        ai_summary:
          'Владение дорожной картой платежного чекаута (20M+ MAU). Рост конверсии платежного шлюза, запуск BNPL-сценариев, приоритизация бэклога по RICE и руководство командой из 10 инженеров.',
        ai_summary_en:
          'Own payment checkout roadmap for 20M+ MAU. Optimize payment success rates, launch BNPL payment methods, prioritize via RICE, and lead a dedicated team of 10 engineers.',
        company_info: 'Европейский лидер в сфере платежных решений и покупок с оплатой частями.',
        tech_stack: ['Product Strategy', 'A/B Testing', 'SQL', 'Jira', 'Amplitude'],
        tags: ['product-management', 'fintech'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 2,
        has_comment: true,
      },
      {
        id: 102,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4426019283/',
        title: 'Staff Technical Product Manager',
        company: 'Deliveroo',
        location: 'London, UK',
        workplace_type: 'remote',
        salary_min: 9000,
        salary_max: 11500,
        salary_currency: '£',
        salary_period: 'month',
        match_score: 83,
        ai_summary:
          'Проектирование архитектуры диспетчеризации заказов и прогнозирования времени доставки на базе ML. Формирование технических требований к внутренним API и платформенным SLA.',
        ai_summary_en:
          'Architect algorithmic rider dispatching and delivery ETA machine learning services. Author technical API specifications and establish high-throughput platform SLAs.',
        tech_stack: ['API Design', 'Machine Learning', 'Event-Driven', 'Kafka', 'System Design'],
        tags: ['technical-pm', 'logistics'],
        created_at: '14 мая',
        created_at_en: 'May 14',
        history_count: 1,
        has_comment: false,
      },
      {
        id: 103,
        source: 'LINKEDIN',
        url: 'https://www.linkedin.com/jobs/view/4427819201/',
        title: 'Lead Product Manager (Driver Core)',
        company: 'Bolt',
        location: 'Berlin, Germany',
        workplace_type: 'remote',
        salary_min: 8500,
        salary_max: 11000,
        salary_currency: '€',
        salary_period: 'month',
        match_score: 77,
        ai_summary:
          'Оптимизация заработка и retention водителей платформы в 25+ странах. Проведение когортных A/B экспериментов, валидация гипотез через CustDev и синхронизация со стейкхолдерами.',
        ai_summary_en:
          'Drive driver earnings and platform retention across 25+ countries. Lead cohort A/B experimentation, qualitative CustDev loops, and executive stakeholder alignment.',
        tech_stack: ['CustDev', 'Hypothesis Testing', 'Tableau', 'Mixpanel', 'Scrum'],
        tags: ['growth', 'ride-hailing'],
        created_at: '13 мая',
        created_at_en: 'May 13',
        history_count: 3,
        has_comment: true,
      },
    ],
    bloatItems: [
      {
        id: 'bloat-pm-1',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · О МИССИИ',
        labelEn: 'CORPORATE FLUFF · MISSION',
        text: '🌟 Ищем продуктового визионера и трансформационного лидера, способного соединять магию пользовательских сердец с бизнес-стратегией будущего!',
        textEn:
          '🌟 Seeking an empathetic product visionary to architect tomorrow’s paradigm where human delight intersects with strategic ecosystem dominance!',
      },
      {
        id: 'bloat-pm-2',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · МЫ ИЩЕМ МИНИ-CEO',
        labelEn: 'CORPORATE FLUFF · WHO YOU ARE',
        text: '🚀 Ты — мини-CEO своего продукта, умеющий влюблять инженеров в цели спринта, разруливать конфликты стейкхолдеров и двигать горы без формальной власти!',
        textEn:
          '🚀 You are an entrepreneurial mini-CEO leading with influence over authority, inspiring engineers to build the impossible and moving mountains!',
      },
      {
        id: 'bloat-pm-3',
        isBloat: true,
        label: 'КОРПОРАТИВНАЯ ВОДА · БЕНЕФИТЫ',
        labelEn: 'CORPORATE FLUFF · PERKS',
        text: '☕ Плюшки: неограниченный отпуск (Open PTO), менторство от фаундеров, шведская fika каждый четверг и релокационный пакет.',
        textEn:
          '☕ Perks: Open PTO, mentorship from tier-1 founders, Swedish fika traditions, and an all-inclusive relocation allowance.',
      },
      {
        id: 'core-pm-4',
        isBloat: false,
        label: 'ЕДИНСТВЕННЫЙ АБЗАЦ ПО ДЕЛУ (СПРЯТАН В КОНЦЕ)',
        labelEn: 'THE ONLY REAL PRODUCT PARAGRAPH (BURIED AT THE BOTTOM)',
        text: '🛠 Задачи и стек: управление бэклогом чекаута (20M MAU), запуск 18 A/B тестов платежных сценариев, рост конверсии на +4.2% (+$6.8M ARR), работа с SQL и Amplitude.',
        textEn:
          '🛠 Scope & Stack: own payment checkout backlog (20M MAU), execute 18 A/B experiments, boost conversion by +4.2% (+$6.8M ARR), and build SQL analytics models in Amplitude.',
      },
    ],
    compatibility: {
      overall_score: 89,
      calculated_score: 87,
      matched_requirements: [
        {
          requirement: 'Управление продуктовым чекаутом и конверсией на масштабе 10M+ MAU',
          requirementEn: 'Ownership of checkout conversion funnels at 10M+ MAU scale',
          evidence:
            'Цитата из CV: «Руководил продуктом чекаута с 14M MAU, запустил 24 A/B теста, увеличил конверсию оплаты на +3.8% и снизил drop-off на 12%».',
          evidenceEn:
            'CV quote: "Led checkout product serving 14M MAU, ran 24 A/B experiments, increased checkout conversion by +3.8% and reduced cart drop-off by 12%."',
        },
        {
          requirement: 'Глубокая продуктовая аналитика и самостоятельный SQL',
          requirementEn: 'Rigorous product experimentation and independent SQL querying',
          evidence:
            'Цитата из CV: «Самостоятельно пишу сложные SQL-запросы (Window functions, CTE) в Snowflake и строю многофакторные воронки в Amplitude».',
          evidenceEn:
            'CV quote: "Author complex SQL queries (Window functions, CTEs) in Snowflake and architect multi-step funnel analytics in Amplitude."',
        },
        {
          requirement: 'Технический бэкграунд и опыт работы с API/микросервисной командой',
          requirementEn: 'Technical depth and daily alignment with API/platform engineering',
        },
      ],
      missing_requirements: [
        {
          requirement: 'Опыт запуска финтех-продуктов в юрисдикции FCA / PSD2',
          requirementEn: 'Fintech compliance & payment regulations (FCA / PSD2 SCA)',
          severity: 'medium',
          reason: 'В резюме упомянуты платежные шлюзы, но нет прямого опыта сертификации по PSD2 SCA.',
          reasonEn: 'Payment gateways documented in CV; direct PSD2 SCA regulatory compliance not listed.',
        },
        {
          requirement: 'Управление P&L продукта от $10M ARR',
          requirementEn: 'Direct P&L accountability above $10M ARR',
          severity: 'low',
          reason: 'В CV описано влияние на выручку +$6.8M ARR, близко к целевому требованию.',
          reasonEn: 'CV validates +$6.8M ARR revenue contribution, very close to target threshold.',
        },
      ],
      critical_gaps: [
        {
          requirement: 'Гибридный формат в Стокгольме (2 дня в офисе в неделю, релокация предоставляется)',
          requirementEn: 'Hybrid schedule in Stockholm (2 days/week in office, relocation offered)',
          reason:
            'В резюме указан Лиссабон — кандидат должен подтвердить готовность принять релокационный пакет.',
          reasonEn:
            'Candidate based in Lisbon — will need to accept company relocation package to Stockholm.',
        },
      ],
      recommendations: [
        'Оцифруйте финансовый эффект от запущенных фичей (+$6.8M ARR) в первых строчках резюме.',
        'Укажите знание европейской регуляторики PSD2 и Strong Customer Authentication (SCA).',
        'Добавьте используемые фреймворки приоритизации (RICE, ICE, Opportunity Solution Tree).',
      ],
      recommendationsEn: [
        'Highlight dollar revenue impact (+$6.8M ARR) at the very top of each role.',
        'Cite European fintech regulatory awareness (PSD2 and Strong Customer Authentication).',
        'List prioritization frameworks (RICE, ICE, Opportunity Solution Tree) in core competencies.',
      ],
    },
  },
};

