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
import { Badge } from '../../atoms';
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
      <button
        type="button"
        className={styles.iconBtn}
        aria-label="Добавить технологию"
      >
        <Plus size={14} />
      </button>
    ),
  },
};

export const AiSummaryWithReanalyze: Story = {
  args: {
    title: 'AI Саммари вакансии',
    icon: Sparkles,
    iconTone: 'mint',
    accessory: (
      <button type="button" className={styles.textBtn}>
        <RefreshCw size={12} />
        <span>Переанализировать</span>
      </button>
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
      <button type="button" className={styles.textBtn}>
        <Edit3 size={12} />
        <span>Изменить</span>
      </button>
    ),
  },
};

export const NotesWithSaveAction: Story = {
  args: {
    title: 'Личные заметки',
    icon: StickyNote,
    iconTone: 'muted',
    accessory: (
      <button type="button" className={styles.textBtn}>
        <Check size={12} />
        <span>Сохранить</span>
      </button>
    ),
  },
};

export const AllVacancySectionHeaders: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <SectionHeader
        title="Технологический стек"
        accessory={
          <button type="button" className={styles.iconBtn} aria-label="Добавить">
            <Plus size={14} />
          </button>
        }
      />
      <SectionHeader
        title="Теги вакансии"
        accessory={
          <button type="button" className={styles.iconBtn} aria-label="Добавить">
            <Plus size={14} />
          </button>
        }
      />
      <SectionHeader
        title="AI Саммари"
        icon={Sparkles}
        iconTone="mint"
        accessory={
          <button type="button" className={styles.textBtn}>
            <RefreshCw size={12} />
            <span>Переанализировать</span>
          </button>
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
          <button type="button" className={styles.textBtn}>
            <Check size={12} />
            <span>Сохранить</span>
          </button>
        }
      />
    </div>
  ),
};
