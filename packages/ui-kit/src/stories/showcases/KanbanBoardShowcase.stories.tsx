import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Award, Banknote, Globe, MapPin, MoreVertical } from 'lucide-react';
import {
  Badge,
  Button,
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
  Table,
  TableBody,
  TableCell,
  TableCol,
  TableHeader,
  Text,
  TokenList,
} from '../../index';
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
              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
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
      <Table layout="columns" snapScroll fullHeight>
        <TableCol gridUnits={10}>
          <TableHeader
            index="[ 01 ]"
            indicatorColor="blue"
            title="НЕ СВЯЗЫВАЛИСЬ"
            badge="2"
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Действия">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          />
          <TableBody scrollable snapScroll padding="sm" gap="sm">
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
                    <Badge variant="solid" size="xs" tone="success" icon={<Icon icon={Award} size="2xs" />}>
                      88%
                    </Badge>
                    <Text variant="caption" tone="accent" startIcon={<Icon icon={Globe} size="xs" />}>
                      Удаленка
                    </Text>
                    <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
                      Paris, France
                    </Text>
                    <Text variant="mono" tone="success" startIcon={<Icon icon={Banknote} size="xs" />}>
                      €95k – €110k
                    </Text>
                  </div>
                  <Paragraph size="sm" tone="secondary">
                    Разработка компонентов платформы мониторинга на React и TypeScript.
                  </Paragraph>
                  <TokenList mode="readonly" size="xs" tokens={['React', 'TypeScript', 'WebGL']} />
                </CardBody>
                <CardFooter date="10 нояб." onMoveLeft={() => undefined} onMoveRight={() => undefined} onReject={() => undefined} />
              </Card>
            </TableCell>
          </TableBody>
        </TableCol>

        <TableCol gridUnits={10}>
          <TableHeader
            index="[ 02 ]"
            indicatorColor="emerald"
            title="ОТКЛИКНУЛСЯ"
            badge="1"
            actions={
              <Button variant="ghost" size="icon-sm" aria-label="Действия">
                <Icon icon={MoreVertical} size="sm" />
              </Button>
            }
          />
          <TableBody scrollable snapScroll padding="sm" gap="sm">
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
                    <Badge variant="solid" size="xs" tone="success" icon={<Icon icon={Award} size="2xs" />}>
                      96%
                    </Badge>
                    <Text variant="caption" tone="accent" startIcon={<Icon icon={Globe} size="xs" />}>
                      Удаленка
                    </Text>
                    <Text variant="mono" tone="success" startIcon={<Icon icon={Banknote} size="xs" />}>
                      $195k – $230k
                    </Text>
                  </div>
                  <TokenList mode="readonly" size="xs" tokens={['React 19', 'Design Systems', 'Storybook 10']} />
                </CardBody>
                <CardFooter date="11 нояб." onMoveLeft={() => undefined} onMoveRight={() => undefined} onReject={() => undefined} />
              </Card>
            </TableCell>
          </TableBody>
        </TableCol>
      </Table>
    </DashboardLayout>
  );
}

export const FullKanbanWorkspace: StoryObj = {
  render: () => <KanbanShowcaseBoard />,
};
