import type { Meta, StoryObj } from '@storybook/react-vite';
import { Accordion } from './Accordion';
import styles from './AccordionStory.module.css';

const meta: Meta<typeof Accordion> = {
  title: 'Molecules/Accordion',
  component: Accordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <Accordion
        items={[
          {
            id: '1',
            title: '6+ лет глубокого опыта с React и экосистемой TypeScript',
            actionLabel: 'Обоснование',
            content: '8 лет работы с React (Redux, Zustand, Radix, Tailwind, Storybook 8-10). Создание переиспользуемых библиотек компонентов.',
          },
          {
            id: '2',
            title: 'Опыт разработки дизайн-систем и UI-библиотек с нуля',
            actionLabel: 'Обоснование',
            content: 'Автор архитектуры дизайн-системы Blueprint в 3 проектах с единым дизайн-токеном и поддержкой dark/light тем.',
          },
          {
            id: '3',
            title: 'Понимание Web Core Vitals, оптимизация LCP/CLS и рендеринга',
            actionLabel: 'Обоснование',
            content: 'Оптимизировал LCP с 3.8s до 1.1s в дашборде с 50 000+ элементами через виртуализацию и CSS layers.',
          },
        ]}
      />
    </div>
  ),
};

export const WithExpandedItem: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <Accordion
        defaultExpandedIds={['1']}
        items={[
          {
            id: '1',
            title: '6+ лет глубокого опыта с React и экосистемой TypeScript',
            actionLabel: 'Обоснование',
            content: '8 лет работы с React (Redux, Zustand, Radix, Tailwind, Storybook 8-10). Создание переиспользуемых библиотек компонентов.',
          },
          {
            id: '2',
            title: 'Опыт разработки дизайн-систем и UI-библиотек с нуля',
            actionLabel: 'Обоснование',
            content: 'Автор архитектуры дизайн-системы Blueprint в 3 проектах с единым дизайн-токеном и поддержкой dark/light тем.',
          },
        ]}
      />
    </div>
  ),
};

export const WithoutBullets: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <Accordion
        bullet={false}
        defaultActionLabel="Детали"
        items={[
          {
            id: '1',
            title: 'Настройка сборки и пайплайнов Vite',
            content: 'Полный перенос с Webpack 5 на Vite 6 со снижением времени сборки с 45с до 3.2с.',
          },
          {
            id: '2',
            title: 'Интеграционное тестирование через Playwright',
            content: 'Написание end-to-end тестов для критических путей пользователя.',
          },
        ]}
      />
    </div>
  ),
};
