import { Button, Input, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { FormField } from './FormField';
import layoutStyles from '../../stories/StoryLayout.module.css';

const LABEL_ACTION_MAP = {
  none: undefined,
  ResetDefaultBtn: (
    <Button variant="ghost" size="sm">
      Сбросить по умолчанию
    </Button>
  ),
} as const;

const meta: Meta<typeof FormField> = {
  title: 'Molecules/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула поля формы `FormField`, объединяющая `<Label>`, дочерний контрол ввода (`<Input>`, `<Textarea>`, `<Select>`), подсказку `hint` и сообщение об ошибке `error`. Автоматически генерирует уникальный `id` (`useId`) и связывает контрол с `aria-describedby` и `aria-invalid` через render-prop `children(a11yProps)`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    label: 'НАЗВАНИЕ КОЛОНКИ КАНБАН',
    required: true,
    disabled: false,
    hint: 'Отображается в шапке этапа на Канбан-доске.',
    error: '',
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Подпись поля формы, передаваемая в атом `<Label>`.',
    },
    required: {
      control: 'boolean',
      description: 'Отмечает поле как обязательное (`*` в `<Label>`).',
    },
    disabled: {
      control: 'boolean',
      description: 'Передает состояние `disabled` в `<Label>` и в `a11yProps` дочернего контрола.',
    },
    hint: {
      control: 'text',
      description: 'Вспомогательная подсказка под полем ввода (скрывается, если присутствует `error`).',
    },
    error: {
      control: 'text',
      description:
        'Текст ошибки валидации (`role="alert"`, тон `danger`). При непустом значении выставляет `aria-invalid="true"` дочернему контролу.',
    },
    labelAction: {
      control: 'select',
      options: Object.keys(LABEL_ACTION_MAP),
      mapping: LABEL_ACTION_MAP,
      description: 'Опциональный элемент действия справа на одной строке с `label`.',
    },
    htmlFor: {
      control: 'text',
      description: 'Явный `id` контрола (если не задан, генерируется автоматически через `useId`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `FormField`. Настраивайте `label`, `required`, `disabled`, `hint`, `error` и `labelAction` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          FormField — Обертка поля формы с автоматической ARIA-связкой
        </Text>
        <Text variant="caption" tone="secondary">
          Передает id, aria-describedby и aria-invalid в дочерний Input через render-prop.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <FormField {...args}>
          {(a11yProps) => (
            <Input
              {...a11yProps}
              invalid={Boolean(args.error)}
              defaultValue="System Design Interview"
            />
          )}
        </FormField>
      </div>
    </div>
  ),
};

export const PropLabelAndRequired: Story = {
  name: 'Пропсы: label, required и labelAction',
  args: {
    label: 'OPENAI / GEMINI API KEY',
    required: true,
    labelAction: (
      <Button variant="ghost" size="sm">
        Проверить ключ
      </Button>
    ),
    hint: 'Хранится только в защищенном серверном окружении.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `label` задает заголовок поля, `required` добавляет индикатор `*`, а `labelAction` размещает вспомогательную кнопку справа от подписи.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: label, required &amp; labelAction
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте заголовок и флаг обязательности в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <FormField {...args}>
          {(a11yProps) => <Input {...a11yProps} mono defaultValue="sk-blueprint-..." />}
        </FormField>
      </div>
    </div>
  ),
};

export const PropHintAndError: Story = {
  name: 'Пропсы: hint и error (Подсказка и ошибка валидации)',
  args: {
    label: 'ДИАПАЗОН ЗАРПЛАТЫ',
    required: true,
    hint: 'Укажите сумму до вычета налогов (Gross).',
    error: 'Минимальная зарплата не может превышать максимальную.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Когда пропс `error` пуст, под полем отображается `hint`. Как только в `error` передается текст ошибки, `hint` заменяется на сообщение `role="alert"` с тоном `danger`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: hint &amp; error
        </Text>
        <Text variant="caption" tone="secondary">
          Очистите поле error в Controls, чтобы увидеть переключение обратно на hint:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <FormField {...args}>
          {(a11yProps) => (
            <Input {...a11yProps} mono invalid={Boolean(args.error)} defaultValue="180000 - 120000" />
          )}
        </FormField>
      </div>
    </div>
  ),
};
