import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Ban,
  Banknote,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Edit3,
  ExternalLink,
  FileText,
  History,
  Layers,
  MapPin,
  MessageSquare,
  Plus,
  RefreshCw,
  Shield,
  Sparkles,
  StickyNote,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  AlertBanner,
  Badge,
  Button,
  CollapsibleSection,
  Icon,
  Input,
  Label,
  Modal,
  Paragraph,
  ReportAccordion,
  SectionHeader,
  Select,
  Stepper,
  Tabs,
  Text,
  Textarea,
  TokenList,
} from '../../index';
import showcaseStyles from './Showcase.module.css';

const meta: Meta = {
  title: 'Showcases (Job Tracker)/Vacancy Details Showcase',
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

function VacancyDetailsModalDemo(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  // Vacancy header & meta
  const [title] = useState('Sr Frontend Engineer');
  const [company] = useState('SITA');
  const [location] = useState('Barcelona, Catalonia, Spain');
  const [workplace, setWorkplace] = useState('hybrid');
  const [isClosed, setIsClosed] = useState(false);
  const [status, setStatus] = useState('not_contacted');

  // Salary
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryMin, setSalaryMin] = useState('2167');
  const [salaryMax, setSalaryMax] = useState('10833');
  const [salaryCurrency, setSalaryCurrency] = useState('$');
  const [salaryPeriod, setSalaryPeriod] = useState('month');

  // AI Summary
  const [resummarizing, setResummarizing] = useState(false);
  const [aiSummary] = useState(
    'Разрабатывать новые функции веб-приложения OCC Assistant Manager, оптимизировать производительность и отзывчивость интерфейсов для отображения реальных данных в режиме реального времени. Создавать сложные рабочие процессы, таблицы, временные шкалы и дашборды для операторов центра управления. Поддерживать библиотеку компонентов и архитектуру фронтенда, включая тестирование, доступность и обработку ошибок. Взаимодействовать с бэкенд- и дизайн-командами для реализации функционала на основе API и данных. Использовать AI-кодировщики для ускорения разработки, а также инструменты телеметрии для анализа производительности.'
  );
  const [companyInfo] = useState(
    'SITA обеспечивает технологические решения для международных аэропортов и авиакомпаний, включая системы управления операциями и контрольные центры, которые помогают минимизировать последствия сбоев в авиаперевозках.'
  );

  // Stack & Tags
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

  // History timeline & comments
  const [historyItems, setHistoryItems] = useState([
    {
      id: 'h1',
      label: 'Еще не написал',
      timestamp: '10 нояб., 23:39',
      tone: 'accent' as const,
      comment: '',
    },
    {
      id: 'h2',
      label: 'Не подошло',
      timestamp: '10 нояб., 22:56',
      tone: 'danger' as const,
      comment: '',
    },
    {
      id: 'h3',
      label: 'Написал',
      timestamp: '9 сент., 14:24',
      tone: 'info' as const,
      comment: '',
    },
    {
      id: 'h4',
      label: 'Не подошло',
      timestamp: '9 сент., 14:24',
      tone: 'danger' as const,
      comment: 'sdgsdbsdgv',
    },
    {
      id: 'h5',
      label: 'Собеседование',
      timestamp: '9 сент., 14:24',
      tone: 'warning' as const,
      comment: 'assdfsdf',
    },
    {
      id: 'h6',
      label: 'Написал',
      timestamp: '9 сент., 14:24',
      tone: 'info' as const,
      comment: '',
    },
    {
      id: 'h7',
      label: 'Еще не написал',
      timestamp: '9 сент., 14:24',
      tone: 'neutral' as const,
      comment: '',
    },
  ]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');

  // Personal notes
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);

  // Original description
  const [description, setDescription] = useState(
    'Overview\n\nWELCOME TO SITA\n\nAt SITA, we keep airports moving, airlines flying smoothly, and borders open. Our technology and communication innovations power the success of the global air travel industry.'
  );
  const [copiedDesc, setCopiedDesc] = useState(false);

  const handleCopyDescription = () => {
    navigator.clipboard.writeText(description);
    setCopiedDesc(true);
    setTimeout(() => setCopiedDesc(false), 2000);
  };

  const handleSaveNotes = () => {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  };

  const handleResummarize = () => {
    setResummarizing(true);
    setTimeout(() => setResummarizing(false), 1200);
  };

  const handleSaveComment = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment: commentDraft } : item))
    );
    setEditingCommentId(null);
    setCommentDraft('');
  };

  const handleDeleteComment = (id: string) => {
    setHistoryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, comment: '' } : item))
    );
  };

  const formattedSalary = `$${Number(salaryMin).toLocaleString()} – $${Number(salaryMax).toLocaleString()} / ${
    salaryPeriod === 'month' ? 'мес' : salaryPeriod === 'year' ? 'год' : 'день'
  }`;

  return (
    <div>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Открыть карточку вакансии
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <Modal.Header
          title={title}
          icon={<Icon icon={Building2} size="sm" tone="secondary" />}
          description={
            <span className={showcaseStyles.companyLinkWrapper}>
              <strong>{company}</strong>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => window.open('https://linkedin.com', '_blank')}
                aria-label="LinkedIn Profile"
              >
                <Icon icon={ExternalLink} size="xs" />
              </Button>
            </span>
          }
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={RefreshCw} size="xs" />}
                onClick={() => undefined}
              >
                ОБНОВИТЬ
              </Button>
              <Button
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={ExternalLink} size="xs" />}
                onClick={() => window.open('https://linkedin.com', '_blank')}
              >
                LINKEDIN
              </Button>
            </>
          }
          meta={
            <Modal.Header.Meta>
              <Text
                variant="caption"
                tone="secondary"
                startIcon={<Icon icon={MapPin} size="xs" />}
              >
                {location}
              </Text>
              <Badge
                variant="outline"
                size="xs"
                tone="accent"
                icon={<Icon icon={Layers} size="xs" />}
              >
                {workplace === 'hybrid' ? 'Гибрид' : workplace === 'remote' ? 'Удаленно' : 'В офисе'}
              </Badge>
              <Text
                variant="mono"
                tone="success"
                weight="semibold"
                startIcon={<Icon icon={Banknote} size="xs" />}
              >
                {formattedSalary}
              </Text>
              {isClosed && (
                <Badge
                  variant="outline"
                  size="xs"
                  tone="danger"
                  icon={<Icon icon={Ban} size="xs" />}
                >
                  Вакансия закрыта
                </Badge>
              )}
            </Modal.Header.Meta>
          }
          tabs={
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              items={[
                {
                  value: 'details',
                  label: 'Описание и детали',
                  icon: <Icon icon={FileText} size="xs" />,
                },
                {
                  value: 'compatibility',
                  label: 'Совместимость с CV',
                  icon: <Icon icon={Shield} size="xs" />,
                  count: 55,
                },
              ]}
            />
          }
        />

        <Modal.Body padding="none">
          {activeTab === 'details' ? (
            <>
              {/* Status and Workplace controls bar */}
              <div className={showcaseStyles.metaBar}>
                <div className={showcaseStyles.statusButtonGroup}>
                  <Text variant="mono-label" tone="muted">
                    Статус:
                  </Text>
                  <div className={showcaseStyles.statusButtonsList}>
                    {STAGE_OPTIONS.map((opt) => (
                      <Button
                        key={opt.value}
                        variant={status === opt.value ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setStatus(opt.value)}
                      >
                        {opt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className={showcaseStyles.metaControlsGroup}>
                  <div className={showcaseStyles.workplaceControl}>
                    <Text variant="mono-label" tone="muted">
                      Формат:
                    </Text>
                    <Select
                      value={workplace}
                      onValueChange={setWorkplace}
                      options={WORKPLACE_OPTIONS}
                      ariaLabel="Формат работы"
                    />
                  </div>

                  <Button
                    variant={isClosed ? 'danger' : 'secondary'}
                    size="sm"
                    startIcon={<Icon icon={isClosed ? Ban : Check} size="xs" />}
                    onClick={() => setIsClosed(!isClosed)}
                  >
                    {isClosed ? 'Вакансия закрыта' : 'Вакансия открыта'}
                  </Button>
                </div>
              </div>

              {/* Salary Section */}
              <div className={showcaseStyles.salaryContainer}>
                <div className={showcaseStyles.salaryHeader}>
                  <div className={showcaseStyles.salaryDisplay}>
                    <Icon icon={Banknote} size="sm" tone="success" />
                    <Text variant="mono-label" tone="secondary">
                      ЗАРПЛАТА:
                    </Text>
                    <Text variant="mono" tone="success" weight="bold">
                      {formattedSalary}
                    </Text>
                  </div>
                  {!isEditingSalary ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      startIcon={<Icon icon={Edit3} size="xs" />}
                      onClick={() => setIsEditingSalary(true)}
                    >
                      РЕДАКТИРОВАТЬ
                    </Button>
                  ) : (
                    <div className={showcaseStyles.salaryActions}>
                      <Button
                        variant="primary"
                        size="sm"
                        startIcon={<Icon icon={Check} size="xs" />}
                        onClick={() => setIsEditingSalary(false)}
                      >
                        Сохранить
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        startIcon={<Icon icon={X} size="xs" />}
                        onClick={() => setIsEditingSalary(false)}
                      >
                        Отмена
                      </Button>
                    </div>
                  )}
                </div>

                {isEditingSalary && (
                  <div className={showcaseStyles.salaryFormGrid}>
                    <div className={showcaseStyles.salaryFieldItem}>
                      <Label>Минимум</Label>
                      <Input
                        type="number"
                        value={salaryMin}
                        onChange={(e) => setSalaryMin(e.target.value)}
                      />
                    </div>
                    <div className={showcaseStyles.salaryFieldItem}>
                      <Label>Максимум</Label>
                      <Input
                        type="number"
                        value={salaryMax}
                        onChange={(e) => setSalaryMax(e.target.value)}
                      />
                    </div>
                    <div className={showcaseStyles.salaryFieldItem}>
                      <Label>Валюта</Label>
                      <Select
                        value={salaryCurrency}
                        onValueChange={setSalaryCurrency}
                        options={[
                          { value: '$', label: '$ (USD)' },
                          { value: '€', label: '€ (EUR)' },
                          { value: '₽', label: '₽ (RUB)' },
                          { value: '£', label: '£ (GBP)' },
                        ]}
                      />
                    </div>
                    <div className={showcaseStyles.salaryFieldItem}>
                      <Label>Период</Label>
                      <Select
                        value={salaryPeriod}
                        onValueChange={setSalaryPeriod}
                        options={[
                          { value: 'month', label: 'в месяц' },
                          { value: 'year', label: 'в год' },
                          { value: 'day', label: 'в день' },
                          { value: 'hour', label: 'в час' },
                        ]}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* AI Summary Section */}
              <div className={showcaseStyles.aiSummarySection}>
                <SectionHeader
                  title="AI-САММАРИ ВАКАНСИИ"
                  icon={Sparkles}
                  iconTone="mint"
                  accessory={
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={resummarizing}
                      startIcon={<Icon icon={RefreshCw} size="xs" />}
                      onClick={handleResummarize}
                    >
                      ОБНОВИТЬ AI
                    </Button>
                  }
                />
                <Paragraph size="sm">{aiSummary}</Paragraph>
                <div className={showcaseStyles.companyInfoBox}>
                  <Paragraph size="sm" tone="secondary">
                    <strong>О компании: </strong>
                    {companyInfo}
                  </Paragraph>
                </div>
              </div>

              {/* Tech Stack */}
              <div className={showcaseStyles.paddedSection}>
                <SectionHeader title="СТЕК ТЕХНОЛОГИЙ" />
                <div className={showcaseStyles.ptSm}>
                  <TokenList
                    mode="editable"
                    tokens={techStack}
                    onChange={setTechStack}
                    placeholder="Добавить технологию..."
                  />
                </div>
              </div>

              {/* Tags */}
              <div className={showcaseStyles.paddedSection}>
                <SectionHeader title="ТЕГИ" />
                <div className={showcaseStyles.ptSm}>
                  <TokenList
                    mode="editable"
                    variant="tag"
                    tokens={tags}
                    onChange={setTags}
                    placeholder="Добавить тег..."
                  />
                </div>
              </div>

              {/* Stage History */}
              <div className={showcaseStyles.paddedSection}>
                <SectionHeader
                  title="ИСТОРИЯ ЭТАПОВ И ПЕРЕМЕЩЕНИЙ"
                  icon={History}
                  iconTone="accent"
                  accessory={
                    <Badge variant="counter" size="xs" tone="neutral">
                      {historyItems.length} этапов
                    </Badge>
                  }
                />
                <div className={showcaseStyles.ptMd}>
                  <ol className={showcaseStyles.historyList}>
                    {historyItems.map((item, idx) => {
                      const isEditing = editingCommentId === item.id;
                      return (
                        <Stepper.Item
                          key={item.id}
                          id={item.id}
                          label={item.label}
                          timestamp={item.timestamp}
                          tone={item.tone}
                          active={idx === 0}
                          isLast={idx === historyItems.length - 1}
                          description={
                            <div className={showcaseStyles.historyItemWrapper}>
                              {isEditing ? (
                                <div className={showcaseStyles.historyCommentForm}>
                                  <Textarea
                                    rows={2}
                                    placeholder="Комментарий к этапу..."
                                    value={commentDraft}
                                    onChange={(e) => setCommentDraft(e.target.value)}
                                  />
                                  <div className={showcaseStyles.historyCommentActions}>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      startIcon={<Icon icon={Check} size="xs" />}
                                      onClick={() => handleSaveComment(item.id)}
                                    >
                                      Сохранить
                                    </Button>
                                    <Button
                                      variant="secondary"
                                      size="sm"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setCommentDraft('');
                                      }}
                                    >
                                      Отмена
                                    </Button>
                                  </div>
                                </div>
                              ) : item.comment ? (
                                <div className={showcaseStyles.historyCommentBubble}>
                                  <div className={showcaseStyles.commentContent}>
                                    <Icon icon={MessageSquare} size="xs" tone="secondary" />
                                    <Text variant="caption" tone="primary">
                                      {item.comment}
                                    </Text>
                                  </div>
                                  <div className={showcaseStyles.commentTools}>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      onClick={() => {
                                        setEditingCommentId(item.id);
                                        setCommentDraft(item.comment);
                                      }}
                                    >
                                      <Icon icon={Edit3} size="xs" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      tone="danger"
                                      onClick={() => handleDeleteComment(item.id)}
                                    >
                                      <Icon icon={Trash2} size="xs" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  startIcon={<Icon icon={Plus} size="xs" />}
                                  onClick={() => {
                                    setEditingCommentId(item.id);
                                    setCommentDraft('');
                                  }}
                                >
                                  Добавить комментарий к этапу
                                </Button>
                              )}
                            </div>
                          }
                        />
                      );
                    })}
                  </ol>
                </div>
              </div>

              {/* Personal Notes */}
              <div className={showcaseStyles.paddedSection}>
                <SectionHeader
                  title="ЗАМЕТКИ"
                  icon={StickyNote}
                  accessory={
                    <Button
                      variant="secondary"
                      size="sm"
                      startIcon={<Icon icon={notesSaved ? Check : CheckCircle2} size="xs" />}
                      onClick={handleSaveNotes}
                    >
                      {notesSaved ? 'СОХРАНЕНО' : 'СОХРАНИТЬ ЗАМЕТКИ'}
                    </Button>
                  }
                />
                <div className={showcaseStyles.ptSm}>
                  <Textarea
                    rows={3}
                    placeholder="Ваши комментарии, контакты рекрутера, этапы, вопросы к интервью..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Original Vacancy Description */}
              <div className={showcaseStyles.paddedSectionLast}>
                <CollapsibleSection
                  title="ОРИГИНАЛЬНОЕ ОПИСАНИЕ ВАКАНСИИ"
                  icon={FileText}
                  defaultOpen={false}
                  expandLabel="ПОКАЗАТЬ ПОЛНОСТЬЮ"
                  collapseLabel="СВЕРНУТЬ"
                  accessory={
                    <div className={showcaseStyles.collapsibleActions}>
                      <Button
                        variant="secondary"
                        size="sm"
                        startIcon={<Icon icon={Check} size="xs" />}
                        onClick={() => undefined}
                      >
                        СОХРАНИТЬ ТЕКСТ
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        startIcon={<Icon icon={copiedDesc ? Check : Copy} size="xs" />}
                        onClick={handleCopyDescription}
                      >
                        {copiedDesc ? 'СКОПИРОВАНО' : 'КОПИРОВАТЬ ОПИСАНИЕ'}
                      </Button>
                    </div>
                  }
                >
                  <Textarea
                    rows={8}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </CollapsibleSection>
              </div>
            </>
          ) : (
            /* Tab: Compatibility with CV */
            <div className={showcaseStyles.compatibilityContainer}>
              <AlertBanner tone="warning">
                CV изменилось после проверки. Показан результат для версии 2. Запустите проверку повторно.
              </AlertBanner>

              <div className={showcaseStyles.assessmentBox}>
                <Paragraph size="sm">
                  Кандидат Дмитрий Кольдяев демонстрирует высокий уровень квалификации по ключевым требованиям вакансии Sr Frontend Engineer у SITA, особенно в области React и TypeScript. Однако отсутствуют прямые упоминания о TanStack Router/Query, Chakra UI, Codex/Claude Code, а также опыта работы с реальными 24/7 операционными системами или Grafana Faro. Также не подтверждены знания Bun и Vite. Уровень опыта соответствует требованиям, но отсутствует специфическая экспертиза в предметной области авиации и реального времени. Рекомендуется акцентировать внимание на релевантных проектах и адаптации к новым технологиям.
                </Paragraph>
                <div className={showcaseStyles.levelAssessment}>
                  <Paragraph size="sm">
                    Соответствие уровня: <Text as="span" weight="bold" tone="warning">Частично соответствует</Text> — Кандидат имеет более 10 лет опыта в разработке на React и TypeScript, что соответствует уровню Sr Frontend Engineer. Однако отсутствует специфический опыт в предметной области авиации и реального времени, а также знания некоторых ключевых технологий (TanStack Router/Query, Codex/Claude Code). Это снижает полное соответствие по уровню.
                  </Paragraph>
                </div>
              </div>

              <ReportAccordion
                title="Совместимость с CV"
                scoreLabel="55%"
                scoreTone="warning"
                onAction={() => undefined}
                actionLabel="ПРОВЕРИТЬ ПОВТОРНО"
                defaultActionLabel="Подтверждение"
                sections={[
                  {
                    id: 'confirmed',
                    title: 'ПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
                    tone: 'mint',
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
                    tone: 'warning',
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
                    tone: 'danger',
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
                ]}
              />

              {/* Recommendations */}
              <div className={showcaseStyles.recommendationsBox}>
                <SectionHeader title="РЕКОМЕНДАЦИИ ДЛЯ CV:" tone="accent" />
                <div className={showcaseStyles.ptSm}>
                  <ul className={showcaseStyles.recommendationsList}>
                    <li>
                      <Text variant="body-sm" tone="secondary">
                        Подчеркнуть опыт работы с реальными системами, требующими высокой производительности и отказоустойчивости (например, live-streaming system, data synchronization, как аналогичные задачам в авиации).
                      </Text>
                    </li>
                    <li>
                      <Text variant="body-sm" tone="secondary">
                        Указать на готовность быстро освоить новые технологии (TanStack Router, TanStack Query, Chakra UI) и обосновать это примером обучения и адаптации к новым инструментам в прошлом (например, миграция с Angular на React).
                      </Text>
                    </li>
                    <li>
                      <Text variant="body-sm" tone="secondary">
                        Добавить информацию о знакомстве с принципами работы 24/7 систем или операционных центров, даже если это не напрямую связано с авиацией, чтобы продемонстрировать понимание критически важных задач.
                      </Text>
                    </li>
                    <li>
                      <Text variant="body-sm" tone="secondary">
                        Упомянуть о готовности работать с AI-кодировщиками (например, Codex, Claude Code) и привести примеры использования аналогичных инструментов или обучения на них.
                      </Text>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer justify="between">
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            startIcon={<Icon icon={XCircle} size="xs" />}
            onClick={() => setStatus('rejected')}
          >
            В НЕ ПОДОШЛО
          </Button>
          <Modal.Footer.Actions>
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              ЗАКРЫТЬ
            </Button>
          </Modal.Footer.Actions>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export const InteractiveVacancyDetailsModal: StoryObj = {
  render: () => <VacancyDetailsModalDemo />,
};
