import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  VacancyDetails,
  type VacancyDetailsData,
  type VacancyDetailsProps,
  type VacancyDetailsTab,
} from './VacancyDetails';
import { Button, Modal } from '../../index';
import storyStyles from './VacancyDetailsStory.module.css';

const SAMPLE_VACANCY: VacancyDetailsData = {
  id: 'vac-101',
  title: 'Senior Frontend Platform Engineer',
  company: 'Linear',
  sourceUrl: 'https://linear.app/careers',
  location: 'Amsterdam, Netherlands',
  workplace: 'hybrid',
  dateAdded: '12 нояб. 2026',
  status: 'interview',
  score: 88,
  salaryText: '€95 000 – €110 000 / год',
  aiSummary:
    'Отличный мэтч для профиля Senior/Lead Frontend. Сильный фокус на дизайн-системы, рендеринг Core Web Vitals и TypeScript. Команда Linear ценит высокое внимание к деталям и автономность.',
  companyHighlights:
    'Linear разрабатывает инструмент управления проектами нового поколения для разработчиков. Стек: React 19, TypeScript, Vite, GraphQL.',
  techStack: [
    'React',
    'TypeScript',
    'Vite',
    'GraphQL',
    'Design Systems',
    'Node.js',
    'Tailwind CSS',
    'Playwright',
  ],
  tags: ['high-priority', 'product-company', 'europe-relocation'],
  notes:
    'Связался с рекрутером Анной через LinkedIn. Первый скрининг назначен на четверг в 14:00 CET.',
  originalDescription: `About the Role:
We are looking for a Senior Frontend Platform Engineer to join our Core UI team. You will craft high-performance interactive interfaces used daily by hundreds of thousands of engineers and designers worldwide.

What you'll do:
• Build and evolve our unified design system and core component library
• Optimize client-side bundle performance and Core Web Vitals (LCP, INP, CLS)
• Collaborate closely with product designers to create delightful micro-interactions
• Mentor team members and drive frontend architecture standards

Requirements:
• 5+ years of production experience with modern React & TypeScript
• Proven track record architecting reusable UI component libraries
• Deep knowledge of browser rendering pipelines, Web Workers, and state management
• Passion for craft, keyboard ergonomics, and snappy UI performance`,
  scoringReport: {
    score: 88,
    summary:
      'Отличное соответствие профилю Senior Frontend Platform Engineer. Сильные стороны в React 19, TypeScript, архитектуре дизайн-систем и Vite. Требуется минимальная адаптация под внутренний стек CI/CD.',
    seniorityAssessment: {
      status: 'matched',
      label: 'Senior / Lead',
      comment: 'Полное соответствие заявленным 6+ годам продакшн-опыта.',
    },
    matchedRequirements: [
      {
        id: 'm1',
        requirement: '6+ лет глубокого опыта с React и экосистемой TypeScript',
        evidence: 'Более 7 лет проектирования сложных SPA и платформ на TypeScript/React.',
      },
      {
        id: 'm2',
        requirement: 'Опыт разработки дизайн-систем и UI-библиотек с нуля',
        evidence: 'Разработал и внедрил модульную дизайн-систему на 60+ компонентов в финтех-проекте.',
      },
      {
        id: 'm3',
        requirement: 'Понимание Web Core Vitals, оптимизация LCP/CLS и рендеринга',
        evidence: 'Успешно снизил LCP до 1.1s и устранил Cumulative Layout Shift на высоконагруженном дашборде.',
      },
    ],
    missingRequirements: [
      {
        id: 'miss1',
        requirement: 'Опыт работы с GraphQL Apollo Federation v2',
        severity: 'low',
        reason: 'В резюме указан базовый REST и tRPC; опыт с Federation v2 требует беглого онбординга.',
      },
      {
        id: 'miss2',
        requirement: 'Настройка Kubernetes k8s операторов и Helm чартов',
        severity: 'medium',
        reason: 'Вакансия ожидает базовые навыки развертывания превью-стендов в k8s cluster.',
      },
    ],
    criticalGaps: [
      {
        id: 'crit1',
        requirement: 'Локация в часовом поясе CET (Германия / Нидерланды)',
        reason: 'Требуется совпадение рабочего дня с амстердамским офисом (CET +/- 1 час).',
      },
    ],
  },
  history: [
    {
      id: 'h1',
      stage: 'Отклик отправлен',
      fromStage: 'Не начато',
      timestamp: '02 нояб. 2026, 11:20',
      comment: 'Откликнулся через реферальную ссылку от бывшего коллеги.',
    },
    {
      id: 'h2',
      stage: 'HR Скрининг',
      fromStage: 'Отклик',
      timestamp: '06 нояб. 2026, 16:45',
      comment: 'Прошли скрининг по опыту и ожиданиям по зарплате. Назначили техническое интервью.',
    },
    {
      id: 'h3',
      stage: 'Техническое интервью',
      fromStage: 'HR Скрининг',
      timestamp: '12 нояб. 2026, 14:00',
      isCurrent: true,
      comment: 'Подготовка к секции проектирования архитектуры дизайн-системы.',
    },
  ],
};

const meta: Meta<typeof VacancyDetails> = {
  title: 'Templates/VacancyDetails',
  component: VacancyDetails,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof VacancyDetails>;

function InteractiveVacancyDetailsStory(props: Partial<VacancyDetailsProps>): React.ReactElement {
  const [vacancy, setVacancy] = useState<VacancyDetailsData>(props.vacancy ?? SAMPLE_VACANCY);
  const [activeTab, setActiveTab] = useState<VacancyDetailsTab>(props.activeTab ?? 'overview');

  const handleStatusChange = (status: string) => {
    setVacancy((prev) => ({ ...prev, status }));
  };

  const handleTechChange = (techStack: readonly string[]) => {
    setVacancy((prev) => ({ ...prev, techStack }));
  };

  const handleTagsChange = (tags: readonly string[]) => {
    setVacancy((prev) => ({ ...prev, tags }));
  };

  const handleSaveNotes = (notes: string) => {
    setVacancy((prev) => ({ ...prev, notes }));
  };

  return (
    <VacancyDetails
      {...props}
      vacancy={vacancy}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onStatusChange={handleStatusChange}
      onTechStackChange={handleTechChange}
      onTagsChange={handleTagsChange}
      onSaveNotes={handleSaveNotes}
      onClose={() => alert('Закрыть карточку вакансии')}
      onDelete={() => alert('Удалить вакансию')}
      onReanalyze={() => alert('Запуск повторного AI скоринга')}
    />
  );
}

export const FullOverview: Story = {
  render: () => <InteractiveVacancyDetailsStory defaultTab="overview" />,
};

export const CvCompatibilityTab: Story = {
  render: () => <InteractiveVacancyDetailsStory activeTab="compatibility" />,
};

export const StageHistoryTab: Story = {
  render: () => <InteractiveVacancyDetailsStory activeTab="history" />,
};

export const PersonalNotesTab: Story = {
  render: () => <InteractiveVacancyDetailsStory activeTab="notes" />,
};

export const InsideModal: Story = {
  render: function ModalWrapper() {
    const [isOpen, setIsOpen] = useState(true);

    return (
      <div className={storyStyles.modalStoryContainer}>
        <Button onClick={() => setIsOpen(true)}>Открыть карточку вакансии</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Карточка вакансии"
          description="Детальный просмотр и управление процессом найма"
          size="lg"
          hideCloseButton
        >
          <InteractiveVacancyDetailsStory
            onClose={() => setIsOpen(false)}
            className={storyStyles.modalVacancyContent}
          />
        </Modal>
      </div>
    );
  },
};

export const RejectedState: Story = {
  render: () => {
    const rejectedVacancy: VacancyDetailsData = {
      ...SAMPLE_VACANCY,
      id: 'vac-103',
      title: 'Staff UI Engineer',
      company: 'Figma',
      status: 'rejected',
      isClosed: true,
      score: 42,
    };
    return <InteractiveVacancyDetailsStory vacancy={rejectedVacancy} defaultTab="compatibility" />;
  },
};
