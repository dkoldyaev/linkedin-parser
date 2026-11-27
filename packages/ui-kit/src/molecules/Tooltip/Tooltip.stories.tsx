import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
  title: 'Molecules/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступная молекула всплывающей подсказки `Tooltip` на базе `@radix-ui/react-tooltip` и портала `<OverlayProvider>`. Отображает моноширинный текст подсказки (`<Text variant="mono">`) при наведении курсора или фокусе с клавиатуры.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    content: 'Запускает фоновую задачу LLM-адаптации через Mercure SSE',
    side: 'top',
    align: 'center',
    delayDuration: 150,
  },
  argTypes: {
    content: {
      control: 'text',
      description: 'Текст или содержимое всплывающей подсказки.',
    },
    side: {
      control: 'inline-radio',
      options: ['top', 'right', 'bottom', 'left'],
      description: 'Предпочтительная сторона появления подсказки относительно триггера.',
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Выравнивание подсказки вдоль выбранной стороны.',
    },
    delayDuration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Задержка в миллисекундах перед появлением подсказки при наведении мыши.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Tooltip`. Наведите курсор на кнопку и настройте `content`, `side`, `align` и `delayDuration` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Tooltip — Всплывающая подсказка при наведении и фокусе
        </Text>
        <Text variant="caption" tone="secondary">
          Наведите курсор или сфокусируйтесь клавишей Tab на кнопке ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Tooltip {...args}>
            <Button variant="primary">Наведите курсор для просмотра Tooltip</Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};

export const PropSideAndAlign: Story = {
  name: 'Пропсы: side и align (Позиционирование подсказки)',
  args: {
    content: 'Позиционированная подсказка',
    side: 'right',
    align: 'center',
    delayDuration: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `side` (`top`, `right`, `bottom`, `left`) определяет сторону всплытия, а `align` (`start`, `center`, `end`) — смещение относительно края триггера.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: side &amp; align
        </Text>
        <Text variant="caption" tone="secondary">
          Наведите на кнопки ниже для сравнения сторон top, right, bottom, left:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Tooltip {...args}>
            <Button variant="primary">Интерактивный ({args.side})</Button>
          </Tooltip>
          <Tooltip content="side='top'" side="top" delayDuration={0}>
            <Button variant="secondary" size="sm">
              Top
            </Button>
          </Tooltip>
          <Tooltip content="side='bottom'" side="bottom" delayDuration={0}>
            <Button variant="secondary" size="sm">
              Bottom
            </Button>
          </Tooltip>
          <Tooltip content="side='right'" side="right" delayDuration={0}>
            <Button variant="secondary" size="sm">
              Right
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};

export const PropContentAndDelayDuration: Story = {
  name: 'Пропсы: content и delayDuration (Текст и задержка всплытия)',
  args: {
    content: 'Мгновенная подсказка (delayDuration = 0ms)',
    delayDuration: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `content` задает текст подсказки, а `delayDuration` регулирует паузу перед открытием в миллисекундах.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: content &amp; delayDuration
        </Text>
        <Text variant="caption" tone="secondary">
          Измените content и delayDuration в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Tooltip {...args}>
            <Button variant="secondary">Проверить задержку ({args.delayDuration}ms)</Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};
