import type { Meta, StoryObj } from '@storybook/react-vite';
import { StageStepper, type StageStepItem } from './StageStepper';
import { StageStep } from './StageStep';
import styles from './StageStepperStory.module.css';

const meta: Meta<typeof StageStepper> = {
  title: 'Molecules/StageStepper',
  component: StageStepper,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StageStepper>;

const sampleHistory: readonly StageStepItem[] = [
  {
    id: 'step-3',
    stage: 'Технический этап',
    fromStage: 'Скрининг',
    timestamp: 'Сегодня, 14:30',
    isCurrent: true,
    comment: 'Пройден скрининг с HR. Назначена лайв-сессия System Design на пятницу.',
  },
  {
    id: 'step-2',
    stage: 'Скрининг',
    fromStage: 'Откликнулся',
    timestamp: 'Вчера, 11:15',
    comment: 'HR откликнулся в LinkedIn, запросил актуальное резюме.',
  },
  {
    id: 'step-1',
    stage: 'Откликнулся',
    fromStage: 'Не связывались',
    timestamp: '8 нояб., 16:40',
  },
];

export const Default: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <StageStepper
        items={sampleHistory}
        onAddComment={(id) => alert(`Добавить комментарий к ${id}`)}
        onEditComment={(id) => alert(`Редактировать комментарий ${id}`)}
        onDeleteComment={(id) => alert(`Удалить комментарий ${id}`)}
      />
    </div>
  ),
};

export const ComposedWithStageSteps: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <StageStepper>
        <StageStep
          stage="Оффер"
          fromStage="Финал с фаундером"
          timestamp="Сегодня, 16:00"
          isCurrent
          comment="Получен оффер с релокационным пакетом."
        />
        <StageStep
          stage="Финал с фаундером"
          fromStage="Технический этап"
          timestamp="Вчера, 15:30"
          comment="Пройден бар-рейзинг."
        />
        <StageStep
          stage="Технический этап"
          fromStage="Скрининг"
          timestamp="3 дня назад"
        />
      </StageStepper>
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <StageStepper items={[]} />
    </div>
  ),
};
