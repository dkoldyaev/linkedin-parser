import type { Meta, StoryObj } from '@storybook/react-vite';
import { Copy, FileText, Info } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import styles from './CollapsibleSectionStory.module.css';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Molecules/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const DefaultCollapsed: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="Оригинальный текст вакансии"
        icon={FileText}
      >
        <textarea
          className={styles.textarea}
          defaultValue={`We are looking for a Senior Frontend Engineer to lead the design and implementation of our next-generation UI architecture.
Key Responsibilities:
- Build high-performance React 19 apps with Vite and Bun.
- Collaborate with design systems and backend engineers.
- Maintain 100% test coverage and strict type safety.`}
        />
      </CollapsibleSection>
    </div>
  ),
};

export const WithAccessoryAction: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="Оригинальный текст вакансии"
        icon={FileText}
        accessory={
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => alert('Скопировано в буфер')}
          >
            <Copy size={12} />
            <span>Копировать</span>
          </button>
        }
      >
        <textarea
          className={styles.textarea}
          defaultValue={`We are looking for a Senior Frontend Engineer to lead the design and implementation of our next-generation UI architecture.
Key Responsibilities:
- Build high-performance React 19 apps with Vite and Bun.
- Collaborate with design systems and backend engineers.
- Maintain 100% test coverage and strict type safety.`}
        />
      </CollapsibleSection>
    </div>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="Системная диагностика"
        icon={Info}
        defaultOpen
        expandLabel="Подробнее"
        collapseLabel="Скрыть"
      >
        <p className={styles.infoText}>
          Проиндексировано 48 параметров вакансии. Время экстракции: 124ms. Очередь фонового скоринга активна.
        </p>
      </CollapsibleSection>
    </div>
  ),
};
