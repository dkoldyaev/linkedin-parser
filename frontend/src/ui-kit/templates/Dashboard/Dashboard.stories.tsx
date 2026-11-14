import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical } from 'lucide-react';
import { Dashboard, type DashboardColumn } from './Dashboard';
import { Header } from '../../organisms/Header';
import { FilterList, SearchBar } from '../../molecules';
import storyStyles from './DashboardStory.module.css';

const meta: Meta<typeof Dashboard> = {
  title: 'Templates/Dashboard',
  component: Dashboard,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof Dashboard>;

const MOCK_COLUMNS: readonly DashboardColumn[] = [
  {
    id: 'col-not-contacted',
    name: 'НЕ СВЯЗЫВАЛИСЬ',
    index: '[ 01 ]',
    color: 'blue',
    gridUnits: 10,
    actions: (
      <button type="button" aria-label="Действия с колонкой" className={storyStyles.actionsButton}>
        <MoreVertical size={14} />
      </button>
    ),
    vacancies: [
      {
        id: 'vac-1',
        title: 'Senior Frontend Engineer (React / TypeScript)',
        company: 'Datadog',
        sourceUrl: 'https://linkedin.com/jobs/view/101',
        matchScore: 88,
        workplace: 'remote',
        location: 'Paris, France (Remote)',
        salary: '€95 000 – €110 000 / год',
        summary: 'Разработка компонентов платформы мониторинга на React, TypeScript и WebGL.',
        techStack: ['React', 'TypeScript', 'WebGL', 'GraphQL'],
        tags: ['priority', 'remote-eu'],
        date: '10 нояб.',
        historyCount: 1,
      },
      {
        id: 'vac-2',
        title: 'Full Stack Engineer — Next.js & Node.js',
        company: 'Supabase',
        sourceUrl: 'https://linkedin.com/jobs/view/102',
        matchScore: 74,
        workplace: 'remote',
        location: 'Worldwide',
        salary: '$120 000 – $145 000 / year',
        summary: 'Развитие дашборда управления базой данных и realtime-сервисов.',
        techStack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
        tags: ['worldwide'],
        date: '9 нояб.',
        historyCount: 0,
      },
    ],
  },
  {
    id: 'col-applied',
    name: 'ОТКЛИКНУЛСЯ',
    index: '[ 02 ]',
    color: 'cyan',
    gridUnits: 10,
    actions: (
      <button type="button" aria-label="Действия с колонкой" className={storyStyles.actionsButton}>
        <MoreVertical size={14} />
      </button>
    ),
    vacancies: [
      {
        id: 'vac-3',
        title: 'Staff Frontend Architect — Design Systems',
        company: 'Stripe',
        sourceUrl: 'https://linkedin.com/jobs/view/104',
        matchScore: 96,
        workplace: 'remote',
        location: 'Remote (EU)',
        salary: '$195k–$230k / year',
        summary: 'Архитектура дизайн-системы и UI-кита на React 19 + TypeScript, Storybook 10 и Playwright.',
        techStack: ['React 19', 'Design Systems', 'TypeScript', 'Storybook'],
        tags: ['priority'],
        date: '11 нояб.',
        historyCount: 3,
        hasHistoryComment: true,
      },
    ],
  },
  {
    id: 'col-screening',
    name: 'СКРИНИНГ',
    index: '[ 03 ]',
    color: 'amber',
    gridUnits: 10,
    actions: (
      <button type="button" aria-label="Действия с колонкой" className={storyStyles.actionsButton}>
        <MoreVertical size={14} />
      </button>
    ),
    vacancies: [
      {
        id: 'vac-4',
        title: 'Lead UI Platform Engineer',
        company: 'Figma',
        sourceUrl: 'https://linkedin.com/jobs/view/105',
        matchScore: 92,
        workplace: 'hybrid',
        location: 'London, UK',
        salary: '£130 000 / year',
        summary: 'Инженерная инфраструктура дизайн-инструментов и дизайн-токенов.',
        techStack: ['TypeScript', 'WebAssembly', 'C++', 'React'],
        tags: ['london', 'visa-sponsor'],
        date: '4 нояб.',
        historyCount: 4,
      },
    ],
  },
  {
    id: 'col-offer',
    name: 'ОФФЕР',
    index: '[ 04 ]',
    color: 'emerald',
    gridUnits: 10,
    actions: (
      <button type="button" aria-label="Действия с колонкой" className={storyStyles.actionsButton}>
        <MoreVertical size={14} />
      </button>
    ),
    vacancies: [
      {
        id: 'vac-5',
        title: 'Principal Design Systems Architect',
        company: 'Linear',
        sourceUrl: 'https://linkedin.com/jobs/view/106',
        matchScore: 98,
        workplace: 'remote',
        location: 'Remote (EU/US)',
        salary: '$210 000 / year',
        summary: 'Создание дизайн-системы нового поколения и высокопроизводительных микроинтеракций.',
        techStack: ['React', 'TypeScript', 'CSS Modules', 'Web Audio'],
        tags: ['dream-job'],
        date: '1 нояб.',
        historyCount: 5,
      },
    ],
  },
];

const MOCK_REJECTED: DashboardColumn = {
  id: 'col-rejected',
  name: 'Отказ',
  color: 'rose',
  vacancies: [
    {
      id: 'vac-rej-1',
      title: 'Senior Software Engineer',
      company: 'Legacy Corp',
      location: 'Berlin, Germany',
      salary: '€70 000 / year',
      summary: 'Позиция закрыта внутренним кандидатом.',
      techStack: ['Java', 'Spring', 'React'],
    },
    {
      id: 'vac-rej-2',
      title: 'Frontend Developer',
      company: 'Outdated Startup',
      location: 'Remote',
      salary: '$60 000 / year',
      summary: 'Требование локации в другом часовом поясе.',
      techStack: ['Vue', 'JavaScript'],
    },
  ],
};

function FullDashboardDemo(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [country, setCountry] = useState('');

  return (
    <Dashboard
      header={
        <Header
          title="CV.ALTER"
          subtitle="PARSER & TRACKER"
          search={
            <SearchBar
              value={search}
              onValueChange={setSearch}
              placeholder="Поиск по названию или компании..."
              aria-label="Поиск вакансий"
              expandOnFocus
            />
          }
          queueCount={2}
          onAddVacancies={() => alert('Add vacancies')}
          onRefresh={() => alert('Refresh')}
          showThemeToggle
          onDownloadExtension={() => alert('Download extension')}
          onSettingsClick={() => alert('Settings')}
          user={{
            name: 'Denis Koldyaev',
            email: 'denis@example.com',
          }}
          onLogout={() => alert('Logout')}
          menuOpen={false}
          onMenuToggle={() => alert('Menu toggled')}
        />
      }
      filterBar={
        <FilterList
          dropdowns={[
            {
              id: 'country',
              value: country,
              placeholder: 'Все страны [4]',
              options: [
                { value: 'Cyprus', label: 'Кипр', count: 18 },
                { value: 'Germany', label: 'Германия', count: 42 },
              ],
              onChange: setCountry,
            },
          ]}
          tags={[
            { id: '', label: 'Все теги', count: 18 },
            { id: 'react', label: 'react' },
            { id: 'typescript', label: 'typescript' },
            { id: 'priority', label: 'priority' },
          ]}
          activeTag={selectedTag}
          onTagSelect={setSelectedTag}
          onReset={() => {
            setCountry('');
            setSelectedTag('');
          }}
          resetLabel="Сбросить"
        />
      }
      columns={MOCK_COLUMNS}
      rejectedColumn={MOCK_REJECTED}
      onAddColumn={() => alert('Add column clicked')}
      onCardClick={(vac) => alert(`Clicked vacancy: ${vac.title}`)}
    />
  );
}

export const FullKanbanDashboard: Story = {
  render: () => <FullDashboardDemo />,
};

export const EmptyBoardState: Story = {
  render: () => (
    <Dashboard
      columns={[
        {
          id: 'col-1',
          name: 'НЕ СВЯЗЫВАЛИСЬ',
          index: '[ 01 ]',
          color: 'blue',
          vacancies: [],
        },
        {
          id: 'col-2',
          name: 'ОТКЛИКНУЛСЯ',
          index: '[ 02 ]',
          color: 'cyan',
          vacancies: [],
        },
        {
          id: 'col-3',
          name: 'ИНТЕРВЬЮ',
          index: '[ 03 ]',
          color: 'amber',
          vacancies: [],
        },
      ]}
      onAddColumn={() => alert('Add column')}
    />
  ),
};
