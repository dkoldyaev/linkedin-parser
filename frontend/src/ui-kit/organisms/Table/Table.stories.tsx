import type { Meta, StoryObj } from '@storybook/react-vite';
import { MoreVertical, Inbox } from 'lucide-react';
import { Table, TableCol, TableHeader, TableBody, TableCell, TableRow, TableFooter } from './Table';
import { Button, Badge, Text } from '../../atoms';
import styles from './TableStory.module.css';

const meta: Meta<typeof Table> = {
  title: 'Organisms/Table',
  component: Table,
  tags: ['autodocs'],
  argTypes: {
    layout: {
      control: 'radio',
      options: ['columns', 'rows'],
    },
    snapScroll: {
      control: 'boolean',
    },
    bordered: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Table>;

export const KanbanColumnsLayout: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <Table layout="columns" snapScroll>
        {/* Column 1 */}
        <TableCol gridUnits={10}>
          <TableHeader
            index="[ 01 ]"
            indicatorColor="blue"
            title="Не связывались"
            badge="[2]"
            actions={
              <button type="button" className={styles.colActionsBtn} aria-label="More actions">
                <MoreVertical size={14} />
              </button>
            }
          />
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <div className={styles.sampleCard}>
                <span className={styles.sampleCardTitle}>Senior Frontend Engineer</span>
                <span className={styles.sampleCardCompany}>Datadog • Paris</span>
              </div>
            </TableCell>
            <TableCell padding="none">
              <div className={styles.sampleCard}>
                <span className={styles.sampleCardTitle}>Full Stack Developer</span>
                <span className={styles.sampleCardCompany}>Supabase • Remote</span>
              </div>
            </TableCell>
          </TableBody>
        </TableCol>

        {/* Column 2 */}
        <TableCol gridUnits={10}>
          <TableHeader
            index="[ 02 ]"
            indicatorColor="cyan"
            title="Откликнулся"
            badge="[1]"
            actions={
              <button type="button" className={styles.colActionsBtn} aria-label="More actions">
                <MoreVertical size={14} />
              </button>
            }
          />
          <TableBody scrollable snapScroll padding="sm" gap="sm">
            <TableCell padding="none">
              <div className={styles.sampleCard}>
                <span className={styles.sampleCardTitle}>Staff UI Architect</span>
                <span className={styles.sampleCardCompany}>Stripe • Remote</span>
              </div>
            </TableCell>
          </TableBody>
        </TableCol>

        {/* Column 3 - Empty */}
        <TableCol gridUnits={10}>
          <TableHeader
            index="[ 03 ]"
            indicatorColor="amber"
            title="Скрининг"
            badge="[0]"
            actions={
              <button type="button" className={styles.colActionsBtn} aria-label="More actions">
                <MoreVertical size={14} />
              </button>
            }
          />
          <TableBody
            scrollable
            snapScroll
            padding="sm"
            emptyState={
              <div className={styles.emptyColContainer}>
                <Inbox size={20} />
                <Text as="span" variant="caption" tone="secondary">
                  Нет вакансий на этом этапе
                </Text>
              </div>
            }
          />
        </TableCol>
      </Table>
    </div>
  ),
};

export const FlexRowsLayout: Story = {
  render: () => (
    <div className={styles.storyWrapperRow}>
      <Table layout="rows" bordered>
        <TableHeader size="md">
          <div className={styles.cellId}>
            <Text as="span" variant="mono" tone="accent">
              ID
            </Text>
          </div>
          <div className={styles.cellTitle}>
            <Text as="span" variant="mono" tone="primary">
              VACANCY TITLE
            </Text>
          </div>
          <div className={styles.cellStatus}>
            <Text as="span" variant="mono" tone="secondary">
              STAGE
            </Text>
          </div>
        </TableHeader>
        <TableBody padding="none">
          <TableRow interactive>
            <TableCell className={styles.cellId}>VAC-101</TableCell>
            <TableCell className={styles.cellTitle}>Principal Design Systems Engineer</TableCell>
            <TableCell className={styles.cellStatus}>
              <Badge tone="info">Скрининг</Badge>
            </TableCell>
          </TableRow>
          <TableRow interactive>
            <TableCell className={styles.cellId}>VAC-102</TableCell>
            <TableCell className={styles.cellTitle}>Senior React Platform Engineer</TableCell>
            <TableCell className={styles.cellStatus}>
              <Badge tone="success">Оффер</Badge>
            </TableCell>
          </TableRow>
          <TableRow interactive>
            <TableCell className={styles.cellId}>VAC-103</TableCell>
            <TableCell className={styles.cellTitle}>Staff UI Engineer</TableCell>
            <TableCell className={styles.cellStatus}>
              <Badge tone="neutral">Не связывались</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
        <TableFooter justify="between">
          <Text as="span" variant="caption" tone="secondary">
            Showing 3 active vacancies
          </Text>
          <Button variant="ghost" size="sm">
            View All
          </Button>
        </TableFooter>
      </Table>
    </div>
  ),
};

export const CompoundDotNotation: Story = {
  render: () => (
    <div className={styles.storyWrapperSmall}>
      <Table.Col gridUnits={12}>
        <Table.Header
          index="[ 01 ]"
          indicatorColor="emerald"
          title="Compound Column"
          badge="[2]"
        />
        <Table.Body padding="sm" gap="sm">
          <Table.Cell padding="none">
            <div className={styles.sampleCard}>
              <span className={styles.sampleCardTitle}>Item via Table.Cell</span>
            </div>
          </Table.Cell>
        </Table.Body>
        <Table.Footer justify="center">
          <Button variant="ghost" size="sm">
            + Add Card
          </Button>
        </Table.Footer>
      </Table.Col>
    </div>
  ),
};
