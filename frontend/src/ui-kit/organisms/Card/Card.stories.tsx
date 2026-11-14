import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Award, Ban, Tag } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  VacancyCard,
  type VacancyCardProps,
} from './Card';
import {
  Badge,
  LocationText,
  SalaryText,
  WorkplaceText,
} from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const REAL_CARD_DEFAULT_ARGS: VacancyCardProps = {
  title: 'Software Engineer — API Integrations & CRM Development',
  company: 'Unknown',
  sourceUrl: 'https://www.linkedin.com/jobs/view/4000000000',
  matchScore: 65,
  workplace: 'remote',
  location: 'Worldwide',
  salary: 'USD11 200 / мес',
  summary:
    'Вакансия Software Engineer — API Integrations & CRM Development в Unknown (Worldwide). Ключевой стек: Javascript, Typescript, Php, Swift, Rest Api, Graphql.',
  aiPending: false,
  techStack: ['Javascript', 'Typescript', 'Php', 'Swift'],
  maxVisibleTech: 4,
  tags: [],
  date: '6 нояб.',
  historyCount: 2,
  hasHistoryComment: false,
  selectable: true,
  selected: false,
  isClosed: false,
  isRejected: false,
  stageBadgeLabel: undefined,
  stageBadgeTone: 'backlog',
  canMoveLeft: true,
  canMoveRight: true,
};

const meta: Meta<typeof VacancyCard> = {
  title: 'Organisms/Card',
  component: VacancyCard,
  subcomponents: {
    Card: Card as React.ComponentType<unknown>,
    CardHeader: CardHeader as React.ComponentType<unknown>,
    CardBody: CardBody as React.ComponentType<unknown>,
    CardFooter: CardFooter as React.ComponentType<unknown>,
  },
  tags: ['autodocs'],
  args: REAL_CARD_DEFAULT_ARGS,
  argTypes: {
    title: {
      control: 'text',
      description: 'Название вакансии (до 2 строк с обрезкой)',
    },
    company: {
      control: 'text',
      description: 'Название компании в верхнем колонтитуле',
    },
    sourceUrl: {
      control: 'text',
      description: 'Ссылка на оригинал вакансии (LinkedIn)',
    },
    matchScore: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'AI Match Score (≥75% high green, ≥50% medium amber, <50% low red)',
    },
    workplace: {
      control: 'inline-radio',
      options: ['remote', 'hybrid', 'onsite'],
      description: 'Формат работы (Удаленка / Гибрид / Офис)',
    },
    location: {
      control: 'text',
      description: 'Локация вакансии с иконкой MapPin',
    },
    salary: {
      control: 'text',
      description: 'Зарплатная вилка с иконкой Banknote',
    },
    summary: {
      control: 'text',
      description: 'Краткое AI-резюме вакансии (до 3 строк)',
    },
    aiPending: {
      control: 'boolean',
      description: 'Показать индикатор ожидания AI-анализа (если summary пустой)',
    },
    techStack: {
      control: 'object',
      description: 'Массив технологий (TechChip)',
    },
    maxVisibleTech: {
      control: { type: 'number', min: 1, max: 10, step: 1 },
      description: 'Сколько технологий показывать до +N',
    },
    tags: {
      control: 'object',
      description: 'Пользовательские теги (TagChip)',
    },
    date: {
      control: 'text',
      description: 'Дата добавления в подвале карточки',
    },
    historyCount: {
      control: { type: 'number', min: 0, max: 50, step: 1 },
      description: 'Количество перемещений по этапам',
    },
    hasHistoryComment: {
      control: 'boolean',
      description: 'Синяя точка наличия комментария в истории',
    },
    selectable: {
      control: 'boolean',
      description: 'Показывать чекбокс выбора карточки',
    },
    selected: {
      control: 'boolean',
      description: 'Выбрана ли карточка',
    },
    isClosed: {
      control: 'boolean',
      description: 'Показывать бейдж «Закрыта» в правом верхнем углу',
    },
    isRejected: {
      control: 'boolean',
      description: 'Горизонтальный режим отклонённой карточки',
    },
    stageBadgeLabel: {
      control: 'text',
      description: 'Текст углового бейджа этапа (64×33px)',
    },
    stageBadgeTone: {
      control: 'select',
      options: ['backlog', 'applied', 'interview', 'assessment', 'offer', 'rejected'],
      description: 'Цветовой тон углового бейджа этапа',
    },
    canMoveLeft: {
      control: 'boolean',
      description: 'Активна ли кнопка < в подвале',
    },
    canMoveRight: {
      control: 'boolean',
      description: 'Активна ли кнопка > в подвале',
    },
  },
};

export default meta;
type Story = StoryObj<typeof VacancyCard>;

function EditableVacancyCardRender(args: VacancyCardProps): React.ReactElement {
  const [selected, setSelected] = useState(Boolean(args.selected));

  useEffect(() => {
    setSelected(Boolean(args.selected));
  }, [args.selected]);

  return (
    <div className={layoutStyles.narrowBox} data-testid="storybook-vacancy-card-wrapper">
      <VacancyCard
        {...args}
        selected={selected}
        onSelectedChange={setSelected}
        onMoveLeft={() => undefined}
        onMoveRight={() => undefined}
        onReject={() => undefined}
        onRestore={() => undefined}
      />
    </div>
  );
}

export const VacancyKanbanCard: Story = {
  name: 'Vacancy Kanban Card (Editable via Controls)',
  args: REAL_CARD_DEFAULT_ARGS,
  render: (args) => <EditableVacancyCardRender {...args} />,
};

export const CardHeaderSubcomponent: Story = {
  name: 'CardHeader (Шапка карточки — редактируемая)',
  args: {
    ...REAL_CARD_DEFAULT_ARGS,
    stageBadgeLabel: '',
  },
  render: (args) => {
    const statusNode =
      (args.stageBadgeLabel !== undefined && args.stageBadgeLabel !== '') ||
      Boolean(args.isClosed) ? (
        <>
          {args.stageBadgeLabel !== undefined && args.stageBadgeLabel !== '' && (
            <Badge variant="stage" tone={args.stageBadgeTone}>
              {args.stageBadgeLabel}
            </Badge>
          )}
          {Boolean(args.isClosed) && (
            <Badge variant="stage" tone="rejected" icon={<Ban size={11} aria-hidden="true" />}>
              Закрыта
            </Badge>
          )}
        </>
      ) : undefined;

    return (
      <div className={layoutStyles.narrowBox}>
        <div className={layoutStyles.stack}>
          <Card matchScore={args.matchScore} selected={args.selected}>
            <CardBody snapToGrid={false}>
              <CardHeader
                company={args.company}
                companyHref={args.sourceUrl}
                title={args.title}
                selectable={args.selectable}
                checked={args.selected}
                statusIndicators={statusNode}
              />
            </CardBody>
          </Card>

          <Card matchScore={88} selected>
            <CardBody snapToGrid={false}>
              <CardHeader
                company="Stripe"
                companyHref="https://linkedin.com/jobs/view/2"
                title="Staff Frontend Architect (Design Systems)"
                selectable
                checked
                statusIndicators={
                  <Badge variant="stage" tone="interview">Interview</Badge>
                }
              />
            </CardBody>
          </Card>

          <Card matchScore={42}>
            <CardBody snapToGrid={false}>
              <CardHeader
                company="Linear"
                companyHref="https://linkedin.com/jobs/view/3"
                title="Senior Product Engineer"
                selectable
                checked={false}
                statusIndicators={
                  <Badge variant="stage" tone="rejected" icon={<Ban size={11} aria-hidden="true" />}>
                    Закрыта
                  </Badge>
                }
              />
            </CardBody>
          </Card>
        </div>
      </div>
    );
  },
};

export const CardFooterSubcomponent: Story = {
  name: 'CardFooter (Подвал карточки — редактируемый)',
  args: REAL_CARD_DEFAULT_ARGS,
  render: (args) => (
    <div className={layoutStyles.narrowBox}>
      <div className={layoutStyles.stack}>
        <Card matchScore={args.matchScore}>
          <CardFooter
            date={args.date}
            historyCount={args.historyCount}
            hasHistoryComment={args.hasHistoryComment}
            isRejected={args.isRejected}
            canMoveLeft={args.canMoveLeft}
            canMoveRight={args.canMoveRight}
            onMoveLeft={() => undefined}
            onMoveRight={() => undefined}
            onReject={() => undefined}
            onRestore={() => undefined}
          />
        </Card>

        <Card matchScore={91}>
          <CardFooter
            date="10 нояб."
            historyCount={4}
            hasHistoryComment
            historyTitle="Перемещений: 4 (есть заметки)"
            canMoveLeft={false}
            canMoveRight
            onMoveLeft={() => undefined}
            onMoveRight={() => undefined}
            onReject={() => undefined}
          />
        </Card>

        <Card matchScore={35}>
          <CardFooter
            date="1 нояб."
            historyCount={1}
            isRejected
            onRestore={() => undefined}
            restoreLabel="Восстановить"
          />
        </Card>
      </div>
    </div>
  ),
};

export const ComposableCardParts: Story = {
  name: 'Composable Card (Card + CardBody + CardHeader + CardFooter)',
  args: REAL_CARD_DEFAULT_ARGS,
  render: (args) => (
    <div className={layoutStyles.narrowBox}>
      <Card matchScore={args.matchScore} selected={args.selected} interactive>
        <CardBody>
          <CardHeader
            company={args.company}
            companyHref={args.sourceUrl}
            title={args.title}
            selectable={args.selectable}
            checked={args.selected}
          />
          <div className={layoutStyles.row}>
            {args.matchScore !== undefined && (
              <Badge
                variant="match"
                tone={args.matchScore >= 75 ? 'high' : args.matchScore >= 50 ? 'medium' : 'low'}
                icon={<Award size={11} aria-hidden="true" />}
              >
                {args.matchScore}%
              </Badge>
            )}
            {args.workplace !== undefined && (
              <WorkplaceText workplace={args.workplace} />
            )}
            {args.location !== undefined && (
              <LocationText>{args.location}</LocationText>
            )}
            {args.salary !== undefined && <SalaryText>{args.salary}</SalaryText>}
          </div>
          {args.techStack !== undefined && args.techStack.length > 0 && (
            <div className={layoutStyles.row}>
              {args.techStack.map((tech) => (
                <Badge key={tech} variant="ghost" size="xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}
          {args.tags !== undefined && args.tags.length > 0 && (
            <div className={layoutStyles.row}>
              {args.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="ghost"
                  size="xs"
                  tone="primary"
                  icon={<Tag size={10} aria-hidden="true" />}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </CardBody>
        <CardFooter
          date={args.date}
          historyCount={args.historyCount}
          hasHistoryComment={args.hasHistoryComment}
          canMoveLeft={args.canMoveLeft}
          canMoveRight={args.canMoveRight}
        />
      </Card>
    </div>
  ),
};

export const MatchScoreTiersComparison: Story = {
  name: 'Match Score Tiers (High ≥75% / Medium ≥50% / Low <50%)',
  render: () => (
    <div className={layoutStyles.grid3}>
      <VacancyCard
        title="Staff Frontend Architect — UI Platform"
        company="Stripe"
        sourceUrl="https://linkedin.com/jobs/view/10"
        matchScore={92}
        workplace="remote"
        location="Remote (EU)"
        salary="USD16 000 / мес"
        summary="Развитие корпоративной дизайн-системы и компонентной библиотеки на React 19 и TypeScript. Полное покрытие Storybook и визуальными регрессионными тестами."
        techStack={['React', 'Typescript', 'Design Systems', 'Storybook', 'Playwright']}
        tags={['priority', 'dream-job']}
        date="11 нояб."
        historyCount={3}
        hasHistoryComment
        canMoveLeft={false}
        canMoveRight
      />

      <VacancyCard {...REAL_CARD_DEFAULT_ARGS} />

      <VacancyCard
        title="Embedded C++ Firmware Engineer"
        company="Siemens"
        sourceUrl="https://linkedin.com/jobs/view/12"
        matchScore={34}
        workplace="onsite"
        location="Munich, Germany"
        salary="EUR6 800 / мес"
        summary="Разработка низкоуровневого ПО для промышленных контроллеров реального времени. Требуется опыт работы с RTOS, C++20 и CAN-шиной."
        techStack={['C++', 'RTOS', 'Embedded', 'CMake']}
        date="2 нояб."
        historyCount={1}
        canMoveLeft
        canMoveRight={false}
      />
    </div>
  ),
};

export const SelectedClosedAndAiPending: Story = {
  name: 'Card States (Selected / Closed / AI Pending)',
  render: () => (
    <div className={layoutStyles.grid3}>
      <VacancyCard
        title="Principal Frontend Engineer"
        company="Datadog"
        sourceUrl="https://linkedin.com/jobs/view/21"
        matchScore={88}
        workplace="hybrid"
        location="Paris / Remote"
        salary="EUR10 500 / мес"
        summary="Лидирование фронтенд-архитектуры высоконагруженных дашбордов наблюдаемости и визуализации метрик реального времени."
        techStack={['Typescript', 'React', 'WebGL', 'D3']}
        selected
        date="9 нояб."
        historyCount={2}
      />

      <VacancyCard
        title="Senior Fullstack Developer (Node.js + React)"
        company="Revolut"
        sourceUrl="https://linkedin.com/jobs/view/22"
        matchScore={71}
        workplace="remote"
        location="London / Remote"
        salary="GBP8 500 / мес"
        summary="Разработка платёжных шлюзов и клиентских интерфейсов для международного банкинга."
        techStack={['Node.js', 'Typescript', 'React', 'PostgreSQL']}
        isClosed
        stageBadgeLabel="Applied"
        stageBadgeTone="applied"
        date="1 нояб."
        historyCount={4}
        hasHistoryComment
      />

      <VacancyCard
        title="Lead UI Engineer — Design Tooling"
        company="Figma"
        sourceUrl="https://linkedin.com/jobs/view/23"
        workplace="remote"
        location="Worldwide"
        aiPending
        techStack={['Typescript', 'React', 'WebAssembly']}
        date="Только что"
      />
    </div>
  ),
};
