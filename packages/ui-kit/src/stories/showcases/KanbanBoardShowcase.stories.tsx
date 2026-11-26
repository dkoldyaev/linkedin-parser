import {
  Award,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Globe,
  MapPin,
  MoreVertical,
  Plus,
  RotateCcw,
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
  DashboardLayout,
  FilterBar,
  Header,
  Icon,
  Paragraph,
  SearchBar,
  StatusDot,
  Table,
  TableBody,
  TableCell,
  TableCol,
  TableHeader,
  Text,
  TokenList,
} from '../../index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import showcaseStyles from './Showcase.module.css';

const meta: Meta = {
  title: 'Showcases (Job Tracker)/Kanban Board Showcase',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

function KanbanShowcaseBoard(): React.ReactElement {
  const [search, setSearch] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['priority']);

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
          primaryActionLabel="ДОБАВИТЬ ВАКАНСИИ"
          onPrimaryAction={() => undefined}
          onRefresh={() => undefined}
          showThemeToggle
          user={{ name: 'Denis Koldyaev', email: 'denis@example.com' }}
        />
      }
      filterBar={
        <FilterBar
          selects={[
            {
              id: 'workplace',
              value: workplace,
              onChange: setWorkplace,
              options: [
                { value: '', label: 'Все форматы' },
                { value: 'remote', label: 'Удаленка' },
                { value: 'hybrid', label: 'Гибрид' },
              ],
            },
          ]}
          tags={[
            { label: 'priority', count: 4 },
            { label: 'remote-eu', count: 9 },
            { label: 'typescript', count: 14 },
          ]}
          selectedTags={selectedTags}
          onToggleTag={(tag) =>
            setSelectedTags((prev) =>
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
            )
          }
          onReset={() => {
            setWorkplace('');
            setSelectedTags([]);
          }}
          resetLabel="Сбросить"
        />
      }
    >
      <Table layout="columns" bordered quantizeColumns snapScroll fullHeight>
        <TableCol>
          <TableHeader
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Действия">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          >
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 01 ]
            </Text>
            <StatusDot palette="blue" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              НЕ СВЯЗЫВАЛИСЬ
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              2
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="none" gap="none">
            <TableCell padding="none">
              <Card matchScore={88} interactive>
                <CardBody>
                  <CardHeader
                    overline="Datadog"
                    overlineHref="https://linkedin.com/jobs/view/101"
                    title="Senior Frontend Engineer (React / TypeScript)"
                    selectable
                  />
                  <div className={showcaseStyles.metaRow}>
                    <Badge
                      variant="solid"
                      size="xs"
                      tone="success"
                      icon={<Icon icon={Award} size="2xs" />}
                    >
                      88%
                    </Badge>
                    <Text
                      variant="caption"
                      tone="accent"
                      startIcon={<Icon icon={Globe} size="xs" />}
                    >
                      Удаленка
                    </Text>
                    <Text
                      variant="caption"
                      tone="secondary"
                      startIcon={<Icon icon={MapPin} size="xs" />}
                    >
                      Paris, France
                    </Text>
                    <Text
                      variant="mono"
                      tone="success"
                      startIcon={<Icon icon={Banknote} size="xs" />}
                    >
                      €95k – €110k
                    </Text>
                  </div>
                  <Paragraph size="sm" tone="secondary">
                    Разработка компонентов платформы мониторинга на React и TypeScript.
                  </Paragraph>
                  <TokenList>
                    {['React', 'TypeScript', 'WebGL'].map((t) => (
                      <Badge key={t} size="xs" variant="chip">
                        {t}
                      </Badge>
                    ))}
                  </TokenList>
                </CardBody>
                <CardFooter
                  metaSlot={
                    <Text variant="caption" tone="muted">
                      10 нояб.
                    </Text>
                  }
                  actionsSlot={
                    <ButtonGroup>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => undefined}
                        aria-label="Переместить влево"
                      >
                        <Icon icon={ChevronLeft} size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        tone="danger"
                        onClick={() => undefined}
                        aria-label="Отклонить"
                      >
                        <Icon icon={X} size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => undefined}
                        aria-label="Переместить вправо"
                      >
                        <Icon icon={ChevronRight} size="sm" />
                      </Button>
                    </ButtonGroup>
                  }
                />
              </Card>
            </TableCell>
          </TableBody>
        </TableCol>

        <TableCol>
          <TableHeader
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Действия">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          >
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 02 ]
            </Text>
            <StatusDot palette="emerald" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              ОТКЛИКНУЛСЯ
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              1
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="none" gap="none">
            <TableCell padding="none">
              <Card matchScore={96} interactive>
                <CardBody>
                  <CardHeader
                    overline="Stripe"
                    overlineHref="https://linkedin.com/jobs/view/104"
                    title="Staff Frontend Architect — Design Systems"
                    selectable
                  />
                  <div className={showcaseStyles.metaRow}>
                    <Badge
                      variant="solid"
                      size="xs"
                      tone="success"
                      icon={<Icon icon={Award} size="2xs" />}
                    >
                      96%
                    </Badge>
                    <Text
                      variant="caption"
                      tone="accent"
                      startIcon={<Icon icon={Globe} size="xs" />}
                    >
                      Удаленка
                    </Text>
                    <Text
                      variant="mono"
                      tone="success"
                      startIcon={<Icon icon={Banknote} size="xs" />}
                    >
                      $195k – $230k
                    </Text>
                  </div>
                  <TokenList>
                    {['React 19', 'Design Systems', 'Storybook 10'].map((t) => (
                      <Badge key={t} size="xs" variant="chip">
                        {t}
                      </Badge>
                    ))}
                  </TokenList>
                </CardBody>
                <CardFooter
                  metaSlot={
                    <Text variant="caption" tone="muted">
                      11 нояб.
                    </Text>
                  }
                  actionsSlot={
                    <ButtonGroup>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => undefined}
                        aria-label="Переместить влево"
                      >
                        <Icon icon={ChevronLeft} size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        tone="danger"
                        onClick={() => undefined}
                        aria-label="Отклонить"
                      >
                        <Icon icon={X} size="sm" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => undefined}
                        aria-label="Переместить вправо"
                      >
                        <Icon icon={ChevronRight} size="sm" />
                      </Button>
                    </ButtonGroup>
                  }
                />
              </Card>
            </TableCell>
          </TableBody>
        </TableCol>

        <TableCol>
          <TableHeader
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Действия">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          >
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 03 ]
            </Text>
            <StatusDot tone="danger" size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              ОТКАЗ (REJECTED)
            </Text>
            <Badge variant="counter" size="xs" tone="neutral">
              1
            </Badge>
          </TableHeader>
          <TableBody scrollable snapScroll padding="none" gap="none">
            <TableCell padding="none">
              <Card matchScore={42} interactive>
                <CardBody>
                  <CardHeader
                    overline="Meta"
                    overlineHref="https://linkedin.com/jobs/view/109"
                    title="Software Engineer — Infra Tooling"
                    selectable
                  />
                  <div className={showcaseStyles.metaRow}>
                    <Badge
                      variant="solid"
                      size="xs"
                      tone="danger"
                      icon={<Icon icon={Award} size="2xs" />}
                    >
                      42%
                    </Badge>
                    <Text
                      variant="caption"
                      tone="secondary"
                      startIcon={<Icon icon={MapPin} size="xs" />}
                    >
                      London, UK
                    </Text>
                  </div>
                  <TokenList>
                    {['C++', 'Rust', 'Linux'].map((t) => (
                      <Badge key={t} size="xs" variant="chip">
                        {t}
                      </Badge>
                    ))}
                  </TokenList>
                </CardBody>
                <CardFooter
                  metaSlot={
                    <Text variant="caption" tone="muted">
                      5 нояб.
                    </Text>
                  }
                  actionsSlot={
                    <Button
                      variant="ghost"
                      size="sm"
                      tone="accent"
                      onClick={() => undefined}
                      startIcon={<Icon icon={RotateCcw} size="xs" />}
                    >
                      Восстановить
                    </Button>
                  }
                />
              </Card>
            </TableCell>
          </TableBody>
        </TableCol>

        {/* Add Column Rail */}
        <div data-fixed-rail className={showcaseStyles.addColumnCol}>
          <button
            type="button"
            className={showcaseStyles.addColumnBtn}
            onClick={() => undefined}
            aria-label="Добавить колонку"
          >
            <span className={showcaseStyles.addColumnText}>
              <Icon icon={Plus} size="xs" />
              <Text variant="mono">ДОБАВИТЬ КОЛОНКУ</Text>
            </span>
          </button>
        </div>
      </Table>
    </DashboardLayout>
  );
}

export const FullKanbanWorkspace: StoryObj = {
  render: () => <KanbanShowcaseBoard />,
};
