import { Badge, Button, Icon, Paragraph, Text } from '../../atoms';
import { Banknote, FileText, Sparkles, StickyNote } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section, SectionBody } from './Section';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { SectionHeader } from '../SectionHeader';

const meta: Meta<typeof Section> = {
  title: 'Molecules/Section',
  component: Section,
  subcomponents: {
    'Section.Header': SectionHeader as any,
    'Section.Body': SectionBody as any,
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: [undefined, 'none', 'xs', 'sm', 'md', 'lg'],
    },
    divider: {
      control: 'boolean',
    },
    bordered: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.container}>
      <Section>
        <Section.Header
          title="AI-САММАРИ ВАКАНСИИ"
          icon={<Icon icon={Sparkles} size="sm" tone="success" />}
          accessory={
            <Button variant="secondary" size="sm">
              ОБНОВИТЬ AI
            </Button>
          }
        />
        <Section.Body padding="md" gap="sm">
          <Paragraph size="sm">
            Компания разрабатывает распределенную облачную платформу реального времени.
          </Paragraph>
          <Paragraph size="sm" tone="secondary">
            О компании: Международный технологический лидер в авиационном секторе.
          </Paragraph>
        </Section.Body>
      </Section>
    </div>
  ),
};

export const StackedSections: Story = {
  render: () => (
    <div className={layoutStyles.container}>
      <Section>
        <SectionHeader
          title="ЗАРПЛАТА"
          icon={<Icon icon={Banknote} size="sm" tone="success" />}
          accessory={
            <Button variant="secondary" size="sm">
              РЕДАКТИРОВАТЬ
            </Button>
          }
        />
        <SectionBody padding="sm">
          <Text variant="mono" tone="success" weight="bold">
            $120,000 – $140,000 / year
          </Text>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader
          title="ЗАМЕТКИ"
          icon={<Icon icon={StickyNote} size="sm" tone="muted" />}
          accessory={
            <Badge variant="outline" size="xs">
              Черновик
            </Badge>
          }
        />
        <SectionBody padding="sm">
          <Text variant="caption" tone="muted">
            Повторный звонок с лидом назначен на четверг в 14:00 GMT.
          </Text>
        </SectionBody>
      </Section>

      <Section divider={false}>
        <SectionHeader title="ДОКУМЕНТЫ" icon={<Icon icon={FileText} size="sm" />} />
        <SectionBody padding="sm">
          <Text variant="caption" tone="secondary">
            Прикреплено 2 файла резюме и портфолио.
          </Text>
        </SectionBody>
      </Section>
    </div>
  ),
};

export const CustomPaddingPresets: Story = {
  render: () => (
    <div className={layoutStyles.container}>
      <Section bordered>
        <Section.Header title="SectionBody paddingX='lg' paddingY='xs'" />
        <Section.Body paddingX="lg" paddingY="xs">
          <Text variant="caption" tone="muted">
            Широкие боковые отступы (24px) и компактные вертикальные (4px).
          </Text>
        </Section.Body>
      </Section>

      <Section padding="md" bordered>
        <Text variant="body-sm" tone="primary">
          Секция без подкомпонентов с прямым padding="md" на самом контейнере Section.
        </Text>
      </Section>
    </div>
  ),
};
