import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  Award,
  Banknote,
  Building,
  Building2,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  FileText,
  History,
  Inbox,
  Laptop,
  Layers,
  MapPin,
  Search,
  Shield,
  Sparkles,
  UploadCloud,
  X,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { getSalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import './LandingPage.css';

const BOARD_COLUMNS = [
  { id: 'Еще не написан', labelEn: 'Not Contacted', index: '01', color: '#2563eb' },
  { id: 'Написал', labelEn: 'Contacted', index: '02', color: '#0284c7' },
  { id: 'Собеседование', labelEn: 'Interview', index: '03', color: '#d97706' },
  { id: 'Оффер', labelEn: 'Offer', index: '04', color: '#059669' },
];

const LINKEDIN_EXTRACTED_LINKS = [
  {
    id: 'li-4409',
    source: 'LINKEDIN',
    url: 'https://www.linkedin.com/jobs/view/4409263207/',
    shortUrl: 'linkedin.com/jobs/view/4409263207',
    title: 'Senior Backend Engineer (Payments)',
    company: 'Stripe',
    location: 'Berlin · Hybrid',
  },
  {
    id: 'li-4410',
    source: 'LINKEDIN',
    url: 'https://www.linkedin.com/jobs/view/4410891023/',
    shortUrl: 'linkedin.com/jobs/view/4410891023',
    title: 'Staff Product Engineer',
    company: 'Linear',
    location: 'EU · Remote',
  },
  {
    id: 'li-4412',
    source: 'LINKEDIN',
    url: 'https://www.linkedin.com/jobs/view/4412004911/',
    shortUrl: 'linkedin.com/jobs/view/4412004911',
    title: 'Systems & Edge SRE',
    company: 'Cloudflare',
    location: 'Lisbon · Remote',
  },
];

const DEMO_VACANCIES = [
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
    title: 'Staff Product Engineer',
    company: 'Linear',
    location: 'Remote, EU',
    workplace_type: 'remote',
    salary_min: 9500,
    salary_max: 11500,
    salary_currency: '€',
    salary_period: 'month',
    match_score: 79,
    ai_summary:
      'Развитие клиентского движка синхронизации данных и локального хранилища IndexedDB. Опыт от 5 лет с TypeScript, React и оптимизацией рендеринга.',
    ai_summary_en:
      'Develop client-side sync engine and local IndexedDB storage. Requires 5+ years with TypeScript, React, and rendering performance optimization.',
    tech_stack: ['TypeScript', 'React', 'GraphQL'],
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
];

/**
 * Sequential single-column hops between 1.2 (CARDS APPEAR ON THE BOARD) and 1.3 (MOVING RIGHT ACROSS THE FUNNEL).
 * Each card moves one by one and strictly one column at a time (01 -> 02 -> 03 -> 04):
 * - Stage 0 (1.2): All 3 cards in Column 01 ("Еще не написан")
 * - Stage 1 (1.3): Card 1 (Stripe) moves 01 -> 02 ("Написал")
 * - Stage 2 (1.3): Card 1 (Stripe) moves 02 -> 03 ("Собеседование", stage 2)
 * - Stage 3 (1.3): Card 2 (Linear) moves 01 -> 02 ("Написал")
 * - Stage 4 (1.3): Card 3 (Cloudflare) moves 01 -> 02 ("Написал")
 * - Stage 5 (1.3): Card 3 (Cloudflare) moves 02 -> 03 ("Собеседование", stage 1)
 * - Stage 6 (1.3+): Card 3 (Cloudflare) moves 03 -> 04 ("Оффер")
 */
const FUNNEL_STEP_POSITIONS = [
  {
    101: { status: 'Еще не написан', lane: null, historyCount: 0 },
    102: { status: 'Еще не написан', lane: null, historyCount: 0 },
    103: { status: 'Еще не написан', lane: null, historyCount: 0 },
  },
  {
    101: { status: 'Написал', lane: null, historyCount: 1 },
    102: { status: 'Еще не написан', lane: null, historyCount: 0 },
    103: { status: 'Еще не написан', lane: null, historyCount: 0 },
  },
  {
    101: { status: 'Собеседование', lane: 1, historyCount: 2 },
    102: { status: 'Еще не написан', lane: null, historyCount: 0 },
    103: { status: 'Еще не написан', lane: null, historyCount: 0 },
  },
  {
    101: { status: 'Собеседование', lane: 1, historyCount: 2 },
    102: { status: 'Написал', lane: null, historyCount: 1 },
    103: { status: 'Еще не написан', lane: null, historyCount: 0 },
  },
  {
    101: { status: 'Собеседование', lane: 1, historyCount: 2 },
    102: { status: 'Написал', lane: null, historyCount: 1 },
    103: { status: 'Написал', lane: null, historyCount: 1 },
  },
  {
    101: { status: 'Собеседование', lane: 1, historyCount: 2 },
    102: { status: 'Написал', lane: null, historyCount: 1 },
    103: { status: 'Собеседование', lane: 0, historyCount: 2 },
  },
  {
    101: { status: 'Собеседование', lane: 1, historyCount: 2 },
    102: { status: 'Написал', lane: null, historyCount: 1 },
    103: { status: 'Оффер', lane: null, historyCount: 3 },
  },
  // Stage 7 (Screen 4.1+: Stripe wins the Offer and moves 03 -> 04 "Оффер")
  {
    101: { status: 'Оффер', lane: null, historyCount: 3 },
    102: { status: 'Написал', lane: null, historyCount: 1 },
    103: { status: 'Оффер', lane: null, historyCount: 3 },
  },
];

const LINKEDIN_CORPORATE_BLOAT = [
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
];

const COMPATIBILITY_DATA = {
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
};

const SUB_SCREENS = [
  {
    id: '1.1',
    screen: 1,
    indexLabel: '01.1',
    dotColor: '#2563eb',
    captionLabel: 'ШАГ 01 · ССЫЛКИ УЛЕТАЮТ В ОКНО ИМПОРТА',
    captionLabelEn: 'STEP 01 · LINKS FLY INTO BATCH IMPORT',
    captionText:
      'По мере прокрутки ссылки со страницы поиска LinkedIn по одной перелетают в окно «Пакетный импорт вакансий», заполняют поле ввода, и кнопка «Импортировать» загорается.',
    captionTextEn:
      'As you scroll, job links from LinkedIn fly one by one into the Batch Import window, populate the textarea, and light up the Import button.',
  },
  {
    id: '1.2',
    screen: 1,
    indexLabel: '01.2',
    dotColor: '#0284c7',
    captionLabel: 'ШАГ 02 · КАРТОЧКИ ПОЯВЛЯЮТСЯ НА ДОСКЕ',
    captionLabelEn: 'STEP 02 · CARDS APPEAR ON THE BOARD',
    captionText:
      'После отправки списка ссылок в первой колонке «Еще не написан» появляются готовые карточки с названием роли, компанией и источником.',
    captionTextEn:
      'Once imported, structured vacancy cards appear in the first column with role title, company, and source link.',
  },
  {
    id: '1.3',
    screen: 1,
    indexLabel: '01.3',
    dotColor: '#059669',
    captionLabel: 'ШАГ 03 · ДВИЖЕНИЕ ПО ВОРОНКЕ ВПРАВО',
    captionLabelEn: 'STEP 03 · MOVING RIGHT ACROSS THE FUNNEL',
    captionText:
      'По мере прохождения отборов карточки двигаются вправо по колонкам: от первого контакта через этапы собеседований к офферу.',
    captionTextEn:
      'As you progress through interviews, cards move right across columns: from initial outreach through interview stages to an offer.',
  },
  {
    id: '2.1',
    screen: 2,
    indexLabel: '02.1',
    dotColor: '#10b981',
    captionLabel: 'ШАГ 01 · ВВОД И ПЕРЕСЧЕТ ЗП В МЕСЯЦ',
    captionLabelEn: 'STEP 01 · SALARY AUTOFILL & MONTHLY CONVERSION',
    captionText:
      'Годовая вилка из описания ($144k–$168k в год) сама вводится в карточку и автоматически приводится к единому формату: $12,000 – $14,000 / мес.',
    captionTextEn:
      'Annual compensation ($144k–$168k/yr) is extracted into the card and automatically normalized to a monthly rate: $12,000 – $14,000/mo.',
  },
  {
    id: '2.2',
    screen: 2,
    indexLabel: '02.2',
    dotColor: '#f59e0b',
    captionLabel: 'ШАГ 02 · БОЛЬШОЕ МУТНОЕ ОПИСАНИЕ ИЗ LINKEDIN',
    captionLabelEn: 'STEP 02 · BLOATED LINKEDIN JOB DESCRIPTION',
    captionText:
      'Исходная вакансия забита четырьмя экранами корпоративных штампов про «единорога», «семейную атмосферу», «10x рок-звезд» и «печеньки», где суть работы спрятана на самом дне.',
    captionTextEn:
      'The raw job post is packed with paragraphs of corporate clichés about "unicorns", "fast-paced family", and "10x rockstar ninjas", burying the actual engineering work at the very bottom.',
  },
  {
    id: '2.3',
    screen: 2,
    indexLabel: '02.3',
    dotColor: '#2563eb',
    captionLabel: 'ШАГ 03 · СХЛОПЫВАНИЕ ВОДЫ ДО 2 ПРЕДЛОЖЕНИЙ',
    captionLabelEn: 'STEP 03 · COLLAPSING FLUFF TO 2 SENTENCES',
    captionText:
      'Вся корпоративная вода схлопывается на 94% — остаются только 2 конкретных предложения о инженерных задачах, нагрузке и чистый стек технологий.',
    captionTextEn:
      'All corporate fluff collapses by 94% — leaving just 2 concise sentences on core engineering scope, system load, and a clean tech stack.',
  },
  {
    id: '3.1',
    screen: 3,
    indexLabel: '03.1',
    dotColor: '#10b981',
    captionLabel: 'ШАГ 01 · MATCH И MISSING ПО РЕЗЮМЕ',
    captionLabelEn: 'STEP 01 · CV MATCH & MISSING SKILLS',
    captionText:
      'На вкладке «Совместимость с CV» печатаются подтвержденные навыки с цитатами из вашего резюме (Match) и технологии, которых в CV не нашлось (Missing).',
    captionTextEn:
      'The CV Compatibility tab prints matched requirements backed by quotes from your resume (Match) and skills not found in your CV (Missing).',
  },
  {
    id: '3.2',
    screen: 3,
    indexLabel: '03.2',
    dotColor: '#ef4444',
    captionLabel: 'ШАГ 02 · CRITICAL И РЕКОМЕНДАЦИИ',
    captionLabelEn: 'STEP 02 · CRITICAL GAPS & RECOMMENDATIONS',
    captionText:
      'Следом печатаются стоп-факторы по локации или формату (Critical) и готовый список правок (Recommendations): что именно добавить в CV перед откликом.',
    captionTextEn:
      'Next, it prints location or work-format dealbreakers (Critical) and actionable edits (Recommendations) to tailor your CV before applying.',
  },
  {
    id: '4.1',
    screen: 4,
    indexLabel: '04.1',
    dotColor: '#10b981',
    captionLabel: 'ШАГ 01 · ОЖИВШАЯ ДОСКА И ПЕРЕЕЗД В «ОФФЕР»',
    captionLabelEn: 'STEP 01 · FULL BOARD UNLOCKED & OFFER WON',
    captionText:
      'Карточка закрывается: все скелетоны и фильтры на доске оживают, а вакансия Stripe ($12,000 – $14,000 / мес · 84% Match) совершает финальный переход в колонку «04 Оффер».',
    captionTextEn:
      'The modal closes: all board skeletons and filters come alive, and the Stripe role ($12,000 – $14,000/mo · 84% Match) makes its final hop into "04 Offer".',
  },
  {
    id: '4.2',
    screen: 4,
    indexLabel: '04.2',
    dotColor: '#2563eb',
    captionLabel: 'ШАГ 02 · ВОРОНКА СОБРАНА · ПЕРЕХОД К ДОСКЕ',
    captionLabelEn: 'STEP 02 · FUNNEL COMPLETE · OPEN YOUR BOARD',
    captionText:
      'От сырых ссылок из LinkedIn до прозрачной воронки с понятной зарплатой в месяц, выжимкой без воды и оценкой CV. Откройте доску и начните вести свои отклики.',
    captionTextEn:
      'From raw LinkedIn links to a clear funnel with monthly pay, fluff-free summaries, and CV matching. Open the board and start tracking your roles.',
  },
];

const SCREENS_BLOCKS = [
  {
    screen: 1,
    num: '01',
    color: '#2563eb',
    headerTitle: 'ЭКРАН 01 · ДОБАВЛЕНИЕ ССЫЛОК НА ДОСКУ',
    headerTitleEn: 'SCREEN 01 · ADDING LINKS TO THE BOARD',
    tag: 'LINKEDIN → КАНБАН',
    tagEn: 'LINKEDIN → KANBAN',
    kicker: 'ЭКРАН 01 / 04 · ИМПОРТ И ВОРОНКА',
    kickerEn: 'SCREEN 01 / 04 · IMPORT & FUNNEL',
    title: 'Добавляйте ссылки пачкой и ведите вакансии по доске',
    titleEn: 'Batch-import LinkedIn links and track roles across the board',
    lead:
      'Забудьте про ручное копирование вакансий в таблицы. Забирайте ссылки прямо со страницы поиска LinkedIn в окно пакетного импорта и двигайте карточки по этапам до оффера.',
    leadEn:
      'Stop copying job posts into spreadsheets by hand. Grab links straight from LinkedIn search into Batch Import and move cards across stages all the way to an offer.',
    subIds: ['1.1', '1.2', '1.3'],
  },
  {
    screen: 2,
    num: '02',
    color: '#10b981',
    headerTitle: 'ЭКРАН 02 · АВТОЗАПОЛНЕНИЕ КАРТОЧКИ',
    headerTitleEn: 'SCREEN 02 · SMART CARD AUTOFILL',
    tag: 'ЗП & AI-САММАРИ',
    tagEn: 'SALARY & AI SUMMARY',
    kicker: 'ЭКРАН 02 / 04 · РАЗБОР ВАКАНСИИ',
    kickerEn: 'SCREEN 02 / 04 · VACANCY BREAKDOWN',
    title: 'Карточка сама считает зарплату и убирает воду из описания',
    titleEn: 'Normalizes salary to monthly and strips fluff from descriptions',
    lead:
      'Годовые и почасовые вилки приводятся к сумме за месяц, а четыре экрана корпоративных штампов сжимаются до двух конкретных предложений.',
    leadEn:
      'Annual and hourly ranges are converted into monthly pay, while four screens of corporate buzzwords collapse into two clear sentences.',
    subIds: ['2.1', '2.2', '2.3'],
  },
  {
    screen: 3,
    num: '03',
    color: '#d97706',
    headerTitle: 'ЭКРАН 03 · ОЦЕНКА СОВМЕСТИМОСТИ С CV',
    headerTitleEn: 'SCREEN 03 · CV COMPATIBILITY CHECK',
    tag: 'АНАЛИЗ РЕЗЮМЕ',
    tagEn: 'RESUME MATCH',
    kicker: 'ЭКРАН 03 / 04 · ПРОВЕРКА ПЕРЕД ОТКЛИКОМ',
    kickerEn: 'SCREEN 03 / 04 · PRE-APPLY CHECK',
    title: 'Точная сверка вакансии с вашим резюме по 4 блокам',
    titleEn: 'Instant 4-part compatibility check against your CV',
    lead:
      'Перед откликом проверьте реальные шансы: какие требования подтверждены цитатами из вашего CV, чего не хватает и что поправить.',
    leadEn:
      'Check your real odds before applying: see which requirements are backed by quotes from your CV, what is missing, and what to tweak.',
    subIds: ['3.1', '3.2'],
  },
  {
    screen: 4,
    num: '04',
    color: '#059669',
    headerTitle: 'ЭКРАН 04 · ОФФЕР И ГОТОВАЯ ДОСКА',
    headerTitleEn: 'SCREEN 04 · OFFER WON & FULL BOARD',
    tag: 'ФИНАЛ · СТАРТ',
    tagEn: 'FINALE · LAUNCH',
    kicker: 'ЭКРАН 04 / 04 · ПОЛНАЯ КАРТИНА ПОИСКА',
    kickerEn: 'SCREEN 04 / 04 · COMPLETE JOB SEARCH BOARD',
    title: 'Все вакансии оцифрованы, сравнены и доведены до оффера',
    titleEn: 'Every role parsed, compared, and tracked all the way to an offer',
    lead:
      'На доске больше нет слепых пятен: фильтры, зарплаты в месяц, двухстрочная суть и процент совпадения с вашим CV собраны на одном чертежном экране.',
    leadEn:
      'No more blind spots on your board: filters, monthly pay, two-sentence summaries, and CV match scores are all unified on one blueprint workspace.',
    subIds: ['4.1', '4.2'],
  },
];

/**
 * Typewriter text that keeps the untyped suffix hidden in-flow so the container
 * height never shifts and always stays locked to the 32px blueprint grid.
 */
function TypewriterText({ text, active, completed, speed = 12, className = '' }) {
  const [charCount, setCharCount] = useState(completed ? text.length : 0);

  useEffect(() => {
    if (completed) {
      const doneTimer = setTimeout(() => setCharCount(text.length), 0);
      return () => clearTimeout(doneTimer);
    }
    if (!active) {
      const resetTimer = setTimeout(() => setCharCount(0), 0);
      return () => clearTimeout(resetTimer);
    }

    const startTimer = setTimeout(() => {
      setCharCount(Math.min(text.length, 6));
    }, 0);

    const timer = setInterval(() => {
      setCharCount((prev) => {
        if (prev >= text.length) {
          clearInterval(timer);
          return text.length;
        }
        return Math.min(text.length, prev + 2);
      });
    }, speed);

    return () => {
      clearTimeout(startTimer);
      clearInterval(timer);
    };
  }, [active, completed, text, speed]);

  const shown = completed ? text.length : active ? charCount : 0;
  const isTyping = active && shown < text.length;

  return (
    <span className={`tw-root ${className}`}>
      <span className="tw-visible">{text.slice(0, shown)}</span>
      {isTyping && <span className="tw-cursor" aria-hidden="true">▋</span>}
      <span className="tw-ghost" aria-hidden="true">{text.slice(shown)}</span>
    </span>
  );
}

/**
 * Reusable Blueprint Skeleton Placeholder Line / Pill
 */
function SkeletonBar({ width = '100%', height = 10, className = '' }) {
  return (
    <span
      className={`landing-skel-bar ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Recognizable copy of KanbanCard.jsx aligned to the 32px grid.
 * Unpresented features (Salary before 2.1, AI Summary/Stack before 2.2, Match % before 3.1)
 * are hidden behind clean skeleton placeholders!
 */
function LandingKanbanCard({
  vacancy,
  status,
  lane,
  justArrived,
  justMoved,
  justMovedBack,
  isSelected,
  showSalary,
  showSummary,
  showMatch,
  isEn,
  t,
}) {
  const contentRef = useRef(null);
  const [gridHeight, setGridHeight] = useState(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const updateHeight = () => {
      const grid =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      const height = Math.ceil(content.offsetHeight / grid) * grid;
      setGridHeight((prev) => (prev === height ? prev : height));
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    updateHeight();
    return () => observer.disconnect();
  }, [status, lane, showSalary, showSummary, showMatch, isEn]);

  const colIndex = BOARD_COLUMNS.findIndex((c) => c.id === status);
  const salaryInfo = getSalaryDisplay(vacancy, t, 'month');
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);
  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : null;
  const matchTier =
    matchScore === null
      ? ''
      : matchScore >= 75
        ? 'match-high'
        : matchScore >= 50
          ? 'match-medium'
          : 'match-low';

  const showLaneBadge = status === 'Собеседование' && lane != null;
  const summaryText = isEn && vacancy.ai_summary_en ? vacancy.ai_summary_en : vacancy.ai_summary;
  const createdText = isEn && vacancy.created_at_en ? vacancy.created_at_en : vacancy.created_at;

  return (
    <div
      className={`kanban-card landing-kanban-card ${isSelected ? 'is-selected' : ''} ${
        justArrived ? 'is-just-arrived' : ''
      } ${justMoved ? 'is-just-moved' : ''} ${justMovedBack ? 'is-just-moved-back' : ''} ${
        showMatch && matchTier ? `card-${matchTier}` : ''
      }`}
    >
      <div className="card-grid-content">
        <div
          className="card-grid-body"
          style={gridHeight ? { minHeight: gridHeight } : undefined}
        >
          <div className="card-grid-body-content" ref={contentRef}>
            <div className="card-top">
              <div className="card-heading">
                <div className="card-title-container">
                  <div className="card-header-meta">
                    <span className="card-source-link">
                      <span>{vacancy.source}</span>
                      <ExternalLink size={9} />
                    </span>
                    <span className="landing-card-company-inline">· {vacancy.company}</span>
                  </div>
                  <h3 className="card-title">{vacancy.title}</h3>
                </div>
              </div>

              <div className="card-status-indicators">
                {showLaneBadge && (
                  <span className="card-lane-badge">
                    {isEn ? `stage ${lane + 1}` : `этап ${lane + 1}`}
                  </span>
                )}
              </div>
            </div>

            {/* Meta Badges: Skeleton until presented */}
            <div className="card-meta">
              {showMatch && matchScore !== null ? (
                <div className={`card-match-badge ${matchTier}`}>
                  <Award size={10} />
                  <span>{matchScore}%</span>
                </div>
              ) : (
                <SkeletonBar width={42} height={16} className="is-pill" />
              )}

              {showSalary && workplaceInfo ? (
                <div className={`card-workplace-badge ${workplaceInfo.className}`}>
                  {workplaceInfo.key === 'remote' && <Laptop size={10} />}
                  {workplaceInfo.key === 'hybrid' && <Layers size={10} />}
                  {workplaceInfo.key === 'on-site' && <Building size={10} />}
                  <span>{workplaceInfo.label}</span>
                </div>
              ) : (
                <SkeletonBar width={58} height={16} className="is-pill" />
              )}

              {showSalary && salaryInfo.hasSalary ? (
                <div className="card-salary-badge">
                  <Banknote size={11} />
                  <span>{salaryInfo.formatted}</span>
                </div>
              ) : (
                <SkeletonBar width={76} height={16} className="is-pill" />
              )}
            </div>

            {/* AI Summary: Skeleton until Screen 2.3 */}
            {showSummary ? (
              <div className="card-summary">{summaryText}</div>
            ) : (
              <div className="landing-card-skeleton-lines" aria-hidden="true">
                <SkeletonBar width="94%" height={9} />
                <SkeletonBar width="72%" height={9} />
              </div>
            )}

            {/* Tech Stack Chips: Skeleton until Screen 2.3 */}
            {showSummary ? (
              <div className="card-tech-stack">
                {vacancy.tech_stack.slice(0, 3).map((tech) => (
                  <span key={tech} className="tech-chip">
                    {tech}
                  </span>
                ))}
              </div>
            ) : (
              <div className="card-tech-stack" aria-hidden="true">
                <SkeletonBar width={34} height={15} />
                <SkeletonBar width={52} height={15} />
                <SkeletonBar width={42} height={15} />
              </div>
            )}
          </div>
        </div>

        <div className="card-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="card-date">{createdText}</span>
            {vacancy.history_count > 0 && (
              <span className={`card-history-indicator ${justMoved ? 'is-history-pop' : ''}`}>
                <History size={10} />
                <span>{vacancy.history_count}</span>
                {vacancy.has_comment && <span className="card-history-comment-dot" />}
              </span>
            )}
          </div>

          <div className="card-quick-actions">
            <span
              className={`quick-move-btn ${justMovedBack ? 'is-stepping-arrow' : ''}`}
              aria-hidden="true"
              style={{ opacity: colIndex <= 0 && !justMovedBack ? 0.3 : 1 }}
            >
              &lt;
            </span>
            <span className="quick-move-btn quick-reject-btn" aria-hidden="true">
              ×
            </span>
            <span
              className={`quick-move-btn ${justMoved ? 'is-stepping-arrow' : ''}`}
              aria-hidden="true"
              style={{ opacity: colIndex >= BOARD_COLUMNS.length - 1 && !justMoved ? 0.3 : 1 }}
            >
              &gt;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Screen 1.1 visual:
 * Left: Simplified, unmistakably recognizable scaled-down LinkedIn Jobs screen (2-pane layout: job list + right job details preview).
 * Center: Link pill flying from the active LinkedIn job row into the BatchImportModal textarea.
 * Right: Simplified copy of BatchImportModal.jsx where the textarea fills with links one by one as the user scrolls,
 *        and then the "Импортировать" button lights up before the cards appear on the board in 1.2!
 */
function LandingLinkedInOverlay({ subScreenId, importStage, isEn }) {
  const isFlying = subScreenId === '1.1';
  const isDocked = subScreenId === '1.2';
  if (!isFlying && !isDocked) return null;

  const effectiveStage = isDocked ? 4 : importStage;
  const filledCount = Math.min(3, effectiveStage);
  const flyingIdx = effectiveStage < 3 ? effectiveStage : null;
  const isButtonLit = effectiveStage >= 4;

  const activeJob =
    LINKEDIN_EXTRACTED_LINKS[flyingIdx !== null ? flyingIdx : 2] || LINKEDIN_EXTRACTED_LINKS[0];

  return (
    <div className={`landing-li-scene ${isDocked ? 'is-docked' : 'is-active'}`} aria-hidden="true">
      {/* 1. Simplified, scaled-down, recognizable LinkedIn Jobs Screen */}
      <div className="landing-li-window">
        {/* LinkedIn Top Navigation Bar */}
        <div className="landing-li-navbar">
          <div className="landing-li-nav-left">
            <span className="landing-li-logo">in</span>
            <div className="landing-li-searchbox">
              <Search size={10} />
              <span>Backend Engineer</span>
            </div>
          </div>
          <div className="landing-li-nav-icons">
            <span className="li-nav-dot" />
            <span className="li-nav-dot" />
            <span className="li-nav-jobs-active">Jobs</span>
            <span className="li-nav-dot" />
          </div>
        </div>

        {/* LinkedIn Jobs Filter Pills Row */}
        <div className="landing-li-filters">
          <span className="li-filter-pill is-green">Jobs</span>
          <span className="li-filter-pill">Easy Apply</span>
          <span className="li-filter-pill">Remote</span>
        </div>

        {/* LinkedIn 2-Pane Split: Left Job List | Right Selected Job Preview */}
        <div className="landing-li-split">
          <div className="landing-li-list">
            {LINKEDIN_EXTRACTED_LINKS.map((item, idx) => {
              const isExtracted = idx < filledCount;
              const isFlyingNow = idx === flyingIdx;

              return (
                <div
                  key={item.id}
                  className={`landing-li-job-row ${isFlyingNow ? 'is-flying-source' : ''} ${
                    isExtracted ? 'is-extracted-source' : ''
                  }`}
                >
                  <div className="landing-li-job-avatar">{item.company[0]}</div>
                  <div className="landing-li-job-info">
                    <div className="landing-li-job-title">{item.title}</div>
                    <div className="landing-li-job-meta">
                      <span>{item.company}</span>
                      <span>·</span>
                      <span>{item.location}</span>
                    </div>
                    <div className="landing-li-job-url">{item.shortUrl}</div>
                  </div>
                  <span className="landing-li-row-status">
                    {isExtracted ? '✓' : isFlyingNow ? '→' : ''}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Right Pane inside LinkedIn: Recognizable Job Detail Preview */}
          <div className="landing-li-detail-pane">
            <div className="li-detail-company-row">
              <span className="li-detail-avatar">{activeJob.company[0]}</span>
              <span className="li-detail-company-name">{activeJob.company}</span>
            </div>
            <div className="li-detail-title">{activeJob.title}</div>
            <div className="li-detail-location">{activeJob.location}</div>

            <div className="li-detail-actions">
              <span className="li-btn-apply">in Apply</span>
              <span className="li-btn-save">Save</span>
            </div>

            <div className="li-detail-skeleton">
              <SkeletonBar width="92%" height={7} />
              <SkeletonBar width="84%" height={7} />
              <SkeletonBar width="88%" height={7} />
              <SkeletonBar width="60%" height={7} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Center Flight Connector: Single Link Flying from LinkedIn into BatchImportModal */}
      <div className="landing-li-flight-bridge">
        <svg
          className="landing-li-bridge-svg"
          viewBox="0 0 110 180"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M 4 46 C 48 46, 62 78, 106 82"
            className={`landing-li-path ${flyingIdx === 0 ? 'is-active-path' : ''}`}
          />
          <path
            d="M 4 98 C 48 98, 62 96, 106 96"
            className={`landing-li-path ${flyingIdx === 1 ? 'is-active-path' : ''}`}
          />
          <path
            d="M 4 150 C 48 150, 62 114, 106 110"
            className={`landing-li-path ${flyingIdx === 2 ? 'is-active-path' : ''}`}
          />
        </svg>

        {flyingIdx !== null && (
          <div
            key={flyingIdx}
            className={`landing-flying-single-pill from-row-${flyingIdx}`}
          >
            <span className="flying-pill-url">
              {LINKEDIN_EXTRACTED_LINKS[flyingIdx].shortUrl}
            </span>
            <ArrowRight size={10} />
          </div>
        )}
      </div>

      {/* 3. Right Window: Simplified Copy of BatchImportModal.jsx */}
      <div className="modal-content batch-import-modal landing-batch-modal">
        <div className="modal-header landing-batch-header">
          <div className="modal-title landing-batch-title">
            <UploadCloud size={15} color="#2563eb" />
            <span>{isEn ? 'Batch Import Vacancies' : 'Пакетный импорт вакансий'}</span>
          </div>
          <span className="btn-icon modal-close-btn">
            <X size={13} />
          </span>
        </div>

        <div className="modal-body landing-batch-body">
          <div className="form-group" style={{ marginBottom: 0 }}>
            <div className="landing-batch-label-row">
              <span className="form-label" style={{ marginBottom: 0 }}>
                {isEn ? 'Job links (one per line)' : 'Ссылки на вакансии (каждая с новой строки)'}
              </span>
              <span className="landing-batch-counter">[{filledCount} / 3]</span>
            </div>

            <div
              className={`form-textarea landing-batch-textarea ${
                filledCount > 0 ? 'has-urls' : ''
              }`}
            >
              {filledCount === 0 ? (
                <span className="landing-textarea-placeholder">
                  https://www.linkedin.com/jobs/view/...
                </span>
              ) : (
                LINKEDIN_EXTRACTED_LINKS.slice(0, filledCount).map((item, idx) => (
                  <div
                    key={item.id}
                    className={`landing-textarea-url-line ${
                      idx === filledCount - 1 && !isButtonLit ? 'is-just-landed' : ''
                    }`}
                  >
                    {item.url}
                  </div>
                ))
              )}
              {!isButtonLit && <span className="tw-cursor" aria-hidden="true">▋</span>}
            </div>
          </div>

          <div className="landing-batch-tags-row">
            <span className="form-label" style={{ marginBottom: 4 }}>
              {isEn ? 'Default tags' : 'Метки по умолчанию'}
            </span>
            <SkeletonBar width="100%" height={24} />
          </div>
        </div>

        <div className="modal-footer landing-batch-footer">
          <span className="btn btn-secondary landing-batch-cancel-btn">
            {isEn ? 'Cancel' : 'Отмена'}
          </span>
          <span
            className={`btn btn-primary landing-batch-submit-btn ${
              isButtonLit ? 'is-lit' : 'is-waiting'
            }`}
          >
            <UploadCloud size={13} />
            <span>
              {isEn ? 'Import' : 'Импортировать'}
              {filledCount > 0 ? ` (${filledCount})` : ''}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Recognizable, non-interactive, non-scrolling copy of VacancyModal.jsx for Screens 2 and 3.
 * Elements that haven't been presented yet are rendered as clean skeletons!
 */
function LandingVacancyModal({ vacancy, subScreenId, isReverse, isEn, t }) {
  const isScreen3 = subScreenId === '3.1' || subScreenId === '3.2';
  const activeTab = isScreen3 ? 'compatibility' : 'details';

  const isDescriptionPresented =
    subScreenId === '2.2' || subScreenId === '2.3' || isScreen3;
  const isSummaryPresented = subScreenId === '2.3' || isScreen3;
  const isBloatCollapsed = subScreenId === '2.3' || isScreen3;
  const isCriticalPresented = subScreenId === '3.2';

  const summaryText = isEn && vacancy.ai_summary_en ? vacancy.ai_summary_en : vacancy.ai_summary;

  // Screen 2.1: animated salary typing state
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryTypingStep, setSalaryTypingStep] = useState(0);

  // Screen 2.3: typing 2-sentence AI summary after bloat collapses
  const [summaryTypedChars, setSummaryTypedChars] = useState(0);

  // Screen 3: CV Compatibility printed items state
  const [visibleMatchCount, setVisibleMatchCount] = useState(3);
  const [visibleMissingCount, setVisibleMissingCount] = useState(2);
  const [visibleCriticalCount, setVisibleCriticalCount] = useState(1);
  const [visibleRecsCount, setVisibleRecsCount] = useState(3);

  // Animate Salary typing in Sub-screen 2.1
  useEffect(() => {
    if (subScreenId !== '2.1') {
      const resetTimer = setTimeout(() => {
        setSalaryMin('144000');
        setSalaryMax('168000');
        setSalaryTypingStep(10);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    const sequence = [
      { delay: 0, min: '', max: '', step: 1 },
      { delay: 180, min: '14', max: '', step: 1 },
      { delay: 340, min: '1440', max: '', step: 2 },
      { delay: 500, min: '144000', max: '', step: 3 },
      { delay: 700, min: '144000', max: '16', step: 4 },
      { delay: 860, min: '144000', max: '1680', step: 5 },
      { delay: 1020, min: '144000', max: '168000', step: 6 },
      { delay: 1200, min: '144000', max: '168000', step: 10 },
    ];

    const timers = sequence.map((item) =>
      setTimeout(() => {
        setSalaryMin(item.min);
        setSalaryMax(item.max);
        setSalaryTypingStep(item.step);
      }, item.delay)
    );

    return () => timers.forEach(clearTimeout);
  }, [subScreenId]);

  // Animate 2-sentence AI summary typing in Sub-screen 2.3 after bloat collapses
  useEffect(() => {
    const fullLen = summaryText.length;
    if (subScreenId !== '2.3') {
      const timer = setTimeout(() => {
        setSummaryTypedChars(subScreenId === '2.1' || subScreenId === '2.2' ? 0 : fullLen);
      }, 0);
      return () => clearTimeout(timer);
    }

    const initTimer = setTimeout(() => {
      setSummaryTypedChars(0);
    }, 0);

    let interval = null;
    const startTypingTimer = setTimeout(() => {
      interval = setInterval(() => {
        setSummaryTypedChars((prev) => {
          if (prev >= fullLen) {
            clearInterval(interval);
            return fullLen;
          }
          return Math.min(fullLen, prev + 5);
        });
      }, 16);
    }, 220);

    return () => {
      clearTimeout(initTimer);
      clearTimeout(startTypingTimer);
      if (interval) clearInterval(interval);
    };
  }, [subScreenId, summaryText]);

  // Animate printing of Match / Missing / Critical / Recommendations in Screen 3
  useEffect(() => {
    if (subScreenId === '3.1') {
      if (isReverse) {
        const keepTimer = setTimeout(() => {
          setVisibleMatchCount(3);
          setVisibleMissingCount(2);
          setVisibleCriticalCount(0);
          setVisibleRecsCount(0);
        }, 0);
        return () => clearTimeout(keepTimer);
      }

      const timers = [
        setTimeout(() => {
          setVisibleMatchCount(0);
          setVisibleMissingCount(0);
          setVisibleCriticalCount(0);
          setVisibleRecsCount(0);
        }, 0),
        setTimeout(() => setVisibleMatchCount(1), 140),
        setTimeout(() => setVisibleMatchCount(2), 320),
        setTimeout(() => setVisibleMatchCount(3), 500),
        setTimeout(() => setVisibleMissingCount(1), 720),
        setTimeout(() => setVisibleMissingCount(2), 920),
      ];
      return () => timers.forEach(clearTimeout);
    }

    if (subScreenId === '3.2') {
      const timers = [
        setTimeout(() => {
          setVisibleMatchCount(3);
          setVisibleMissingCount(2);
          setVisibleCriticalCount(0);
          setVisibleRecsCount(0);
        }, 0),
        setTimeout(() => setVisibleCriticalCount(1), 180),
        setTimeout(() => setVisibleRecsCount(1), 440),
        setTimeout(() => setVisibleRecsCount(2), 700),
        setTimeout(() => setVisibleRecsCount(3), 960),
      ];
      return () => timers.forEach(clearTimeout);
    }
    return undefined;
  }, [subScreenId, isReverse]);

  const currentSalaryInfo = getSalaryDisplay(
    {
      salary_min: salaryMin !== '' ? salaryMin : null,
      salary_max: salaryMax !== '' ? salaryMax : null,
      salary_currency: '$',
      salary_period: 'year',
    },
    t,
    'month'
  );

  const modalWorkplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);
  const recsList = isEn ? COMPATIBILITY_DATA.recommendationsEn : COMPATIBILITY_DATA.recommendations;

  return (
    <div className="landing-modal-backdrop" aria-hidden="true">
      <div className="modal-content vacancy-modal landing-vacancy-modal">
        {/* Simplified Modal Header: Top meta row + normal full-width Title below */}
        <div className="modal-header landing-modal-header">
          <div className="landing-modal-meta-row">
            <div className="landing-modal-meta-left">
              <span className="card-company">
                <Building2 size={13} />
                <span>{vacancy.company}</span>
              </span>
              <span className="card-location">
                <MapPin size={12} />
                <span>{vacancy.location}</span>
              </span>
              {modalWorkplaceInfo && (
                <span className={`card-workplace-badge ${modalWorkplaceInfo.className}`}>
                  <Layers size={11} />
                  <span>{modalWorkplaceInfo.label}</span>
                </span>
              )}
            </div>

            <div className="landing-modal-meta-right">
              {currentSalaryInfo.hasSalary ? (
                <span className="card-salary-badge landing-salary-badge-pop">
                  <Banknote size={13} />
                  <span>{currentSalaryInfo.formatted}</span>
                </span>
              ) : (
                <SkeletonBar width={104} height={18} className="is-pill" />
              )}
              {isScreen3 ? (
                <span className="card-match-badge match-high">
                  <Award size={11} />
                  <span>Match {COMPATIBILITY_DATA.overall_score}%</span>
                </span>
              ) : (
                <SkeletonBar width={68} height={18} className="is-pill" />
              )}
            </div>
          </div>

          <h2 className="landing-modal-title-static">{vacancy.title}</h2>
        </div>

        {/* Navigation Tabs */}
        <div className="settings-tabs vacancy-tabs">
          <span className={`settings-tab-btn ${activeTab === 'details' ? 'active' : ''}`}>
            <FileText size={14} />
            <span>{isEn ? 'Description & Details' : 'Описание и детали'}</span>
          </span>
          <span
            className={`settings-tab-btn ${activeTab === 'compatibility' ? 'active' : ''} ${
              isScreen3 ? 'is-tab-highlighted' : ''
            }`}
          >
            <Shield size={14} color="#34d399" />
            <span>{isEn ? 'CV Compatibility' : 'Совместимость с CV'}</span>
            {isScreen3 ? (
              <span className="landing-tab-score-pill">{COMPATIBILITY_DATA.overall_score}%</span>
            ) : (
              <SkeletonBar width={34} height={16} className="is-pill" />
            )}
          </span>
        </div>

        {/* Modal Body (Non-scrolling, uncluttered layout) */}
        <div className="modal-body landing-modal-body">
          {activeTab === 'details' ? (
            <>
              {/* Section 1: Salary Auto-Fill & Monthly Normalization (Presented in 2.1) */}
              <div
                className={`form-group vacancy-salary ${
                  subScreenId === '2.1' ? 'is-section-focused' : ''
                }`}
              >
                <div className="vacancy-salary-header">
                  <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                    <Banknote size={15} color="var(--aspen-mint)" />
                    <span style={{ fontWeight: 600 }}>{isEn ? 'Salary' : 'Зарплата'}</span>
                  </div>
                  <div className="vacancy-salary-total">
                    {currentSalaryInfo.hasSalary ? (
                      <span>= {currentSalaryInfo.formatted}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>
                        {isEn ? 'Extracting range from text...' : 'Ввод вилки из текста...'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="salary-fields-grid">
                  <div className="salary-field-item">
                    <span className="salary-field-label">{isEn ? 'Minimum' : 'Минимум'}</span>
                    <div
                      className={`form-input salary-field-input landing-static-input ${
                        salaryTypingStep >= 1 && salaryTypingStep <= 3 ? 'is-typing-input' : ''
                      }`}
                    >
                      {salaryMin || <span className="landing-input-placeholder">100000</span>}
                    </div>
                  </div>
                  <div className="salary-field-item">
                    <span className="salary-field-label">{isEn ? 'Maximum' : 'Максимум'}</span>
                    <div
                      className={`form-input salary-field-input landing-static-input ${
                        salaryTypingStep >= 4 && salaryTypingStep <= 6 ? 'is-typing-input' : ''
                      }`}
                    >
                      {salaryMax || <span className="landing-input-placeholder">140000</span>}
                    </div>
                  </div>
                  <div className="salary-field-item">
                    <span className="salary-field-label">{isEn ? 'Currency' : 'Валюта'}</span>
                    <div className="form-input salary-field-input landing-static-input">$ (USD)</div>
                  </div>
                  <div className="salary-field-item">
                    <span className="salary-field-label">{isEn ? 'Period' : 'Период'}</span>
                    <div className="form-input salary-field-input landing-static-input">
                      {isEn ? 'per year (/ 12)' : 'в год (/ 12)'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Description & AI Summary */}
              {!isDescriptionPresented ? (
                <div className="landing-modal-skeleton-section">
                  <div className="landing-modal-skeleton-group">
                    <div className="landing-modal-skeleton-header">
                      <SkeletonBar width={190} height={12} />
                      <SkeletonBar width={90} height={16} className="is-pill" />
                    </div>
                    <SkeletonBar width="96%" height={11} />
                    <SkeletonBar width="88%" height={11} />
                    <SkeletonBar width="74%" height={11} />
                  </div>

                  <div className="landing-modal-skeleton-group">
                    <div className="landing-modal-skeleton-header">
                      <SkeletonBar width={140} height={12} />
                    </div>
                    <div className="landing-skeleton-chips-row">
                      <SkeletonBar width={52} height={20} />
                      <SkeletonBar width={78} height={20} />
                      <SkeletonBar width={64} height={20} />
                      <SkeletonBar width={58} height={20} />
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Original LinkedIn-speak (Expanded in 2.2, Collapsed in 2.3) */}
                  <div
                    className={`form-group orig-desc-section landing-bloat-section ${
                      isBloatCollapsed ? 'is-collapsed' : 'is-expanded'
                    }`}
                  >
                    <div className="orig-desc-header">
                      <div className="orig-desc-header-title">
                        <FileText size={14} />
                        <span>
                          {isEn
                            ? 'Original LinkedIn Description (4,180 chars)'
                            : 'Оригинальное описание из LinkedIn (4 180 симв.)'}
                        </span>
                      </div>
                      <div className="orig-desc-header-action">
                        <span
                          className={`landing-compression-badge ${
                            isBloatCollapsed ? 'is-done' : 'is-raw'
                          }`}
                        >
                          {isBloatCollapsed
                            ? isEn
                              ? 'FLUFF COLLAPSED (−94%)'
                              : 'ВОДА СХЛОПНУТА (−94%)'
                            : isEn
                              ? '90% CORPORATE FLUFF'
                              : '90% КОРПОРАТИВНОЙ ВОДЫ'}
                        </span>
                        {isBloatCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                      </div>
                    </div>

                    <div className="landing-bloat-collapsible">
                      {LINKEDIN_CORPORATE_BLOAT.map((block) => (
                        <div
                          key={block.id}
                          className={`landing-bloat-paragraph ${
                            block.isBloat ? 'is-corporate-water' : 'is-real-signal'
                          }`}
                        >
                          <span className="landing-bloat-tag">
                            {isEn ? block.labelEn : block.label}
                          </span>
                          <p>{isEn ? block.textEn : block.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Distilled 2-sentence AI Summary: Skeleton in 2.2, Typed out in 2.3 */}
                  {!isSummaryPresented ? (
                    <div className="landing-modal-skeleton-section is-compact">
                      <div className="landing-modal-skeleton-group">
                        <SkeletonBar width={210} height={11} />
                        <SkeletonBar width="92%" height={10} />
                        <SkeletonBar width="76%" height={10} />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="vacancy-ai-summary is-section-focused">
                        <div className="vacancy-ai-summary-header">
                          <div className="vacancy-ai-summary-title">
                            <Sparkles size={15} />
                            <span>
                              {isEn
                                ? 'AI Summary (2 sentences)'
                                : 'Краткое содержание (AI · 2 предложения)'}
                            </span>
                          </div>
                        </div>

                        <p className="vacancy-ai-summary-text">
                          <span>{summaryText.slice(0, summaryTypedChars)}</span>
                          {summaryTypedChars < summaryText.length && (
                            <span className="tw-cursor" aria-hidden="true">▋</span>
                          )}
                          <span className="tw-ghost" aria-hidden="true">
                            {summaryText.slice(summaryTypedChars)}
                          </span>
                        </p>
                      </div>

                      {/* Extracted Tech Stack Tokens */}
                      <div className="form-group vacancy-tokens-section">
                        <div className="form-label">
                          {isEn ? 'Tech Stack' : 'Стек технологий'}
                        </div>
                        <div className="editable-token-list">
                          {vacancy.tech_stack.map((tech) => (
                            <span key={tech} className="editable-token">
                              {tech}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          ) : (
            /* Tab 2: CV Compatibility Evaluation (Match / Missing / Critical / Recommendations) */
            <div className="vacancy-compatibility-content">
              <div className="vacancy-compatibility">
                {/* 1. MATCH (Presented in 3.1) */}
                <div className="compatibility-group">
                  <div className="compatibility-group-title is-matched">
                    <span>
                      {isEn
                        ? `MATCH / Confirmed Requirements (${COMPATIBILITY_DATA.matched_requirements.length}):`
                        : `MATCH / Подтверждённые требования (${COMPATIBILITY_DATA.matched_requirements.length}):`}
                    </span>
                  </div>
                  <div className="compatibility-list">
                    {COMPATIBILITY_DATA.matched_requirements.map((m, idx) => {
                      const isShown = idx < visibleMatchCount;
                      const showQuote = idx === 0 && subScreenId === '3.1';
                      const reqText = isEn ? m.requirementEn : m.requirement;
                      const evText = isEn ? m.evidenceEn : m.evidence;
                      return (
                        <div
                          key={m.requirement}
                          className={`compatibility-row landing-compat-row ${
                            isShown ? 'is-printed' : 'is-pending-print'
                          }`}
                        >
                          <div className="landing-compat-row-main">
                            <span style={{ color: 'var(--aspen-mint)', fontWeight: 600 }}>
                              &bull; {reqText}
                            </span>
                          </div>
                          {showQuote && isShown && evText && (
                            <div className="compatibility-evidence">{evText}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. MISSING (Presented in 3.1) */}
                <div className="compatibility-group">
                  <div className="compatibility-group-title is-missing">
                    <span>
                      {isEn
                        ? `MISSING / Unconfirmed Requirements (${COMPATIBILITY_DATA.missing_requirements.length}):`
                        : `MISSING / Неподтверждённые требования (${COMPATIBILITY_DATA.missing_requirements.length}):`}
                    </span>
                  </div>
                  <div className="compatibility-list">
                    {COMPATIBILITY_DATA.missing_requirements.map((m, idx) => {
                      const isShown = idx < visibleMissingCount;
                      return (
                        <div
                          key={m.requirement}
                          className={`compatibility-row landing-compat-row ${
                            isShown ? 'is-printed' : 'is-pending-print'
                          }`}
                        >
                          &bull; <strong>{isEn ? m.requirementEn : m.requirement}</strong>{' '}
                          <span className="landing-severity-tag">[{m.severity}]</span>:{' '}
                          {isEn ? m.reasonEn : m.reason}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. CRITICAL & 4. RECOMMENDATIONS: Skeleton in 3.1, Printed in 3.2 */}
                {!isCriticalPresented ? (
                  <div className="landing-compat-skeleton-bottom">
                    <div className="landing-modal-skeleton-group">
                      <SkeletonBar width={220} height={11} />
                      <SkeletonBar width="92%" height={10} />
                    </div>
                    <div className="landing-modal-skeleton-group">
                      <SkeletonBar width={250} height={11} />
                      <SkeletonBar width="88%" height={10} />
                      <SkeletonBar width="78%" height={10} />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 3. CRITICAL */}
                    <div className="compatibility-group">
                      <div className="compatibility-group-title is-critical">
                        <span>
                          {isEn
                            ? `CRITICAL / Critical Mismatches (${COMPATIBILITY_DATA.critical_gaps.length}):`
                            : `CRITICAL / Критические несоответствия (${COMPATIBILITY_DATA.critical_gaps.length}):`}
                        </span>
                      </div>
                      <div className="compatibility-list">
                        {COMPATIBILITY_DATA.critical_gaps.map((g, idx) => {
                          const isShown = idx < visibleCriticalCount;
                          return (
                            <div
                              key={g.requirement}
                              className={`compatibility-row landing-compat-row ${
                                isShown ? 'is-printed' : 'is-pending-print'
                              }`}
                            >
                              &bull;{' '}
                              <strong style={{ color: '#f87171' }}>
                                {isEn ? g.requirementEn : g.requirement}
                              </strong>
                              : {isEn ? g.reasonEn : g.reason}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. RECOMMENDATIONS */}
                    <div className="compatibility-recommendations">
                      <div className="compatibility-group-title is-recommendations">
                        <span>
                          {isEn
                            ? 'RECOMMENDATIONS / CV Tailoring Tips:'
                            : 'RECOMMENDATIONS / Рекомендации для адаптации CV:'}
                        </span>
                      </div>
                      <ul className="compatibility-recommendation-list">
                        {recsList.map((rec, idx) => {
                          const isShown = idx < visibleRecsCount;
                          return (
                            <li
                              key={rec}
                              className={`landing-compat-row ${
                                isShown ? 'is-printed' : 'is-pending-print'
                              }`}
                            >
                              {rec}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Scroll-ratio mapping (ratio = scrollTop / stageH, total track = 9.8 * stageH, max ratio = 8.8)
 */
const SUB_SCROLL_TARGETS = [0, 1.5, 2.05, 3.7, 4.5, 5.3, 6.1, 6.8, 7.55, 8.35];

function getSubScreenIdxFromRatio(r) {
  if (r < 1.35) return 0; // 1.1
  if (r < 1.95) return 1; // 1.2 (CARDS APPEAR ON THE BOARD)
  if (r < 3.55) return 2; // 1.3 (MOVING RIGHT ACROSS THE FUNNEL: 6 sequential single-column steps)
  if (r < 4.35) return 3; // 2.1
  if (r < 5.15) return 4; // 2.2
  if (r < 5.95) return 5; // 2.3
  if (r < 6.65) return 6; // 3.1
  if (r < 7.35) return 7; // 3.2
  if (r < 8.1) return 8; // 4.1 (BACK TO BOARD: STRIPE MOVES TO OFFER)
  return 9; // 4.2 (READY TO LAUNCH: FINALE CARD)
}

function getImportStageFromRatio(r) {
  if (r < 0.25) return 0;
  if (r < 0.52) return 1;
  if (r < 0.8) return 2;
  if (r < 1.05) return 3;
  return 4;
}

function getFunnelStageFromRatio(r) {
  if (r < 1.95) return 0; // 1.2: All 3 cards in Column 01
  if (r < 2.21) return 1; // Step 1: Stripe 01 -> 02
  if (r < 2.47) return 2; // Step 2: Stripe 02 -> 03
  if (r < 2.73) return 3; // Step 3: Linear 01 -> 02
  if (r < 2.99) return 4; // Step 4: Cloudflare 01 -> 02
  if (r < 3.25) return 5; // Step 5: Cloudflare 02 -> 03
  if (r < 7.35) return 6; // Step 6: Cloudflare 03 -> 04 (held through Screens 2 & 3)
  return 7; // Step 7 (Screen 4.1+): Stripe 03 -> 04 (Offer!)
}

export default function LandingPage() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const isEn = locale === 'en';

  const [scrollState, setScrollState] = useState({
    idx: 0,
    prevIdx: 0,
    importStage: 0,
    funnelStage: 0,
    prevFunnelStage: 0,
    targetFunnelStage: 0,
  });
  const activeSubIdx = scrollState.idx;
  const isReverse = scrollState.idx < scrollState.prevIdx;
  const importStage = scrollState.importStage;
  const funnelStage = scrollState.funnelStage;
  const prevFunnelStage = scrollState.prevFunnelStage;

  const pageRef = useRef(null);

  const currentSub = SUB_SCREENS[activeSubIdx] || SUB_SCREENS[0];
  const currentScreen = currentSub.screen;

  // Snap the left column and the first 3 Kanban columns to exact multiples of --grid (32px)
  // so that (totalWholeUnits - leftUnits) is divisible by 4: all 4 columns get the same
  // number of 32px grid cells, and the 4th column only absorbs the sub-grid (<32px) remainder.
  useLayoutEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const updateGridWidths = () => {
      if (window.innerWidth <= 1024) {
        root.style.removeProperty('--landing-left-width');
        root.style.removeProperty('--landing-col-width');
        return;
      }
      const grid =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      const totalWidth = root.clientWidth;
      const totalUnits = Math.max(28, Math.floor(totalWidth / grid));
      const idealLeft = totalWidth <= 1360 ? 13 : 15;
      const candidates = [idealLeft, idealLeft - 1, idealLeft + 1, idealLeft - 2, idealLeft + 2];
      const leftUnits =
        candidates.find((L) => (totalUnits - L) % 4 === 0) ?? idealLeft;
      const colUnits = Math.max(5, Math.floor((totalUnits - leftUnits) / 4));

      root.style.setProperty('--landing-left-width', `${leftUnits * grid}px`);
      root.style.setProperty('--landing-col-width', `${colUnits * grid}px`);
    };
    const observer = new ResizeObserver(updateGridWidths);
    observer.observe(root);
    window.addEventListener('resize', updateGridWidths);
    updateGridWidths();
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateGridWidths);
    };
  }, []);

  const getStageHeightPx = useCallback(() => {
    const grid =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
    return Math.max(grid * 12, window.innerHeight - grid * 2);
  }, []);

  // Pure, symmetric scroll-ratio tracker
  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    const scroller = root.closest('.app-shell-content') || window;

    const handleScroll = () => {
      const scrollTop = scroller === window ? window.scrollY : scroller.scrollTop;
      const stageH = getStageHeightPx();
      const ratio = scrollTop / stageH;
      const nextIdx = getSubScreenIdxFromRatio(ratio);
      const nextImportStage = getImportStageFromRatio(ratio);
      const nextTargetFunnel = getFunnelStageFromRatio(ratio);

      setScrollState((prev) => {
        if (
          prev.idx === nextIdx &&
          prev.importStage === nextImportStage &&
          prev.targetFunnelStage === nextTargetFunnel
        ) {
          return prev;
        }

        // If the user scrolled past multiple funnel steps in one fast flick,
        // advance funnelStage by 1 step now and let the sequential stepper timer
        // walk through the remaining intermediate columns one by one.
        let nextFunnel = prev.funnelStage;
        let nextPrevFunnel = prev.prevFunnelStage;

        if (nextIdx === 0) {
          nextFunnel = 0;
          nextPrevFunnel = 0;
        } else if (nextTargetFunnel !== prev.funnelStage) {
          const diff = nextTargetFunnel - prev.funnelStage;
          nextPrevFunnel = prev.funnelStage;
          nextFunnel =
            Math.abs(diff) <= 1 ? nextTargetFunnel : prev.funnelStage + Math.sign(diff);
        }

        return {
          idx: nextIdx,
          prevIdx: prev.idx !== nextIdx ? prev.idx : prev.prevIdx,
          importStage: nextImportStage,
          funnelStage: nextFunnel,
          prevFunnelStage: nextPrevFunnel,
          targetFunnelStage: nextTargetFunnel,
        };
      });
    };

    handleScroll();
    scroller.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      scroller.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [getStageHeightPx]);

  // Sequential stepper: if targetFunnelStage jumped ahead/behind by >1 step,
  // step through each intermediate column every 260ms so cards never skip columns.
  useEffect(() => {
    if (scrollState.funnelStage === scrollState.targetFunnelStage) return undefined;
    const timer = setTimeout(() => {
      setScrollState((prev) => {
        if (prev.funnelStage === prev.targetFunnelStage) return prev;
        const step = Math.sign(prev.targetFunnelStage - prev.funnelStage);
        return {
          ...prev,
          prevFunnelStage: prev.funnelStage,
          funnelStage: prev.funnelStage + step,
        };
      });
    }, 260);
    return () => clearTimeout(timer);
  }, [scrollState.funnelStage, scrollState.targetFunnelStage]);

  const scrollToSubScreen = useCallback(
    (subIdOrIdx) => {
      const idx =
        typeof subIdOrIdx === 'number'
          ? subIdOrIdx
          : SUB_SCREENS.findIndex((s) => s.id === subIdOrIdx);
      if (idx < 0) return;
      const targetRatio = SUB_SCROLL_TARGETS[idx] ?? 0;
      const scroller = pageRef.current?.closest('.app-shell-content') || window;
      const grid =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      const stageH = getStageHeightPx();
      const snappedTop =
        targetRatio <= 0 ? 0 : Math.max(0, Math.round((targetRatio * stageH) / grid) * grid);
      scroller.scrollTo({ top: snappedTop, behavior: 'smooth' });
    },
    [getStageHeightPx]
  );

  // Compute current card states on the Kanban board.
  // In 1.1 (initial state), the board is completely empty!
  // In 1.2 (funnelStage = 0), all 3 cards appear in Column 01.
  // In 1.3 (funnelStage = 1..6), cards move one by one and strictly one column at a time!
  // In 4.1+ (funnelStage = 7), Stripe makes its final move from 03 Собеседование to 04 Оффер!
  const boardVacancies = useMemo(() => {
    if (currentSub.id === '1.1') return [];
    const effectiveStage =
      currentSub.id === '1.2'
        ? 0
        : currentSub.screen === 1 || currentSub.screen === 4
          ? funnelStage
          : 6;
    const prevEffectiveStage =
      currentSub.id === '1.2'
        ? prevFunnelStage
        : currentSub.screen === 1 || currentSub.screen === 4
          ? prevFunnelStage
          : 6;

    const currentMap = FUNNEL_STEP_POSITIONS[effectiveStage] || FUNNEL_STEP_POSITIONS[6];
    const prevMap = FUNNEL_STEP_POSITIONS[prevEffectiveStage] || FUNNEL_STEP_POSITIONS[0];

    return DEMO_VACANCIES.map((v) => {
      const stagePos = currentMap[v.id];
      const prevPos = prevMap[v.id];
      if (!stagePos) return null;

      const curColIdx = BOARD_COLUMNS.findIndex((c) => c.id === stagePos.status);
      const prevColIdx = prevPos
        ? BOARD_COLUMNS.findIndex((c) => c.id === prevPos.status)
        : curColIdx;

      const movedRight = effectiveStage !== prevEffectiveStage && curColIdx > prevColIdx;
      const movedLeft = effectiveStage !== prevEffectiveStage && curColIdx < prevColIdx;
      const arrivedFromImport =
        currentSub.id === '1.2' && !isReverse && prevFunnelStage === 0;

      return {
        ...v,
        history_count: stagePos.historyCount,
        currentStatus: stagePos.status,
        currentLane: stagePos.lane,
        justArrived: arrivedFromImport,
        justMoved: movedRight,
        justMovedBack: movedLeft,
      };
    }).filter(Boolean);
  }, [currentSub, funnelStage, prevFunnelStage, isReverse]);

  // Progressive feature flags for cards on the board
  const showCardSalary = activeSubIdx >= 3; // 2.1+
  const showCardSummary = activeSubIdx >= 5; // 2.3+
  const showCardMatch = activeSubIdx >= 6; // 3.1+

  const isModalVisible = currentScreen === 2 || currentScreen === 3;
  const isBoardUnlocked = currentScreen === 4;
  const isFinaleCardVisible = currentSub.id === '4.2';
  const startApp = () => navigate('/');

  return (
    <main ref={pageRef} className="landing-page bp-page">
      <div className="bp-container">
        {/* Main 2-Column Split:
            Left: Full-height block per screen (only 1 block is ever visible at a time;
                  stays stationary while captions appear for its sub-parts, then slides up and is replaced by the next full-height block).
            Right: Sticky Non-Interactive & Non-Scrolling Kanban & Modal Preview. */}
        <div className="landing-split-layout">
          <div className="landing-left-narrative">
            <div className="landing-left-sticky-viewport">
              {/* Vertical Bullet Navigator along the Left Column */}
              <nav
                className="landing-vnav"
                aria-label={isEn ? 'Screen navigation' : 'Навигация по экранам'}
              >
                <div className="landing-vnav-track">
                  {SCREENS_BLOCKS.map((block) => {
                    const isScreenActive = currentScreen === block.screen;
                    const isScreenDone = currentScreen > block.screen;
                    const firstSubId = block.subIds[0];

                    return (
                      <div
                        key={block.screen}
                        className={`landing-vnav-group ${
                          isScreenActive ? 'is-active' : isScreenDone ? 'is-done' : ''
                        }`}
                      >
                        <button
                          type="button"
                          className={`landing-vnav-screen-bullet ${
                            isScreenActive ? 'is-active' : isScreenDone ? 'is-done' : ''
                          }`}
                          onClick={() => scrollToSubScreen(firstSubId)}
                          title={isEn ? block.headerTitleEn : block.headerTitle}
                          aria-label={isEn ? block.headerTitleEn : block.headerTitle}
                        >
                          <span className="landing-vnav-screen-num">{block.num}</span>
                        </button>

                        <div className="landing-vnav-sub-bullets">
                          {block.subIds.map((subId) => {
                            const subIdx = SUB_SCREENS.findIndex((s) => s.id === subId);
                            const sub = SUB_SCREENS[subIdx];
                            const isSubActive = activeSubIdx === subIdx;
                            const isSubDone = activeSubIdx > subIdx;

                            return (
                              <button
                                key={subId}
                                type="button"
                                className={`landing-vnav-sub-bullet ${
                                  isSubActive ? 'is-active' : isSubDone ? 'is-done' : ''
                                }`}
                                onClick={() => scrollToSubScreen(subIdx)}
                                title={`[${sub.indexLabel}] ${
                                  isEn ? sub.captionLabelEn : sub.captionLabel
                                }`}
                                aria-label={`[${sub.indexLabel}] ${
                                  isEn ? sub.captionLabelEn : sub.captionLabel
                                }`}
                              >
                                <span className="landing-vnav-dot" />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </nav>

              <div className="landing-left-blocks-viewport">
                <div
                  className="landing-left-blocks-reel"
                  style={{
                    transform: `translateY(-${(currentScreen - 1) * 100}%)`,
                  }}
                >
                  {SCREENS_BLOCKS.map((block) => {
                    const blockSubItems = block.subIds.map((id) => {
                      const subIdx = SUB_SCREENS.findIndex((s) => s.id === id);
                      return { sub: SUB_SCREENS[subIdx], subIdx };
                    });

                    return (
                      <section key={block.screen} className="landing-left-full-block">
                        {/* Block Top Header (.column-header) */}
                        <header className="column-header landing-block-header">
                          <div className="column-title-group">
                            <span className="column-index">{block.num}</span>
                            <span
                              className="column-dot"
                              style={{ background: block.color }}
                            />
                            <span className="column-name">
                              {isEn ? block.headerTitleEn : block.headerTitle}
                            </span>
                          </div>
                          <span className="bp-col-tag">{isEn ? block.tagEn : block.tag}</span>
                        </header>

                        {/* Unified Full-Height Block Body */}
                        <div className="landing-full-block-body">
                          {/* Top Hero Area of this Screen Block */}
                          <div className="landing-full-block-hero">
                            <div className="landing-block-kicker">
                              {isEn ? block.kickerEn : block.kicker}
                            </div>
                            <h1 className="landing-block-title">
                              {isEn ? block.titleEn : block.title}
                            </h1>
                            <p className="landing-block-lead">
                              {isEn ? block.leadEn : block.lead}
                            </p>
                          </div>

                          {/* Live Captions / Explanations inside this single Full-Height Block */}
                          <div className="landing-block-captions">
                            <div className="landing-block-captions-title">
                              <span>
                                {isEn
                                  ? 'WHAT IS HAPPENING ON THE RIGHT'
                                  : 'ЧТО ПРОИСХОДИТ НА ЭКРАНЕ СПРАВА'}
                              </span>
                              <span>
                                [{currentSub.screen === block.screen ? currentSub.indexLabel : `${block.num}.1`}]
                              </span>
                            </div>

                            <div className="landing-captions-list">
                              {blockSubItems.map(({ sub, subIdx }) => {
                                const isPresented = activeSubIdx >= subIdx;
                                const isActive = activeSubIdx === subIdx;
                                const isCompleted = activeSubIdx > subIdx;

                                return (
                                  <div
                                    key={sub.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => scrollToSubScreen(subIdx)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        scrollToSubScreen(subIdx);
                                      }
                                    }}
                                    className={`landing-caption-item ${
                                      isActive
                                        ? 'is-active'
                                        : isCompleted
                                          ? 'is-completed'
                                          : 'is-skeleton'
                                    }`}
                                  >
                                    <div className="landing-caption-meta">
                                      <span
                                        className="column-dot"
                                        style={{
                                          background: isPresented
                                            ? sub.dotColor
                                            : 'var(--border-strong)',
                                        }}
                                      />
                                      {isPresented ? (
                                        <span className="landing-caption-label">
                                          {isEn ? sub.captionLabelEn : sub.captionLabel}
                                        </span>
                                      ) : (
                                        <SkeletonBar width={160} height={10} />
                                      )}
                                    </div>

                                    {isPresented ? (
                                      <p className="landing-caption-text">
                                        <TypewriterText
                                          text={isEn ? sub.captionTextEn : sub.captionText}
                                          active={isActive}
                                          completed={isCompleted}
                                          speed={11}
                                        />
                                      </p>
                                    ) : (
                                      <div className="landing-caption-skeleton-lines" aria-hidden="true">
                                        <SkeletonBar width="92%" height={10} />
                                        <SkeletonBar width="68%" height={10} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* CTA Buttons at the bottom of Block 4 */}
                            {block.screen === 4 && (
                              <div className="landing-block-cta">
                                {activeSubIdx >= SUB_SCREENS.length - 1 ? (
                                  <div className="landing-final-actions">
                                    <button
                                      type="button"
                                      className="btn btn-primary"
                                      onClick={startApp}
                                    >
                                      <span>{isEn ? 'Open Board' : 'Перейти к доске'}</span>
                                      <ArrowRight size={14} />
                                    </button>
                                    <a
                                      href="/extension.zip"
                                      download
                                      className="btn btn-secondary"
                                    >
                                      <Download size={14} />
                                      <span>{isEn ? 'Download Extension' : 'Скачать расширение'}</span>
                                    </a>
                                    <Link to="/about" className="btn btn-secondary">
                                      <span>{isEn ? 'About' : 'О проекте'}</span>
                                      <ArrowUpRight size={13} />
                                    </Link>
                                  </div>
                                ) : (
                                  <div className="landing-final-actions" aria-hidden="true">
                                    <SkeletonBar width={160} height={32} />
                                    <SkeletonBar width={150} height={32} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </section>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Kanban & Modal Preview (interactive Finale Card in 4.2) */}
          <div className="landing-right-preview-col" aria-hidden={!isFinaleCardVisible}>
            <div className="landing-sticky-stage">
              <div className="landing-stage-frame">
                {/* Filter Bar: Skeleton on Screens 1–3, Unlocked Blueprint Filter Bar on Screen 4 */}
                <div
                  className={`filter-bar landing-filter-bar ${
                    isBoardUnlocked ? 'landing-filter-unlocked' : 'landing-filter-skeleton'
                  }`}
                >
                  {isBoardUnlocked ? (
                    <>
                      <div className="landing-filter-skel-group">
                        <span className="landing-unlocked-filter-pill">
                          {isEn ? 'Sort: Match % ↓' : 'Сортировка: Match % ↓'}
                        </span>
                        <span className="landing-unlocked-filter-pill">
                          {isEn ? 'Salary: / mo ($)' : 'Зарплата: в месяц ($)'}
                        </span>
                        <span className="landing-unlocked-filter-pill is-highlight">
                          {isEn ? 'Offers: 2' : 'Офферы: 2'}
                        </span>
                      </div>
                      <div className="filter-divider" />
                      <div className="landing-filter-skel-group">
                        <span className="landing-unlocked-tag-pill">#fintech</span>
                        <span className="landing-unlocked-tag-pill">#remote</span>
                        <span className="landing-unlocked-tag-pill">#highload</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="landing-filter-skel-group">
                        <SkeletonBar width={96} height={18} />
                        <SkeletonBar width={112} height={18} />
                        <SkeletonBar width={84} height={18} />
                      </div>
                      <div className="filter-divider" />
                      <div className="landing-filter-skel-group">
                        <SkeletonBar width={48} height={16} className="is-pill" />
                        <SkeletonBar width={58} height={16} className="is-pill" />
                        <SkeletonBar width={52} height={16} className="is-pill" />
                      </div>
                    </>
                  )}
                </div>

                {/* Main Stage Area: Kanban Board + LinkedIn & BatchImportModal Overlay + Open Vacancy Modal + Finale Card */}
                <div className="landing-stage-canvas">
                  {/* Screen 1.1 / 1.2 LinkedIn Screen & Batch Import Modal */}
                  <LandingLinkedInOverlay
                    subScreenId={currentSub.id}
                    importStage={importStage}
                    isEn={isEn}
                  />

                  {/* Kanban Funnel Columns */}
                  <div className="kanban-board landing-kanban-board">
                    {BOARD_COLUMNS.map((col) => {
                      const colCards = boardVacancies.filter((v) => v.currentStatus === col.id);
                      const isOfferColCelebrated = isBoardUnlocked && col.index === '04';
                      return (
                        <div
                          key={col.id}
                          className={`kanban-column landing-kanban-column ${
                            isOfferColCelebrated ? 'is-offer-celebrated' : ''
                          }`}
                        >
                          <div className="column-header">
                            <div className="column-title-group">
                              <span className="column-index">{col.index}</span>
                              <span className="column-dot" style={{ background: col.color }} />
                              <span className="column-name">
                                {isEn ? col.labelEn : col.id}
                              </span>
                              <span className="column-badge">[{colCards.length}]</span>
                            </div>
                          </div>

                          <div className="column-cards landing-column-cards">
                            {colCards.map((vacancy) => (
                              <LandingKanbanCard
                                key={vacancy.id}
                                vacancy={vacancy}
                                status={vacancy.currentStatus}
                                lane={vacancy.currentLane}
                                justArrived={vacancy.justArrived}
                                justMoved={vacancy.justMoved}
                                justMovedBack={vacancy.justMovedBack}
                                isSelected={
                                  (vacancy.id === 101 && isModalVisible) ||
                                  (vacancy.id === 101 && currentSub.id === '4.1')
                                }
                                showSalary={showCardSalary}
                                showSummary={showCardSummary}
                                showMatch={showCardMatch}
                                isEn={isEn}
                                t={t}
                              />
                            ))}

                            {colCards.length === 0 && (
                              <div className="empty-column landing-empty-column">
                                <Inbox className="empty-column-icon" size={16} aria-hidden="true" />
                                <span className="empty-column-title">
                                  {isEn ? 'No cards yet' : 'Пока нет карточек'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Screens 2 & 3: Open Vacancy Modal over the Kanban Board */}
                  {isModalVisible && (
                    <LandingVacancyModal
                      vacancy={DEMO_VACANCIES[0]}
                      subScreenId={currentSub.id}
                      isReverse={isReverse}
                      isEn={isEn}
                      t={t}
                    />
                  )}

                  {/* Screen 4.2: Final Blueprint Launchpad Card over the completed Kanban Board */}
                  {isFinaleCardVisible && (
                    <div className="landing-finale-overlay">
                      <div className="landing-finale-card">
                        <div className="landing-finale-topbar">
                          <span className="landing-finale-kicker">
                            <Award size={13} />
                            <span>
                              {isEn
                                ? 'PIPELINE READY · ZERO SKELETONS LEFT'
                                : 'ВОРОНКА СОБРАНА · ВСЕ ДАННЫЕ РАСКРЫТЫ'}
                            </span>
                          </span>
                          <span className="landing-finale-step-tag">[04.2]</span>
                        </div>

                        <h2 className="landing-finale-title">
                          {isEn
                            ? 'From 3 raw LinkedIn links to 2 Offers on your board'
                            : 'От 3 сырых ссылок с LinkedIn до 2 офферов на вашей доске'}
                        </h2>
                        <p className="landing-finale-subtitle">
                          {isEn
                            ? 'All salaries are normalized to monthly $, HR boilerplate is collapsed into 2 factual lines, and every vacancy is scored against your CV.'
                            : 'Зарплаты приведены к $/мес, HR-вода схлопнута до 2 фактологических строк, а каждая вакансия проверена на Match с вашим резюме.'}
                        </p>

                        <div className="landing-finale-metrics">
                          <div className="landing-finale-metric">
                            <span className="landing-finale-metric-val is-emerald">
                              {isEn ? '3 → 2 OFFERS' : '3 → 2 ОФФЕРА'}
                            </span>
                            <span className="landing-finale-metric-lbl">
                              {isEn ? 'Stripe & Cloudflare in col 04' : 'Stripe и Cloudflare в колонке 04'}
                            </span>
                          </div>
                          <div className="landing-finale-metric">
                            <span className="landing-finale-metric-val is-blue">
                              {isEn ? '−94% FLUFF' : '−94% ВОДЫ'}
                            </span>
                            <span className="landing-finale-metric-lbl">
                              {isEn ? '2-sentence AI summary' : 'AI-выжимка в 2 строки'}
                            </span>
                          </div>
                          <div className="landing-finale-metric">
                            <span className="landing-finale-metric-val is-indigo">84% MATCH</span>
                            <span className="landing-finale-metric-lbl">
                              {isEn ? 'CV verified & gaps found' : 'Сверка с CV и пробелами'}
                            </span>
                          </div>
                        </div>

                        <div className="landing-finale-actions">
                          <button
                            type="button"
                            className="btn btn-primary landing-finale-primary-btn"
                            onClick={startApp}
                          >
                            <span>{isEn ? 'Open Board' : 'Перейти к доске'}</span>
                            <ArrowRight size={15} />
                          </button>
                          <a href="/extension.zip" download className="btn btn-secondary">
                            <Download size={14} />
                            <span>{isEn ? 'Download Extension' : 'Скачать расширение'}</span>
                          </a>
                          <Link to="/about" className="btn btn-secondary">
                            <span>{isEn ? 'About' : 'О проекте'}</span>
                            <ArrowUpRight size={13} />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bottom-Center Scroll Prompt (moved from left column to the center of the right stage) */}
                  <div className="landing-scroll-hint-bar landing-stage-center-scroll">
                    {activeSubIdx < SUB_SCREENS.length - 1 ? (
                      <div
                        className={`landing-scroll-hint-btn ${
                          activeSubIdx === 0 && importStage === 0 ? 'is-initial-pulse' : ''
                        }`}
                      >
                        <div className="landing-scroll-hint-left">
                          <span className="landing-scroll-mouse" aria-hidden="true">
                            <span className="landing-scroll-mouse-wheel" />
                          </span>
                          <div className="landing-scroll-hint-copy">
                            <span className="landing-scroll-hint-title">
                              {isEn ? 'SCROLL DOWN · CONTINUE' : 'SCROLL DOWN · КРУТИТЕ ВНИЗ'}
                            </span>
                            <span className="landing-scroll-hint-sub">
                              {activeSubIdx === 0 && importStage < 4
                                ? isEn
                                  ? `Transferring links from LinkedIn (${Math.min(3, importStage)} / 3)`
                                  : `Перенос ссылок с LinkedIn (${Math.min(3, importStage)} / 3)`
                                : activeSubIdx === 2 && funnelStage < 6
                                  ? isEn
                                    ? `Moving cards across columns (${funnelStage} / 6)`
                                    : `Перемещение карточек по колонкам (${funnelStage} / 6)`
                                  : isEn
                                    ? `Next step: [${SUB_SCREENS[activeSubIdx + 1]?.indexLabel}] ${SUB_SCREENS[activeSubIdx + 1]?.captionLabelEn}`
                                    : `Следующий шаг: [${SUB_SCREENS[activeSubIdx + 1]?.indexLabel}] ${SUB_SCREENS[activeSubIdx + 1]?.captionLabel}`}
                            </span>
                          </div>
                        </div>

                        <div className="landing-scroll-hint-right">
                          <span className="landing-scroll-step-badge">
                            {activeSubIdx + 1}/{SUB_SCREENS.length}
                          </span>
                          <span className="landing-scroll-chevrons" aria-hidden="true">
                            <ChevronDown size={13} />
                            <ChevronDown size={13} />
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="landing-scroll-hint-btn is-completed">
                        <div className="landing-scroll-hint-left">
                          <ChevronUp size={15} />
                          <div className="landing-scroll-hint-copy">
                            <span className="landing-scroll-hint-title">
                              {isEn
                                ? 'TOUR COMPLETED · SCROLL UP'
                                : 'ДЕМОНСТРАЦИЯ ЗАВЕРШЕНА · ВВЕРХ'}
                            </span>
                            <span className="landing-scroll-hint-sub">
                              {isEn
                                ? 'Scroll up to return to the beginning [01.1]'
                                : 'Прокрутите вверх, чтобы вернуться к началу [01.1]'}
                            </span>
                          </div>
                        </div>
                        <span className="landing-scroll-step-badge">
                          {SUB_SCREENS.length}/{SUB_SCREENS.length}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
