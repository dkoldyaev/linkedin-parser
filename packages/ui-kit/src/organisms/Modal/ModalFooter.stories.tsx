import { Button, Icon, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2, XCircle } from 'lucide-react';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { ModalFooter } from './ModalFooter';

const meta: Meta<typeof ModalFooter> = {
  title: 'Organisms/Modal/ModalFooter',
  component: ModalFooter,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент нижней панели действий модального окна `ModalFooter` (`Modal.Footer`), квантованный по высоте 32px сетки Blueprint (`data-min-grids="2"`). Поддерживает режимы горизонтального выравнивания `justify` (`start`, `center`, `end`, `between`) и группировку кнопок через `<ModalFooter.Actions>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    justify: 'between',
  },
  argTypes: {
    justify: {
      control: 'inline-radio',
      options: ['start', 'center', 'end', 'between'],
      description:
        'Горизонтальное распределение кнопок в футере (`start`, `center`, `end`, `between`).',
    },
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс контейнера футера.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalFooter>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ModalFooter`. Переключайте `justify` (`start`, `center`, `end`, `between`) через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ModalFooter — Нижняя панель кнопок модального окна
        </Text>
        <Text variant="caption" tone="secondary">
          Минимальная высота — 2 ячейки сетки (64px) с верхним разделителем.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalFooter {...args}>
          <Button variant="secondary" size="sm" tone="danger">
            <Icon icon={Trash2} size="sm" />
            <span>Удалить запись</span>
          </Button>
          <ModalFooter.Actions>
            <Button variant="secondary" size="sm">
              Отмена
            </Button>
            <Button variant="primary" size="sm">
              Сохранить изменения
            </Button>
          </ModalFooter.Actions>
        </ModalFooter>
      </div>
    </div>
  ),
};

export const PropJustify: Story = {
  name: 'Пропс: justify (Выравнивание кнопок start / center / end / between)',
  args: {
    justify: 'end',
  },
  parameters: {
    controls: { include: ['justify'] },
    docs: {
      description: {
        story:
          'Пропс `justify` управляет раскладкой кнопок: `end` (стандартно справа), `between` (деструктивное действие слева, основные кнопки справа), `start` (слева) и `center` (по центру). Доступен только контрол `justify`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: justify (&quot;start&quot; | &quot;center&quot; | &quot;end&quot; | &quot;between&quot;) — Контролы: [justify]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте justify в Controls для верхнего образца или сравните варианты ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalFooter justify={args.justify}>
          <ModalFooter.Actions>
            <Button variant="secondary" size="sm">
              Отмена
            </Button>
            <Button variant="primary" size="sm">
              Применить ({args.justify})
            </Button>
          </ModalFooter.Actions>
        </ModalFooter>

        <ModalFooter justify="between">
          <Button variant="secondary" size="sm">
            <Icon icon={XCircle} size="sm" tone="danger" />
            <span>В не подошло (justify=&quot;between&quot;)</span>
          </Button>
          <Button variant="secondary" size="sm">
            Закрыть
          </Button>
        </ModalFooter>
      </div>
    </div>
  ),
};
