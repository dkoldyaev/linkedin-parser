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
  name: 'Базовая (Все контролы)',
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

export const PropSideAll: Story = {
  name: 'Пропс: side — Все 4 стороны (Контрол: content)',
  args: {
    content: 'Пример текста подсказки',
  },
  parameters: {
    controls: { include: ['content'] },
    docs: {
      description: {
        story:
          'Витрина всех 4 значений `side`: `top`, `bottom`, `left`, `right`. Доступен только один контрол — `content`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: side (Все 4 стороны) — Контролы: [content]
        </Text>
        <Text variant="caption" tone="secondary">
          Наведите на кнопки ниже для сравнения сторон top, bottom, left, right:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Tooltip content={args.content} side="top" delayDuration={0}>
            <Button variant="secondary" size="sm">
              side=&quot;top&quot;
            </Button>
          </Tooltip>
          <Tooltip content={args.content} side="bottom" delayDuration={0}>
            <Button variant="secondary" size="sm">
              side=&quot;bottom&quot;
            </Button>
          </Tooltip>
          <Tooltip content={args.content} side="left" delayDuration={0}>
            <Button variant="secondary" size="sm">
              side=&quot;left&quot;
            </Button>
          </Tooltip>
          <Tooltip content={args.content} side="right" delayDuration={0}>
            <Button variant="secondary" size="sm">
              side=&quot;right&quot;
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};

export const PropSideAndAlignSingle: Story = {
  name: 'Пропсы: side и align — Интерактивный выбор (Контролы: side, align)',
  args: {
    side: 'right',
    align: 'center',
  },
  parameters: {
    controls: { include: ['side', 'align'] },
    docs: {
      description: {
        story:
          'Пропс `side` (`top`, `right`, `bottom`, `left`) определяет сторону всплытия, а `align` (`start`, `center`, `end`) — смещение относительно края триггера. Доступны только два контрола: `side` и `align`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: side &amp; align — Контролы: [side, align]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте side и align в панели Controls и наведите курсор на кнопку:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Tooltip
            content={`side="${args.side}", align="${args.align}"`}
            side={args.side}
            align={args.align}
            delayDuration={0}
          >
            <Button variant="primary">
              Интерактивный ({args.side} / {args.align})
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
    controls: { include: ['content', 'delayDuration'] },
    docs: {
      description: {
        story:
          'Пропс `content` задает текст подсказки, а `delayDuration` регулирует паузу перед открытием в миллисекундах. Доступны только контролы `content` и `delayDuration`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: content &amp; delayDuration — Контролы: [content, delayDuration]
        </Text>
        <Text variant="caption" tone="secondary">
          Измените content и delayDuration в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Tooltip content={args.content} delayDuration={args.delayDuration}>
            <Button variant="secondary">Проверить задержку ({args.delayDuration}ms)</Button>
          </Tooltip>
        </div>
      </div>
    </div>
  ),
};
