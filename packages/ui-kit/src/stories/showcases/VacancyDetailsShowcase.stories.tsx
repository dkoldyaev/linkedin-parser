import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../../atoms';
import {
  VacancyDetailsModal,
  type VacancyHistoryItem,
  type VacancySalaryData,
} from '../../organisms';

const meta: Meta<typeof VacancyDetailsModal> = {
  title: 'Showcases (Job Tracker)/Vacancy Details Showcase',
  component: VacancyDetailsModal,
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

const STAGE_OPTIONS = [
  { value: 'not_contacted', label: 'Еще не написал' },
  { value: 'applied', label: 'Написал' },
  { value: 'interview', label: 'Собеседование' },
  { value: 'test', label: 'Тестовое' },
  { value: 'offer', label: 'Оффер' },
  { value: 'rejected', label: 'Не подошло' },
];

const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Удаленно' },
  { value: 'hybrid', label: 'Гибрид (Hybrid)' },
  { value: 'onsite', label: 'В офисе' },
];

const COMPATIBILITY_SECTIONS = [
  {
    id: 'confirmed',
    title: 'ПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
    tone: 'success' as const,
    items: [
      {
        id: 'c1',
        title: 'Proven ability to build and deliver web applications with React and TypeScript to a high standard',
        content: '8+ лет опыта глубокой разработки на React, Redux, Zustand, TypeScript, Storybook.',
      },
      {
        id: 'c2',
        title: 'Fluency working with Git and CI workflows',
        content: 'Настройка GitHub Actions, GitLab CI/CD, релизных пайплайнов и мультирепозиториев.',
      },
      {
        id: 'c3',
        title: 'Strong product sense and attention to detail, with the ability to translate user needs into polished interfaces',
        content: 'Проектирование и внедрение дизайн-системы Blueprint, архитектура UX/UI компонентов.',
      },
      {
        id: 'c4',
        title: 'Ability to communicate clearly and effectively with Back-End and Design colleagues',
        content: 'Опыт кросс-функциональной работы в продуктовых командах, синхронизация OpenAPI и Design Tokens.',
      },
      {
        id: 'c5',
        title: 'Ability to profile and fix front-end performance issues effectively',
        content: 'Оптимизация Core Web Vitals (LCP < 1.1s), виртуализация таблиц и профилирование Chrome DevTools.',
      },
    ],
  },
  {
    id: 'unconfirmed',
    title: 'НЕПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
    tone: 'warning' as const,
    items: [
      {
        id: 'u1',
        title: 'Confidence working with modern build tooling such as Bun and Vite',
        actionLabel: 'Подробности',
        content: 'В резюме упоминается Webpack и Vite, но нет подтвержденного продакшн опыта с Bun runtime.',
      },
      {
        id: 'u2',
        title: 'Demonstrated experience with TanStack Router and TanStack Query',
        actionLabel: 'Подробности',
        content: 'Использовался React Router и RTK Query / SWR, прямой опыт с TanStack Router не зафиксирован.',
      },
      {
        id: 'u3',
        title: 'Experience with component libraries such as Chakra UI',
        actionLabel: 'Подробности',
        content: 'Глубокий опыт с Radix UI и собственными UI-Kit, но нет явного опыта с Chakra UI.',
      },
      {
        id: 'u4',
        title: 'Hands-on experience using AI coding agents such as Codex, Claude Code or similar',
        actionLabel: 'Подробности',
        content: 'Опыт работы с LLM API присутствует, но использование CLI агентов не описано в проектах.',
      },
      {
        id: 'u5',
        title: 'Experience with data-dense, real-time or mission-critical UIs (control rooms, trading, monitoring)',
        actionLabel: 'Подробности',
        content: 'Требуется опыт проектирования экранов операторских центров реального времени.',
      },
      {
        id: 'u6',
        title: 'Experience with Grafana Faro or similar real-user monitoring and telemetry',
        actionLabel: 'Подробности',
        content: 'Использовался Sentry и Datadog, опыт с Grafana Faro не подтвержден.',
      },
      {
        id: 'u7',
        title: 'Genuine curiosity about airline operations and motivation to understand the workflows of 24/7 control room users',
        actionLabel: 'Подробности',
        content: 'Отсутствует опыт в домене гражданской авиации и диспетчерских служб.',
      },
    ],
  },
  {
    id: 'critical',
    title: 'КРИТИЧЕСКИЕ НЕСООТВЕТСТВИЯ',
    tone: 'danger' as const,
    defaultExpandedIds: ['crit1'],
    items: [
      {
        id: 'crit1',
        title: 'Genuine curiosity about airline operations and motivation to understand the workflows of 24/7 control room users',
        actionLabel: 'Подробности',
        content: 'Отсутствует любой опыт или интерес к специфике авиации или 24/7 операционных систем, что является критически важным для данной вакансии.',
      },
    ],
  },
];

const RECOMMENDATIONS = [
  'Подчеркнуть опыт работы с реальными системами, требующими высокой производительности и отказоустойчивости (например, live-streaming system, data synchronization, как аналогичные задачам в авиации).',
  'Указать на готовность быстро освоить новые технологии (TanStack Router, TanStack Query, Chakra UI) и обосновать это примером обучения и адаптации к новым инструментам в прошлом (например, миграция с Angular на React).',
  'Добавить информацию о знакомстве с принципами работы 24/7 систем или операционных центров, даже если это не напрямую связано с авиацией, чтобы продемонстрировать понимание критически важных задач.',
  'Упомянуть о готовности работать с AI-кодировщиками (например, Codex, Claude Code) и привести примеры использования аналогичных инструментов или обучения на них.',
];

function VacancyDetailsModalDemo(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Header & Status
  const [title, setTitle] = useState('Sr Frontend Engineer');
  const [workplace, setWorkplace] = useState('hybrid');
  const [isClosed, setIsClosed] = useState(false);
  const [status, setStatus] = useState('not_contacted');

  // Salary
  const [salaryMin, setSalaryMin] = useState('2167');
  const [salaryMax, setSalaryMax] = useState('10833');
  const [salaryCurrency, setSalaryCurrency] = useState('$');
  const [salaryPeriod, setSalaryPeriod] = useState('month');
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);

  // AI summary
  const [resummarizing, setResummarizing] = useState(false);

  // Tech stack & tags
  const [techStack, setTechStack] = useState<string[]>([
    'React',
    'TypeScript',
    'Bun',
    'Vite',
    'TanStack Router',
    'TanStack Query',
    'Chakra UI',
    'Codex',
    'Claude Code',
    'Grafana Faro',
    'test',
    'ping',
  ]);
  const [tags, setTags] = useState<string[]>(['priority', 'spain', 'relocation']);

  // History items
  const [historyItems, setHistoryItems] = useState<VacancyHistoryItem[]>([
    {
      id: 'h1',
      label: 'Еще не написал',
      timestamp: '10 нояб., 23:39',
      tone: 'accent',
      comment: '',
    },
    {
      id: 'h2',
      label: 'Не подошло',
      timestamp: '10 нояб., 22:56',
      tone: 'danger',
      comment: '',
    },
    {
      id: 'h3',
      label: 'Написал',
      timestamp: '9 сент., 14:24',
      tone: 'info',
      comment: '',
    },
    {
      id: 'h4',
      label: 'Не подошло',
      timestamp: '9 сент., 14:24',
      tone: 'danger',
      comment: 'sdgsdbsdgv',
    },
    {
      id: 'h5',
      label: 'Собеседование',
      timestamp: '9 сент., 14:24',
      tone: 'warning',
      comment: 'assdfsdf',
    },
    {
      id: 'h6',
      label: 'Написал',
      timestamp: '9 сент., 14:24',
      tone: 'info',
      comment: '',
    },
    {
      id: 'h7',
      label: 'Еще не написал',
      timestamp: '9 сент., 14:24',
      tone: 'neutral',
      comment: '',
    },
  ]);

  // Notes
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Description
  const [description, setDescription] = useState(
    'Overview\n\nWELCOME TO SITA\n\nAt SITA, we keep airports moving, airlines flying smoothly, and borders open. Our technology and communication innovations power the success of the global air travel industry.'
  );

  const handleSaveSalary = (data: VacancySalaryData) => {
    setSalaryMin(data.min);
    setSalaryMax(data.max);
    setSalaryCurrency(data.currency);
    setSalaryPeriod(data.period);
    setSavedSalarySuccess(true);
    setTimeout(() => setSavedSalarySuccess(false), 2000);
  };

  const handleResummarize = () => {
    setResummarizing(true);
    setTimeout(() => setResummarizing(false), 1200);
  };

  const handleSaveComment = (id: string, comment: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment } : item))
    );
  };

  const handleDeleteComment = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment: '' } : item))
    );
  };

  const handleSaveNotes = (nextNotes: string) => {
    setNotes(nextNotes);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const formattedSalary = `$${Number(salaryMin).toLocaleString()} – $${Number(salaryMax).toLocaleString()} / ${
    salaryPeriod === 'month' ? 'мес' : salaryPeriod === 'year' ? 'год' : 'день'
  }`;

  return (
    <div style={{ padding: 'var(--ui-space-6)' }}>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Открыть карточку вакансии
      </Button>

      <VacancyDetailsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        title={title}
        onTitleChange={setTitle}
        company="SITA"
        sourceUrl="https://linkedin.com"
        location="Barcelona, Catalonia, Spain"
        workplace={workplace}
        workplaceLabel={
          workplace === 'hybrid' ? 'Гибрид' : workplace === 'remote' ? 'Удаленно' : 'В офисе'
        }
        workplaceOptions={WORKPLACE_OPTIONS}
        onWorkplaceChange={setWorkplace}
        isClosed={isClosed}
        onToggleClosed={() => setIsClosed((prev) => !prev)}
        formattedSalary={formattedSalary}
        matchScore={55}
        status={status}
        stageOptions={STAGE_OPTIONS}
        onStatusChange={setStatus}
        salaryMin={salaryMin}
        salaryMax={salaryMax}
        salaryCurrency={salaryCurrency}
        salaryPeriod={salaryPeriod}
        onSaveSalary={handleSaveSalary}
        savedSalarySuccess={savedSalarySuccess}
        aiSummary="Разрабатывать новые функции веб-приложения OCC Assistant Manager, оптимизировать производительность и отзывчивость интерфейсов для отображения реальных данных в режиме реального времени. Создавать сложные рабочие процессы, таблицы, временные шкалы и дашборды для операторов центра управления. Поддерживать библиотеку компонентов и архитектуру фронтенда, включая тестирование, доступность и обработку ошибок. Взаимодействовать с бэкенд- и дизайн-командами для реализации функционала на основе API и данных. Использовать AI-кодировщики для ускорения разработки, а также инструменты телеметрии для анализа производительности."
        companyDescription="SITA обеспечивает технологические решения для международных аэропортов и авиакомпаний, включая системы управления операциями и контрольные центры, которые помогают минимизировать последствия сбоев в авиаперевозках."
        onResummarize={handleResummarize}
        resummarizing={resummarizing}
        techStack={techStack}
        onTechStackChange={setTechStack}
        tags={tags}
        onTagsChange={setTags}
        historyItems={historyItems}
        onSaveComment={handleSaveComment}
        onDeleteComment={handleDeleteComment}
        notes={notes}
        onNotesChange={setNotes}
        onSaveNotes={handleSaveNotes}
        notesSaved={notesSaved}
        description={description}
        onDescriptionChange={setDescription}
        onSaveDescription={(desc) => setDescription(desc)}
        isCvOutdated
        cvOutdatedMessage="CV изменилось после проверки. Показан результат для версии 2. Запустите проверку повторно."
        cvAssessment="Кандидат Дмитрий Кольдяев демонстрирует высокий уровень квалификации по ключевым требованиям вакансии Sr Frontend Engineer у SITA, особенно в области React и TypeScript. Однако отсутствуют прямые упоминания о TanStack Router/Query, Chakra UI, Codex/Claude Code, а также опыта работы с реальными 24/7 операционными системами или Grafana Faro. Также не подтверждены знания Bun и Vite. Уровень опыта соответствует требованиям, но отсутствует специфическая экспертиза в предметной области авиации и реального времени. Рекомендуется акцентировать внимание на релевантных проектах и адаптации к новым технологиям."
        cvLevelStatus="Частично соответствует"
        cvLevelTone="warning"
        cvLevelComment="Кандидат имеет более 10 лет опыта в разработке на React и TypeScript, что соответствует уровню Sr Frontend Engineer. Однако отсутствует специфический опыт в предметной области авиации и реального времени, а также знания некоторых ключевых технологий (TanStack Router/Query, Codex/Claude Code). Это снижает полное соответствие по уровню."
        compatibilityScore={55}
        compatibilityScoreTone="warning"
        compatibilitySections={COMPATIBILITY_SECTIONS}
        recommendations={RECOMMENDATIONS}
        onReject={() => setStatus('rejected')}
      />
    </div>
  );
}

export const InteractiveVacancyDetailsModal: StoryObj<typeof VacancyDetailsModal> = {
  render: () => <VacancyDetailsModalDemo />,
};
