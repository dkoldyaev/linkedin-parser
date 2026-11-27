import { Badge, Paragraph, Text } from '../../atoms';
import { Card, CardBody, CardFooter, CardHeader } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { TokenList } from '../../molecules';

const meta: Meta<typeof CardBody> = {
  title: 'Organisms/Card/CardBody',
  component: CardBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент тела карточки `CardBody` (`Card.Body`). Оборачивает содержимое карточки и при `snapToGrid={true}` автоматически квантует свою внешнюю высоту кратно `GRID_CELL_PX` (32px) через `ResizeObserver`, чтобы следующий за ним `<CardFooter>` всегда начинался строго на линии 32px сетки Blueprint.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    snapToGrid: true,
  },
  argTypes: {
    snapToGrid: {
      control: 'boolean',
      description:
        'Если `true`, измеряет высоту контента и округляет высоту `CardBody` вверх до ближайшего кратного 32px (`--bp-card-body-height`).',
    },
    contentClassName: {
      control: 'text',
      description: 'Дополнительный CSS-класс для внутреннего контейнера содержимого.',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для внешнего контейнера `CardBody`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof CardBody>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `CardBody`. Переключайте `snapToGrid` в панели Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          CardBody — Контейнер тела карточки с 32px квантованием высоты
        </Text>
        <Text variant="caption" tone="secondary">
          Гарантирует, что футер карточки всегда попадает в шаг 32px сетки независимо от длины
          текста.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="accent">
            <CardBody {...args}>
              <CardHeader overline="Datadog" title="Senior Frontend Engineer" />
              <Paragraph size="sm" tone="secondary" spacing="none">
                Произвольный объем текста и чипов внутри CardBody, высота которого автоматически
                выравнивается по сетке 32px.
              </Paragraph>
              <TokenList>
                <Badge size="xs" variant="chip">
                  React 19
                </Badge>
                <Badge size="xs" variant="chip">
                  TypeScript
                </Badge>
              </TokenList>
            </CardBody>
            <CardFooter metaSlot={<Text variant="caption" tone="muted">32px Aligned Footer</Text>} />
          </Card>
        </div>
      </div>
    </div>
  ),
};

export const PropSnapToGrid: Story = {
  name: 'Пропс: snapToGrid (Квантование высоты кратно 32px)',
  args: {
    snapToGrid: true,
  },
  parameters: {
    controls: { include: ['snapToGrid'] },
    docs: {
      description: {
        story:
          'Пропс `snapToGrid` управляет автоматическим расчетом CSS-переменной `--bp-card-body-height` кратно 32px. Доступен только контрол `snapToGrid`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: snapToGrid (boolean) — Контролы: [snapToGrid]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг snapToGrid в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Card tone="success">
            <CardBody snapToGrid={args.snapToGrid}>
              <Text variant="body-sm">
                Режим snapToGrid={String(args.snapToGrid)}: высота тела карточки синхронизирована с
                32px сеткой.
              </Text>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  ),
};
