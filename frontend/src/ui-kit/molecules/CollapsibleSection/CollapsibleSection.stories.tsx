import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Info, Settings, SlidersHorizontal } from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';
import { Badge, Button } from '../../atoms';
import styles from './CollapsibleSectionStory.module.css';

const meta: Meta<typeof CollapsibleSection> = {
  title: 'Molecules/CollapsibleSection',
  component: CollapsibleSection,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CollapsibleSection>;

export const Default: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="Системная диагностика"
        icon={Info}
      >
        <p className={styles.infoText}>
          Служба фоновой обработки активна. Метрики производительности обновляются в реальном времени.
        </p>
      </CollapsibleSection>
    </div>
  ),
};

export const WithBadgeAccessory: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="Аналитический отчет"
        icon={FileText}
        accessory={<Badge size="sm" tone="success">Готово</Badge>}
      >
        <p className={styles.infoText}>
          Полный анализ вакансии успешно сформирован и сохранён в локальной базе данных.
        </p>
      </CollapsibleSection>
    </div>
  ),
};

export const WithButtonAccessory: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="Параметры интеграции"
        icon={SlidersHorizontal}
        accessory={
          <Button
            size="icon"
            variant="secondary"
            aria-label="Настройки"
          >
            <Settings size={14} />
          </Button>
        }
      >
        <p className={styles.infoText}>
          Настройки синхронизации и сетевые таймауты сконфигурированы.
        </p>
      </CollapsibleSection>
    </div>
  ),
};

export const DefaultOpen: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <CollapsibleSection
        title="История активности"
        defaultOpen
        expandLabel="Подробнее"
        collapseLabel="Скрыть"
      >
        <p className={styles.infoText}>
          Раздел развернут по умолчанию. Здесь отображаются последние зафиксированные события сессии.
        </p>
      </CollapsibleSection>
    </div>
  ),
};
