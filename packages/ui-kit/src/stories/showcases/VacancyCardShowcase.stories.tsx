import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Award,
  Ban,
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe,
  History,
  Home,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Icon,
  Paragraph,
  StatusDot,
  Text,
  TokenList,
} from '../../index';
import layoutStyles from '../StoryLayout.module.css';
import showcaseStyles from './Showcase.module.css';

interface VacancyShowcaseProps {
  readonly title: string;
  readonly company: string;
  readonly sourceUrl?: string;
  readonly matchScore?: number;
  readonly workplace?: 'remote' | 'hybrid' | 'onsite';
  readonly location?: string;
  readonly salary?: string;
  readonly summary?: string;
  readonly aiPending?: boolean;
  readonly techStack?: readonly string[];
  readonly tags?: readonly string[];
  readonly date?: string;
  readonly historyCount?: number;
  readonly hasHistoryComment?: boolean;
  readonly isClosed?: boolean;
  readonly stageLabel?: string;
  readonly selected?: boolean;
}

function ComposedVacancyCard({
  title,
  company,
  sourceUrl,
  matchScore,
  workplace = 'remote',
  location,
  salary,
  summary,
  aiPending = false,
  techStack = [],
  tags = [],
  date,
  historyCount,
  hasHistoryComment = false,
  isClosed = false,
  stageLabel,
  selected = false,
}: VacancyShowcaseProps): React.ReactElement {
  const scoreTone =
    matchScore === undefined
      ? 'neutral'
      : matchScore >= 75
        ? 'success'
        : matchScore >= 50
          ? 'warning'
          : 'danger';

  const workplaceIcon =
    workplace === 'remote' ? Globe : workplace === 'hybrid' ? Home : Building2;
  const workplaceTone =
    workplace === 'remote'
      ? 'accent'
      : workplace === 'hybrid'
        ? 'warning'
        : 'secondary';
  const workplaceLabel =
    workplace === 'remote'
      ? 'Удаленка'
      : workplace === 'hybrid'
        ? 'Гибрид'
        : 'Офис';

  return (
    <Card matchScore={matchScore} selected={selected} interactive>
      <CardBody>
        <CardHeader
          overline={company}
          overlineHref={sourceUrl}
          title={title}
          selectable
          checked={selected}
          statusIndicators={
            (stageLabel !== undefined || isClosed) ? (
              <>
                {stageLabel !== undefined && (
                  <Badge variant="outline" size="xs" tone="info">
                    {stageLabel}
                  </Badge>
                )}
                {isClosed && (
                  <Badge
                    variant="solid"
                    size="xs"
                    tone="danger"
                    icon={<Icon icon={Ban} size="2xs" />}
                  >
                    Закрыта
                  </Badge>
                )}
              </>
            ) : undefined
          }
        />

        <div className={showcaseStyles.metaRow}>
          {matchScore !== undefined && (
            <Badge
              variant="solid"
              size="xs"
              tone={scoreTone}
              icon={<Icon icon={Award} size="2xs" />}
            >
              {matchScore}%
            </Badge>
          )}
          <Text
            variant="caption"
            tone={workplaceTone}
            startIcon={<Icon icon={workplaceIcon} size="xs" />}
          >
            {workplaceLabel}
          </Text>
          {location !== undefined && (
            <Text
              variant="caption"
              tone="secondary"
              startIcon={<Icon icon={MapPin} size="xs" />}
            >
              {location}
            </Text>
          )}
          {salary !== undefined && (
            <Text
              variant="mono"
              tone="success"
              startIcon={<Icon icon={Banknote} size="xs" />}
            >
              {salary}
            </Text>
          )}
        </div>

        {summary !== undefined ? (
          <Paragraph size="sm" tone="secondary">
            {summary}
          </Paragraph>
        ) : aiPending ? (
          <Text
            variant="caption"
            tone="muted"
            startIcon={<Icon icon={Sparkles} size="xs" />}
          >
            Ожидание AI-анализа...
          </Text>
        ) : null}

        {techStack.length > 0 && (
          <TokenList>
            {techStack.slice(0, 4).map((tech) => (
              <Badge key={tech} size="xs" variant="chip">
                {tech}
              </Badge>
            ))}
          </TokenList>
        )}

        {tags.length > 0 && (
          <TokenList>
            {tags.map((tag) => (
              <Badge key={tag} size="xs" variant="chip" tone="neutral">
                #{tag}
              </Badge>
            ))}
          </TokenList>
        )}
      </CardBody>

      <CardFooter
        metaSlot={
          <div className={layoutStyles.row}>
            {date !== undefined && (
              <Text variant="caption" tone="muted">
                {date}
              </Text>
            )}
            {historyCount !== undefined && historyCount > 0 && (
              <Text
                variant="caption"
                tone="muted"
                startIcon={<Icon icon={History} size="2xs" />}
                endIcon={
                  hasHistoryComment ? (
                    <StatusDot tone="info" size="xs" />
                  ) : undefined
                }
              >
                {historyCount}
              </Text>
            )}
          </div>
        }
        actionsSlot={
          <ButtonGroup>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => undefined}
              aria-label="Move previous"
            >
              <Icon icon={ChevronLeft} size="sm" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              tone="danger"
              onClick={() => undefined}
              aria-label="Dismiss card"
            >
              <Icon icon={X} size="sm" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => undefined}
              aria-label="Move next"
            >
              <Icon icon={ChevronRight} size="sm" />
            </Button>
          </ButtonGroup>
        }
      />
    </Card>
  );
}

const meta: Meta<typeof ComposedVacancyCard> = {
  title: 'Showcases (Job Tracker)/Vacancy Card Showcase',
  component: ComposedVacancyCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComposedVacancyCard>;

export const AllVacancyCardStates: Story = {
  render: () => (
    <div className={layoutStyles.grid3}>
      <ComposedVacancyCard
        title="Staff Frontend Architect — UI Platform"
        company="Stripe"
        sourceUrl="https://linkedin.com/jobs/view/10"
        matchScore={92}
        workplace="remote"
        location="Remote (EU)"
        salary="USD 16 000 / мес"
        summary="Развитие корпоративной дизайн-системы и компонентной библиотеки на React 19 и TypeScript."
        techStack={['React 19', 'TypeScript', 'Design Systems', 'Storybook 10', 'Playwright']}
        tags={['priority', 'dream-job']}
        date="11 нояб."
        historyCount={3}
        hasHistoryComment
      />

      <ComposedVacancyCard
        title="Senior Fullstack Developer (Node.js + React)"
        company="Revolut"
        sourceUrl="https://linkedin.com/jobs/view/22"
        matchScore={68}
        workplace="hybrid"
        location="London / Remote"
        salary="GBP 8 500 / мес"
        summary="Разработка платёжных шлюзов и клиентских интерфейсов для международного банкинга."
        techStack={['Node.js', 'TypeScript', 'React', 'PostgreSQL']}
        isClosed
        stageLabel="Applied"
        date="1 нояб."
        historyCount={4}
      />

      <ComposedVacancyCard
        title="Lead UI Engineer — Design Tooling"
        company="Figma"
        sourceUrl="https://linkedin.com/jobs/view/23"
        workplace="onsite"
        location="San Francisco"
        aiPending
        techStack={['TypeScript', 'React', 'WebAssembly']}
        date="Только что"
      />
    </div>
  ),
};
