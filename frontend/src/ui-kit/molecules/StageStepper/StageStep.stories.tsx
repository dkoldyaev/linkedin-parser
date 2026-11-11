import type { Meta, StoryObj } from '@storybook/react-vite';
import { StageStep } from './StageStep';
import styles from './StageStepperStory.module.css';

const meta: Meta<typeof StageStep> = {
  title: 'Molecules/StageStep',
  component: StageStep,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StageStep>;

export const Default: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <StageStep
        stage="Технический этап"
        fromStage="Скрининг"
        timestamp="Сегодня, 14:30"
        isCurrent
        comment="Пройден скрининг с HR. Назначена лайв-сессия System Design."
        onEditComment={() => alert('Редактировать')}
        onDeleteComment={() => alert('Удалить')}
      />
    </div>
  ),
};

export const WithoutComment: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <StageStep
        stage="Скрининг"
        fromStage="Откликнулся"
        timestamp="Вчера, 11:15"
        onAddComment={() => alert('Добавить комментарий')}
      />
    </div>
  ),
};

export const LastStep: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <StageStep
        stage="Откликнулся"
        timestamp="8 нояб., 16:40"
        isLast
      />
    </div>
  ),
};
