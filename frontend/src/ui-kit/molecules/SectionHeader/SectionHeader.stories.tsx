import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Banknote,
  Check,
  Edit3,
  History,
  Plus,
  RefreshCw,
  Sparkles,
  StickyNote,
} from 'lucide-react';
import { SectionHeader } from './SectionHeader';
import { Badge, Button } from '../../atoms';
import styles from './SectionHeaderStory.module.css';

const meta: Meta<typeof SectionHeader> = {
  title: 'Molecules/SectionHeader',
  component: SectionHeader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SectionHeader>;

export const TechStackAddAccessory: Story = {
  args: {
    title: 'Технологический стек',
    accessory: (
      <Button
        size="icon"
        variant="secondary"
        aria-label="Добавить технологию"
        className={styles.iconBtn}
      >
        <Plus size={14} />
      </Button>
    ),
  },
};

export const AiSummaryWithReanalyze: Story = {
  args: {
    title: 'AI Саммари вакансии',
    icon: Sparkles,
    iconTone: 'mint',
    accessory: (
      <Button
        size="sm"
        variant="secondary"
        startIcon={<RefreshCw size={12} />}
        className={styles.textBtn}
      >
        Переанализировать
      </Button>
    ),
  },
};

export const HistoryWithCounter: Story = {
  args: {
    title: 'История переходов',
    icon: History,
    iconTone: 'accent',
    badge: (
      <Badge size="sm" tone="info">
        3 этапа
      </Badge>
    ),
  },
};

export const SalaryWithEditAction: Story = {
  args: {
    title: 'Зарплатная вилка',
    icon: Banknote,
    iconTone: 'mint',
    badge: (
      <Badge size="sm" tone="success">
        €95 000 – €110 000 / год
      </Badge>
    ),
    accessory: (
      <Button
        size="sm"
        variant="secondary"
        startIcon={<Edit3 size={12} />}
        className={styles.textBtnSm}
      >
        Изменить
      </Button>
    ),
  },
};

export const NotesWithSaveAction: Story = {
  args: {
    title: 'Личные заметки',
    icon: StickyNote,
    iconTone: 'muted',
    accessory: (
      <Button
        size="sm"
        variant="secondary"
        startIcon={<Check size={12} />}
        className={styles.textBtnSm}
      >
        Сохранить
      </Button>
    ),
  },
};

export const SemanticTonesAndDividers: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <SectionHeader
        title="СОВПАДЕНИЯ [3]"
        variant="mono"
        tone="mint"
        divider
      />
      <SectionHeader
        title="ПРОПУСКИ [2]"
        variant="mono"
        tone="warning"
        divider
      />
      <SectionHeader
        title="КРИТИЧЕСКИЕ РАСХОЖДЕНИЯ [1]"
        variant="mono"
        tone="danger"
        divider
      />
      <SectionHeader
        title="АКЦЕНТНЫЙ ЗАГОЛОВОК"
        variant="mono"
        tone="accent"
        divider
      />
      <SectionHeader
        title="ПРИГЛУШЕННЫЙ ЗАГОЛОВОК"
        variant="mono"
        tone="muted"
        divider
      />
    </div>
  ),
};

export const AllVacancySectionHeaders: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <SectionHeader
        title="Технологический стек"
        accessory={
          <Button
            size="icon"
            variant="secondary"
            aria-label="Добавить технологию"
            className={styles.iconBtn}
          >
            <Plus size={14} />
          </Button>
        }
      />
      <SectionHeader
        title="Теги вакансии"
        accessory={
          <Button
            size="icon"
            variant="secondary"
            aria-label="Добавить тег"
            className={styles.iconBtn}
          >
            <Plus size={14} />
          </Button>
        }
      />
      <SectionHeader
        title="AI Саммари"
        icon={Sparkles}
        iconTone="mint"
        accessory={
          <Button
            size="sm"
            variant="secondary"
            startIcon={<RefreshCw size={12} />}
            className={styles.textBtn}
          >
            Переанализировать
          </Button>
        }
      />
      <SectionHeader
        title="История переходов"
        icon={History}
        iconTone="accent"
        badge={<Badge size="sm" tone="info">4 этапа</Badge>}
      />
      <SectionHeader
        title="Личные заметки"
        icon={StickyNote}
        accessory={
          <Button
            size="sm"
            variant="secondary"
            startIcon={<Check size={12} />}
            className={styles.textBtnSm}
          >
            Сохранить
          </Button>
        }
      />
    </div>
  ),
};
