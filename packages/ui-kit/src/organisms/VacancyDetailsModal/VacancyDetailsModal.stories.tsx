import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import {
  VacancyDetailsModal,
  type VacancyDetailsModalProps,
  type VacancyHistoryItem,
} from './VacancyDetailsModal';
import layoutStyles from '../../stories/StoryLayout.module.css';

const STAGE_OPTIONS = [
  { value: 'not_contacted', label: 'Еще не написал' },
  { value: 'applied', label: 'Написал' },
  { value: 'interview', label: 'Собеседование' },
  { value: 'offer', label: 'Оффер' },
  { value: 'rejected', label: 'Не подошло' },
];

const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Удаленно' },
  { value: 'hybrid', label: 'Гибрид' },
  { value: 'onsite', label: 'В офисе' },
];

const SAMPLE_HISTORY: readonly VacancyHistoryItem[] = [
  {
    id: 'h1',
    label: 'Собеседование',
    fromLabel: 'Написал',
    timestamp: '14 нояб., 15:00',
    tone: 'success',
    comment: 'Успешный скрининг с тимлидом.',
  },
  {
    id: 'h2',
    label: 'Написал',
    timestamp: '10 нояб., 11:30',
    tone: 'info',
  },
];

const SAMPLE_SECTIONS = [
  {
    id: 'confirmed',
    title: 'ПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
    tone: 'success' as const,
    items: [
      {
        id: 'c1',
        title: 'Глубокий опыт разработки на React 19 и TypeScript',
        content: '8+ лет коммерческого опыта построения фронтенд-платформ и UI-китов.',
      },
    ],
  },
  {
    id: 'gaps',
    title: 'НЕПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
    tone: 'warning' as const,
    items: [
      {
        id: 'u1',
        title: 'Опыт работы с Grafana Faro RUM',
        content: 'В резюме указаны Sentry и Datadog.',
      },
    ],
  },
];

const meta: Meta<typeof VacancyDetailsModal> = {
  title: 'Organisms/VacancyDetailsModal',
  component: VacancyDetailsModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Комплексный организм модального окна деталей вакансии `VacancyDetailsModal`. Объединяет `<Modal>`, `<Modal.Header>`, `<Tabs>` («Описание и детали» / «Совместимость с CV»), панель переключения статуса и формата работы, редактируемую секцию зарплаты, AI-саммари, списки `<TagsList>` для технологического стека и тегов, таймлайн истории `<Stepper>` с комментариями, секции заметок и оригинального текста, а также аналитический отчет `<ReportAccordion>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    isOpen: false,
    size: 'xl',
    title: 'Sr Frontend Platform Engineer',
    company: 'SITA',
    sourceUrl: 'https://linkedin.com',
    location: 'Barcelona, Spain',
    workplace: 'hybrid',
    workplaceLabel: 'Гибрид',
    formattedSalary: '$4,500 – $8,500 / мес',
    isClosed: false,
    matchScore: 84,
    activeTab: 'details',
    status: 'interview',
    stageOptions: STAGE_OPTIONS,
    workplaceOptions: WORKPLACE_OPTIONS,
    salaryMin: '4500',
    salaryMax: '8500',
    salaryCurrency: '$',
    salaryPeriod: 'month',
    aiSummary:
      'Разработка веб-приложения управления операциями в реальном времени, поддержка библиотеки компонентов и оптимизация производительности интерфейсов.',
    companyDescription:
      'Международный поставщик ИТ-решений и телекоммуникаций для авиационной индустрии.',
    techStack: ['React 19', 'TypeScript', 'Vite', 'Storybook 10'],
    tags: ['priority', 'spain'],
    historyItems: SAMPLE_HISTORY,
    notes: 'Созвон с архитектором в четверг в 14:00.',
    description: 'Overview: We are looking for a Senior Frontend Platform Engineer...',
    isCvOutdated: false,
    cvAssessment: 'Кандидат демонстрирует высокое соответствие требованиям по React и TypeScript.',
    cvLevelStatus: 'Полностью соответствует',
    cvLevelTone: 'success',
    compatibilityScore: 84,
    compatibilityScoreTone: 'success',
    compatibilitySections: SAMPLE_SECTIONS,
    recommendations: [
      'Сделать акцент на опыте построения real-time дашбордов и систем мониторинга.',
    ],
  },
  argTypes: {
    isOpen: { control: 'boolean', description: 'Открытое/закрытое состояние модального окна.' },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Размер модального окна.',
    },
    title: { control: 'text', description: 'Заголовок должности.' },
    company: { control: 'text', description: 'Название компании.' },
    location: { control: 'text', description: 'Локация вакансии.' },
    workplace: {
      control: 'inline-radio',
      options: ['remote', 'hybrid', 'onsite'],
      description: 'Формат работы.',
    },
    formattedSalary: { control: 'text', description: 'Отформатированная строка зарплаты.' },
    isClosed: { control: 'boolean', description: 'Флаг закрытой вакансии.' },
    matchScore: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Процент совместимости в бейдже вкладки.',
    },
    activeTab: {
      control: 'inline-radio',
      options: ['details', 'compatibility'],
      description: 'Активная вкладка модального окна (`details` или `compatibility`).',
    },
    status: {
      control: 'select',
      options: ['not_contacted', 'applied', 'interview', 'offer', 'rejected'],
      description: 'Текущий этап воронки вакансии.',
    },
    aiSummary: { control: 'text', description: 'Текст AI-саммари вакансии.' },
    isCvOutdated: {
      control: 'boolean',
      description: 'Показывает предупреждающий баннер о том, что CV изменилось после последней проверки.',
    },
    compatibilityScore: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Оценка совместимости во вкладке отчета.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VacancyDetailsModal>;

function InteractiveVacancyModalDemo(args: VacancyDetailsModalProps): React.ReactElement {
  const [open, setOpen] = useState(args.isOpen);
  const [tab, setTab] = useState(args.activeTab ?? 'details');
  const [status, setStatus] = useState(args.status ?? 'interview');
  const [workplace, setWorkplace] = useState(args.workplace ?? 'hybrid');
  const [closed, setClosed] = useState(Boolean(args.isClosed));
  const [techStack, setTechStack] = useState<string[]>([...(args.techStack ?? [])]);
  const [tags, setTags] = useState<string[]>([...(args.tags ?? [])]);

  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);

  React.useEffect(() => {
    if (args.activeTab) {
      setTab(args.activeTab);
    }
  }, [args.activeTab]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          VacancyDetailsModal — Полное модальное окно инспектора вакансии
        </Text>
        <Text variant="caption" tone="secondary">
          Нажмите кнопку ниже для открытия модального окна (активная вкладка: {tab}).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Открыть VacancyDetailsModal ({tab})
          </Button>
        </div>
        <VacancyDetailsModal
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          activeTab={tab}
          onTabChange={setTab}
          status={status}
          onStatusChange={setStatus}
          workplace={workplace}
          onWorkplaceChange={setWorkplace}
          isClosed={closed}
          onToggleClosed={() => setClosed((prev) => !prev)}
          techStack={techStack}
          onTechStackChange={setTechStack}
          tags={tags}
          onTagsChange={setTags}
          onResummarize={() => undefined}
          onSaveSalary={() => undefined}
          onSaveNotes={() => undefined}
          onSaveDescription={() => undefined}
          onReject={() => setStatus('rejected')}
        />
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `VacancyDetailsModal`. Откройте окно кнопкой и переключайте вкладки (`activeTab`), статус (`status`), `matchScore`, `isClosed`, `isCvOutdated` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveVacancyModalDemo {...args} />,
};

export const PropActiveTabCompatibility: Story = {
  name: 'Пропсы: activeTab="compatibility", isCvOutdated и compatibilityScore',
  args: {
    activeTab: 'compatibility',
    isCvOutdated: true,
    compatibilityScore: 84,
  },
  parameters: {
    controls: { include: ['activeTab', 'isCvOutdated', 'compatibilityScore'] },
    docs: {
      description: {
        story:
          'Демонстрация вкладки «Совместимость с CV» (`activeTab="compatibility"`), отображающей предупреждение `isCvOutdated`, общую оценку `cvAssessment`, `<ReportAccordion>` и список рекомендаций. Доступны только контролы `activeTab`, `isCvOutdated` и `compatibilityScore`.',
      },
    },
  },
  render: (args) => <InteractiveVacancyModalDemo {...args} />,
};

export const PropHeaderAndStatusControls: Story = {
  name: 'Пропсы: title, company, status, workplace и isClosed',
  args: {
    activeTab: 'details',
    title: 'Lead Design Systems Architect',
    company: 'Stripe',
    status: 'offer',
    workplace: 'remote',
    isClosed: false,
  },
  parameters: {
    controls: { include: ['title', 'company', 'status', 'workplace', 'isClosed'] },
    docs: {
      description: {
        story:
          'Пропсы шапки и панели быстрых переключателей статуса воронки (`status`, `stageOptions`) и формата работы (`workplace`, `workplaceOptions`). Доступны только контролы `title`, `company`, `status`, `workplace` и `isClosed`.',
      },
    },
  },
  render: (args) => <InteractiveVacancyModalDemo {...args} />,
};
