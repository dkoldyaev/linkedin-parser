import { Badge, Paragraph, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { ModalBody } from './ModalBody';

const meta: Meta<typeof ModalBody> = {
  title: 'Organisms/Modal/ModalBody',
  component: ModalBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Прокручиваемый контейнер основного содержимого модального окна `ModalBody` (`Modal.Body`). Поддерживает токенизированные отступы `padding` (`none`, `sm`, `md`, `lg`), вертикальный интервал `gap` (`none`, `sm`, `md`, `lg`), управление прокруткой `scrollable` и автоматическую доводку скролла по 32px сетке Blueprint `snapScroll` (`useGridScroll`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    padding: 'md',
    gap: 'sm',
    scrollable: true,
    snapScroll: true,
  },
  argTypes: {
    padding: {
      control: 'inline-radio',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Внутренние отступы тела модального окна.',
    },
    gap: {
      control: 'inline-radio',
      options: ['none', 'sm', 'md', 'lg'],
      description: 'Вертикальное расстояние (`gap`) между дочерними секциями внутри `ModalBody`.',
    },
    scrollable: {
      control: 'boolean',
      description: 'Включает вертикальную прокрутку (`overflow-y: auto`) и атрибут `data-bp-scroller="true"`.',
    },
    snapScroll: {
      control: 'boolean',
      description: 'При `scrollable={true}` плавно доводит позицию скролла до ближайшего шага 32px сетки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalBody>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ModalBody`. Настраивайте `padding`, `gap`, `scrollable` и `snapScroll` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ModalBody — Контейнер тела модального окна с 32px snap-скроллом
        </Text>
        <Text variant="caption" tone="secondary">
          Обеспечивает единые отступы и вертикальный ритм между секциями диалога.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <ModalBody {...args}>
            <Paragraph size="sm" spacing="none">
              Первый блок контента внутри ModalBody (padding=&quot;{args.padding}&quot;, gap=&quot;
              {args.gap}&quot;).
            </Paragraph>
            <Paragraph size="sm" tone="secondary" spacing="none">
              Второй блок контента для демонстрации вертикального интервала между элементами.
            </Paragraph>
            <div>
              <Badge tone="accent" size="sm">
                Третий дочерний узел
              </Badge>
            </div>
          </ModalBody>
        </div>
      </div>
    </div>
  ),
};

export const PropPaddingAndGap: Story = {
  name: 'Пропсы: padding и gap (Внутренние поля и интервал)',
  args: {
    padding: 'lg',
    gap: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `padding` (`none`, `sm`, `md`, `lg`) задает поля вокруг контента, а `gap` — расстояние между дочерними блоками.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: padding &amp; gap
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте padding и gap в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <ModalBody {...args}>
            <div className={layoutStyles.box}>Секция 1</div>
            <div className={layoutStyles.box}>Секция 2</div>
          </ModalBody>
        </div>
      </div>
    </div>
  ),
};

export const PropScrollableAndSnapScroll: Story = {
  name: 'Пропсы: scrollable и snapScroll (Прокрутка по 32px сетке)',
  args: {
    scrollable: true,
    snapScroll: true,
    padding: 'sm',
    gap: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `scrollable` активирует вертикальный скролл-контейнер, а `snapScroll` подключает хук `useGridScroll()` для выравнивания `scrollTop` кратно 32px.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: scrollable &amp; snapScroll
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаги scrollable и snapScroll в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.box}>
          <ModalBody {...args}>
            <Text variant="mono" size="xs">
              scrollable={String(args.scrollable)} | snapScroll={String(args.snapScroll)}
            </Text>
          </ModalBody>
        </div>
      </div>
    </div>
  ),
};
