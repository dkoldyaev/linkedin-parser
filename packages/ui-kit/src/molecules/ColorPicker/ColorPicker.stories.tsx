import { ColorPicker, type ColorPickerProps, DEFAULT_PALETTE_OPTIONS } from './ColorPicker';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof ColorPicker> = {
  title: 'Molecules/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступная молекула выбора цвета `ColorPicker` (`role="radiogroup"`) с поддержкой клавиатурной навигации стрелками (`useKeyboardNavigation`), предустановленных семантических опций (`options` / `presets`) и выбора произвольного цвета через нативный системный колор-пикер.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    value: 'emerald',
    options: DEFAULT_PALETTE_OPTIONS,
    disabled: false,
    ariaLabel: 'Палитра цветов колонки Канбан',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'indigo', '#2563eb', '#059669'],
      description: 'Текущий выбранный идентификатор цвета или HEX-код.',
    },
    options: {
      control: 'object',
      description: 'Массив объектов `ColorOption` (`id`, `label`, `tone`, `hex`).',
    },
    presets: {
      control: 'object',
      description: 'Упрощенный массив строковых идентификаторов цветов или HEX-кодов.',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует выбор цвета во всех кнопках палитры.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Доступная подпись `aria-label` для контейнера `role="radiogroup"`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

function ControlledColorPicker(args: ColorPickerProps): React.ReactElement {
  const [selectedColor, setSelectedColor] = useState(args.value);

  useEffect(() => {
    setSelectedColor(args.value);
  }, [args.value]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ColorPicker — Палитра выбора цветового акцента (выбрано: {selectedColor})
        </Text>
        <Text variant="caption" tone="secondary">
          Использует композицию &lt;Button&gt; и &lt;StatusDot&gt; с поддержкой клавиш ArrowLeft /
          ArrowRight.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ColorPicker {...args} value={selectedColor} onChange={setSelectedColor} />
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
          'Базовая интерактивная демонстрация `ColorPicker`. Кликните по любому цвету или настройте пропсы в Controls.',
      },
    },
  },
  render: (args) => <ControlledColorPicker {...args} />,
};

export const PropValueAndOptions: Story = {
  name: 'Пропсы: value и options (Кастомные цветовые опции)',
  args: {
    value: 'emerald',
    options: [
      { id: 'blue', label: 'Primary Blue', tone: 'primary', hex: '#2563eb' },
      { id: 'emerald', label: 'Success Mint', tone: 'success', hex: '#059669' },
      { id: 'amber', label: 'Warning Amber', tone: 'warning', hex: '#d97706' },
      { id: 'rose', label: 'Danger Rose', tone: 'danger', hex: '#e11d48' },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `options` позволяет задать собственный список цветовых вариантов с метками и семантическими тонами, а `value` определяет активный элемент.',
      },
    },
  },
  render: (args) => <ControlledColorPicker {...args} />,
};

export const PropPresets: Story = {
  name: 'Пропс: presets (Массив строковых пресетов)',
  args: {
    value: 'cyan',
    options: undefined,
    presets: ['blue', 'cyan', 'emerald', 'amber', 'rose'],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `presets` позволяет передать компактный массив строк-идентификаторов (`["blue", "cyan", "emerald"]`) вместо полных объектов `ColorOption`.',
      },
    },
  },
  render: (args) => <ControlledColorPicker {...args} />,
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Заблокированная палитра)',
  args: {
    value: 'purple',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `disabled` отключает возможность переключения цвета.',
      },
    },
  },
  render: (args) => <ControlledColorPicker {...args} />,
};
