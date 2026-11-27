import { Button, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModalFooter, ModalFooterActions } from './ModalFooter';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof ModalFooterActions> = {
  title: 'Organisms/Modal/ModalFooterActions',
  component: ModalFooterActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент-обертка `ModalFooterActions` (`Modal.Footer.Actions`) для группировки основных кнопок действий (например «Отмена» + «Сохранить») внутри `<ModalFooter justify="between">`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для контейнера группы кнопок.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalFooterActions>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ModalFooterActions`. Группирует кнопки действий с фиксированным токенизированным отступом внутри `ModalFooter`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ModalFooterActions — Группа кнопок подтверждения/отмены в футере
        </Text>
        <Text variant="caption" tone="secondary">
          Позволяет отделить правую пару кнопок от левой деструктивной кнопки в ModalFooter.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalFooter justify="between">
          <Button variant="ghost" size="sm" tone="danger">
            Удалить
          </Button>
          <ModalFooterActions {...args}>
            <Button variant="secondary" size="sm">
              Отмена
            </Button>
            <Button variant="primary" size="sm">
              Сохранить
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Кнопки действий)',
  parameters: {
    docs: {
      description: {
        story: 'Пропс `children` принимает набор кнопок `<Button>`, выравниваемых в ряд.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: children (React.ReactNode)
        </Text>
        <Text variant="caption" tone="secondary">
          Группировка трех кнопок внутри ModalFooterActions:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalFooter justify="end">
          <ModalFooterActions {...args}>
            <Button variant="ghost" size="sm">
              Сбросить
            </Button>
            <Button variant="secondary" size="sm">
              Черновик
            </Button>
            <Button variant="primary" size="sm">
              Опубликовать
            </Button>
          </ModalFooterActions>
        </ModalFooter>
      </div>
    </div>
  ),
};
