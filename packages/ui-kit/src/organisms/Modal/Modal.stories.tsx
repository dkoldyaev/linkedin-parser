import { Button, Icon, Input, Text } from '../../atoms';
import { ColorPicker, FormField } from '../../molecules';
import { Layers, Settings } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal, type ModalProps } from './Modal';
import React, { useState } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';

const ICON_MAP = {
  none: undefined,
  Layers: <Icon icon={Layers} size="md" tone="accent" />,
  Settings: <Icon icon={Settings} size="md" tone="accent" />,
} as const;

const meta: Meta<typeof Modal> = {
  title: 'Organisms/Modal/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступный организм модального диалогового окна `Modal` на базе `@radix-ui/react-dialog` и портала `<OverlayProvider>`, строго выровненный по 32px сетке Blueprint (`useBlueprintGrid`). Поддерживает как сокращенный режим через пропсы (`title`, `description`, `icon`, `footer`), так и составную композицию через подкомпоненты `<Modal.Header>`, `<Modal.Body>` и `<Modal.Footer>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    isOpen: false,
    title: 'Создать колонку Канбан',
    description: 'Настройте новый этап воронки вакансий на 32px сетке Blueprint.',
    icon: ICON_MAP.Layers,
    size: 'md',
    closeLabel: 'Закрыть модальное окно',
    hideCloseButton: false,
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Управляет открытым/закрытым состоянием модального окна.',
    },
    title: {
      control: 'text',
      description: 'Заголовок модального окна (активирует shorthand-режим с автоматическим `ModalHeader` и `ModalBody`).',
    },
    description: {
      control: 'text',
      description: 'Вторичное описание под заголовком модального окна (`DialogPrimitive.Description`).',
    },
    icon: {
      control: 'select',
      options: Object.keys(ICON_MAP),
      mapping: ICON_MAP,
      description: 'Иконка слева от заголовка модального окна.',
    },
    size: {
      control: 'inline-radio',
      options: ['sm', 'md', 'lg', 'xl', '2xl', 'custom'],
      description: 'Предустановленный размер ширины модального окна (`sm`, `md`, `lg`, `xl`, `2xl`, `custom`).',
    },
    width: {
      control: 'text',
      description: 'Явное переопределение ширины в пикселях или CSS-единицах (например `"640px"`).',
    },
    closeLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для кнопки закрытия.',
    },
    hideCloseButton: {
      control: 'boolean',
      description: 'Скрывает кнопку закрытия (`X`) в шапке модального окна.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function InteractiveModalDemo(args: ModalProps): React.ReactElement {
  const [open, setOpen] = useState(args.isOpen);
  const [color, setColor] = useState('blue');

  React.useEffect(() => {
    setOpen(args.isOpen);
  }, [args.isOpen]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Modal — Модальное диалоговое окно (size=&quot;{args.size}&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Нажмите кнопку ниже для открытия модального окна с привязкой к 32px сетке.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <Button variant="primary" onClick={() => setOpen(true)}>
            Открыть Modal ({args.size})
          </Button>
        </div>
        <Modal
          {...args}
          isOpen={open}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button variant="primary" size="sm" onClick={() => setOpen(false)}>
                Создать колонку
              </Button>
            </>
          }
        >
          <FormField label="НАЗВАНИЕ КОЛОНКИ" required>
            {(a11yProps) => <Input {...a11yProps} defaultValue="System Design Round" />}
          </FormField>
          <FormField label="ЦВЕТОВОЙ АКЦЕНТ">
            <ColorPicker value={color} onChange={setColor} />
          </FormField>
        </Modal>
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Modal`. Откройте окно кнопкой и настраивайте `size`, `width`, `title`, `description`, `icon`, `hideCloseButton` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveModalDemo {...args} />,
};

export const PropSizeAndWidth: Story = {
  name: 'Пропсы: size и width (Управление габаритами окна)',
  args: {
    size: 'lg',
    width: undefined,
    title: 'Инспектор параметров (size="lg")',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `size` выбирает стандартный пресет ширины (`sm`, `md`, `lg`, `xl`, `2xl`), а `width` позволяет задать точную кастомную ширину (например `"768px"`).',
      },
    },
  },
  render: (args) => <InteractiveModalDemo {...args} />,
};

export const PropTitleDescriptionAndIcon: Story = {
  name: 'Пропсы: title, description, icon и hideCloseButton',
  args: {
    title: 'Системная конфигурация',
    description: 'Проверьте настройки синхронизации перед применением.',
    icon: ICON_MAP.Settings,
    hideCloseButton: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `title`, `description`, `icon` и `hideCloseButton` автоматически передаются во внутренний `<ModalHeader>` в shorthand-режиме.',
      },
    },
  },
  render: (args) => <InteractiveModalDemo {...args} />,
};
