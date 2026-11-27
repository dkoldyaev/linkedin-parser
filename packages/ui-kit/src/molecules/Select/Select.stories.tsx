import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import { Select, type SelectOption, type SelectProps } from './Select';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const STAGE_OPTIONS: readonly SelectOption[] = [
  { value: 'not_contacted', label: 'Еще не написал' },
  { value: 'applied', label: 'Откликнулся (Applied)' },
  { value: 'interview', label: 'Техническое интервью' },
  { value: 'offer', label: 'Получен оффер' },
  { value: 'archived', label: 'Архив (недоступно)', disabled: true },
];

const meta: Meta<typeof Select> = {
  title: 'Molecules/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Доступная молекула выпадающего списка `Select`, построенная на `@radix-ui/react-select` и портальном контейнере `<OverlayProvider>`. Поддерживает стандартный режим формы (`variant="default"`) и компактный фильтр-режим (`variant="filter"`), состояние ошибки `invalid` и пустые значения (`""`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    value: 'interview',
    options: STAGE_OPTIONS,
    placeholder: 'Выберите этап воронки...',
    variant: 'default',
    disabled: false,
    invalid: false,
    ariaLabel: 'Этап воронки вакансии',
  },
  argTypes: {
    value: {
      control: 'select',
      options: ['not_contacted', 'applied', 'interview', 'offer', ''],
      description: 'Текущее выбранное значение (`value`).',
    },
    options: {
      control: 'object',
      description: 'Массив опций `SelectOption` (`value`, `label`, `disabled`).',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-заглушка, когда значение еще не выбрано.',
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'filter'],
      description: 'Визуальный вариант триггера (`default` — поле формы, `filter` — компактный селект для `FilterBar`).',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует открытие выпадающего списка.',
    },
    invalid: {
      control: 'boolean',
      description: 'Отображает контур ошибки валидации (`--ui-danger`) и `aria-invalid="true"`.',
    },
    ariaLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для кнопки-триггера.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Select>;

function ControlledSelectDemo(args: SelectProps): React.ReactElement {
  const [selectedValue, setSelectedValue] = useState(args.value);

  useEffect(() => {
    setSelectedValue(args.value);
  }, [args.value]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Select — Выпадающий список на базе Radix Select + OverlayProvider
        </Text>
        <Text variant="caption" tone="secondary">
          Кликните по триггеру для открытия портального меню. Текущее значение:{' '}
          <code>{selectedValue || '(пусто)'}</code>
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <Select {...args} value={selectedValue} onValueChange={setSelectedValue} />
        </div>
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Select`. Настраивайте `value`, `variant`, `placeholder`, `invalid` и `disabled` через панель Controls.',
      },
    },
  },
  render: (args) => <ControlledSelectDemo {...args} />,
};

export const PropVariant: Story = {
  name: 'Пропс: variant (Поле формы default / Компактный фильтр filter)',
  args: {
    variant: 'filter',
  },
  parameters: {
    controls: { include: ['variant'] },
    docs: {
      description: {
        story:
          'Пропс `variant` переключает внешний вид триггера между полноразмерным контролом формы (`default`) и компактным фильтром тулбара (`filter`), который подсвечивается при наличии выбранного непустого значения. Доступен только контрол `variant`.',
      },
    },
  },
  render: (args) => (
    <ControlledSelectDemo
      variant={args.variant}
      value="interview"
      options={STAGE_OPTIONS}
      onValueChange={() => undefined}
    />
  ),
};

export const PropOptionsAndPlaceholder: Story = {
  name: 'Пропсы: options и placeholder (Список опций и заглушка)',
  args: {
    placeholder: 'Выберите валюту зарплаты...',
    options: [
      { value: 'EUR', label: '€ (EUR) — Евро' },
      { value: 'USD', label: '$ (USD) — Доллар США' },
      { value: 'GBP', label: '£ (GBP) — Фунт стерлингов' },
    ],
  },
  parameters: {
    controls: { include: ['options', 'placeholder'] },
    docs: {
      description: {
        story:
          'Когда `value` не задано или пусто, триггер отображает текст из пропса `placeholder`, а при открытии рендерит список из `options`. Доступны только контролы `options` и `placeholder`.',
      },
    },
  },
  render: (args) => (
    <ControlledSelectDemo
      value=""
      placeholder={args.placeholder}
      options={args.options}
      onValueChange={() => undefined}
    />
  ),
};

export const PropInvalidAndDisabled: Story = {
  name: 'Пропсы: invalid и disabled (Ошибка валидации и блокировка)',
  args: {
    invalid: true,
    disabled: false,
  },
  parameters: {
    controls: { include: ['invalid', 'disabled'] },
    docs: {
      description: {
        story:
          'Пропс `invalid` подсвечивает триггер цветом ошибки `--ui-danger`, а `disabled` блокирует открытие списка. Доступны только контролы `invalid` и `disabled`.',
      },
    },
  },
  render: (args) => (
    <ControlledSelectDemo
      value="not_contacted"
      options={STAGE_OPTIONS}
      invalid={args.invalid}
      disabled={args.disabled}
      onValueChange={() => undefined}
    />
  ),
};
