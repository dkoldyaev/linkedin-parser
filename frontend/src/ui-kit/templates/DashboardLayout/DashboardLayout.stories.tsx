import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronDown, MoreVertical, Plus } from 'lucide-react';
import { DashboardLayout } from './DashboardLayout';
import { VacancyCard, Header } from '../../organisms';
import { FilterList, SearchBar } from '../../molecules';
import { Badge } from '../../atoms';
import { cn } from '../../utils';
import styles from './DashboardLayout.module.css';
import storyStyles from './DashboardLayoutStory.module.css';

const meta: Meta<typeof DashboardLayout> = {
  title: 'Templates/DashboardLayout',
  component: DashboardLayout,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof DashboardLayout>;

const MOCK_VACANCIES = {
  notContacted: [
    {
      id: 'vac-1',
      title: 'Senior Frontend Engineer (React / TypeScript)',
      company: 'Datadog',
      sourceUrl: 'https://linkedin.com/jobs/view/101',
      matchScore: 88,
      workplace: 'remote' as const,
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
      workplace: 'remote' as const,
      location: 'Worldwide',
      salary: '$120 000 – $145 000 / year',
      summary: 'Развитие дашборда управления базой данных и realtime-сервисов.',
      techStack: ['Next.js', 'TypeScript', 'Node.js', 'PostgreSQL'],
      tags: ['worldwide'],
      date: '9 нояб.',
      historyCount: 0,
    },
  ],
  applied: [
    {
      id: 'vac-3',
      title: 'Software Engineer — API Integrations & CRM Development',
      company: 'Unknown',
      sourceUrl: 'https://linkedin.com/jobs/view/103',
      matchScore: 65,
      workplace: 'remote' as const,
      location: 'Worldwide',
      salary: 'USD11 200 / мес',
      summary: 'Вакансия Software Engineer — API Integrations & CRM Development в Unknown (Worldwide). Ключевой стек: Javascript, Typescript, Php, Swift.',
      techStack: ['Javascript', 'Typescript', 'Php', 'Swift'],
      date: '6 нояб.',
      historyCount: 2,
    },
    {
      id: 'vac-4',
      title: 'Staff Frontend Architect — Design Systems',
      company: 'Stripe',
      sourceUrl: 'https://linkedin.com/jobs/view/104',
      matchScore: 96,
      workplace: 'remote' as const,
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
  screening: [
    {
      id: 'vac-5',
      title: 'Lead UI Platform Engineer',
      company: 'Figma',
      sourceUrl: 'https://linkedin.com/jobs/view/105',
      matchScore: 92,
      workplace: 'hybrid' as const,
      location: 'London, UK',
      salary: '£130 000 / year',
      summary: 'Инженерная инфраструктура дизайн-инструментов и дизайн-токенов.',
      techStack: ['TypeScript', 'WebAssembly', 'C++', 'React'],
      tags: ['london', 'visa-sponsor'],
      date: '4 нояб.',
      historyCount: 4,
    },
  ],
  offer: [
    {
      id: 'vac-6',
      title: 'Principal Design Systems Architect',
      company: 'Linear',
      sourceUrl: 'https://linkedin.com/jobs/view/106',
      matchScore: 98,
      workplace: 'remote' as const,
      location: 'Remote (EU/US)',
      salary: '$210 000 / year',
      summary: 'Создание дизайн-системы нового поколения и высокопроизводительных микроинтеракций.',
      techStack: ['React', 'TypeScript', 'CSS Modules', 'Web Audio'],
      tags: ['dream-job'],
      date: '1 нояб.',
      historyCount: 5,
    },
  ],
};

function KanbanDashboardDemo(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [workplace, setWorkplace] = useState<string>('');
  const [closed, setClosed] = useState<string>('');
  const [rejectedCollapsed, setRejectedCollapsed] = useState<boolean>(true);

  return (
    <DashboardLayout
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
          onAddVacancies={() => alert('Add vacancies clicked')}
          onRefresh={() => alert('Refresh clicked')}
          showThemeToggle
          onDownloadExtension={() => alert('Download extension')}
          onSettingsClick={() => alert('Settings clicked')}
          user={{
            name: 'Denis Koldyaev',
            email: 'denis@example.com',
          }}
          onLogout={() => alert('Logout clicked')}
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
            {
              id: 'city',
              value: city,
              placeholder: 'Все города [12]',
              options: [
                { value: 'Limassol', label: 'Лимассол', count: 12 },
                { value: 'Berlin', label: 'Берлин', count: 28 },
              ],
              onChange: setCity,
            },
            {
              id: 'workplace',
              value: workplace,
              placeholder: 'Все форматы',
              options: [
                { value: 'remote', label: 'Удаленно' },
                { value: 'hybrid', label: 'Гибрид' },
                { value: 'on-site', label: 'В офисе' },
              ],
              onChange: setWorkplace,
            },
            {
              id: 'closed',
              value: closed,
              placeholder: 'Все статусы',
              options: [
                { value: 'false', label: 'Открытые' },
                { value: 'true', label: 'Закрытые' },
              ],
              onChange: setClosed,
            },
          ]}
          tags={[
            { id: '', label: 'Все теги', count: 18 },
            { id: 'react', label: 'react' },
            { id: 'typescript', label: 'typescript' },
            { id: 'bun', label: 'bun' },
            { id: 'remote-eu', label: 'remote-eu' },
            { id: 'priority', label: 'priority' },
          ]}
          activeTag={selectedTag}
          onTagSelect={setSelectedTag}
          onReset={() => {
            setCountry('');
            setCity('');
            setWorkplace('');
            setClosed('');
            setSelectedTag('');
          }}
          resetLabel="Сбросить"
        />
      }
      footer={
        <div className={styles.rejectedBlock}>
          <div
            className={styles.rejectedHeader}
            onClick={() => setRejectedCollapsed((prev) => !prev)}
            role="button"
            tabIndex={0}
          >
            <div className={storyStyles.rejectedHeaderInner}>
              <ChevronDown
                size={14}
                className={
                  rejectedCollapsed
                    ? storyStyles.chevronRotated
                    : storyStyles.chevronExpanded
                }
              />
              <span className={storyStyles.rejectedLabel}>ОТКАЗ</span>
              <Badge size="sm" tone="danger">2</Badge>
            </div>
            <span className={storyStyles.rejectedToggleHint}>
              {rejectedCollapsed ? 'РАСКРЫТЬ' : 'СВЕРНУТЬ'}
            </span>
          </div>
        </div>
      }
    >
      <div className={styles.kanbanBoard}>
        {/* Column 1: Не связывались */}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnIndex}>[ 01 ]</span>
              <span className={cn(styles.columnDot, storyStyles.dotNotContacted)} />
              <span className={styles.columnName}>НЕ СВЯЗЫВАЛИСЬ</span>
              <span className={styles.columnBadge}>[{MOCK_VACANCIES.notContacted.length}]</span>
            </div>
            <button type="button" className={storyStyles.colActionsBtn}>
              <MoreVertical size={14} />
            </button>
          </div>
          <div className={styles.columnCards}>
            {MOCK_VACANCIES.notContacted.map((v) => (
              <VacancyCard key={v.id} {...v} />
            ))}
          </div>
        </div>

        {/* Column 2: Откликнулся */}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnIndex}>[ 02 ]</span>
              <span className={cn(styles.columnDot, storyStyles.dotApplied)} />
              <span className={styles.columnName}>ОТКЛИКНУЛСЯ</span>
              <span className={styles.columnBadge}>[{MOCK_VACANCIES.applied.length}]</span>
            </div>
            <button type="button" className={storyStyles.colActionsBtn}>
              <MoreVertical size={14} />
            </button>
          </div>
          <div className={styles.columnCards}>
            {MOCK_VACANCIES.applied.map((v) => (
              <VacancyCard key={v.id} {...v} />
            ))}
          </div>
        </div>

        {/* Column 3: Скрининг */}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnIndex}>[ 03 ]</span>
              <span className={cn(styles.columnDot, storyStyles.dotScreening)} />
              <span className={styles.columnName}>СКРИНИНГ</span>
              <span className={styles.columnBadge}>[{MOCK_VACANCIES.screening.length}]</span>
            </div>
            <button type="button" className={storyStyles.colActionsBtn}>
              <MoreVertical size={14} />
            </button>
          </div>
          <div className={styles.columnCards}>
            {MOCK_VACANCIES.screening.map((v) => (
              <VacancyCard key={v.id} {...v} />
            ))}
          </div>
        </div>

        {/* Column 4: Оффер */}
        <div className={styles.kanbanColumn}>
          <div className={styles.columnHeader}>
            <div className={styles.columnTitleGroup}>
              <span className={styles.columnIndex}>[ 04 ]</span>
              <span className={cn(styles.columnDot, storyStyles.dotOffer)} />
              <span className={styles.columnName}>ОФФЕР</span>
              <span className={styles.columnBadge}>[{MOCK_VACANCIES.offer.length}]</span>
            </div>
            <button type="button" className={storyStyles.colActionsBtn}>
              <MoreVertical size={14} />
            </button>
          </div>
          <div className={styles.columnCards}>
            {MOCK_VACANCIES.offer.map((v) => (
              <VacancyCard key={v.id} {...v} />
            ))}
          </div>
        </div>

        {/* Add column slot */}
        <div className={styles.addColumn}>
          <button type="button" className={styles.addColumnBtn}>
            <Plus size={14} />
            <span>ДОБАВИТЬ КОЛОНКУ</span>
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const KanbanBoardWorkspace: Story = {
  render: () => <KanbanDashboardDemo />,
};
