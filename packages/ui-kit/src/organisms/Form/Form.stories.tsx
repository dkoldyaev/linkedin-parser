import { ColorPicker, FormField } from '../../molecules';
import { Input, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Form } from './Form';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Form> = {
  title: 'Organisms/Form',
  component: Form,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Структурированный организм формы `Form` (`<form noValidate>`), объединяющий верхние баннеры статуса/ошибки (`<AlertBanner tone="danger" | "success">`), стек полей `<FormField>` и нижнюю панель действий с кнопками подтверждения (`submitLabel`, `submitVariant`, `isSubmitting`, `submitDisabled`) и отмены (`onCancel`, `cancelLabel`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    errorMessage: '',
    successMessage: '',
    submitLabel: 'Сохранить колонку',
    cancelLabel: 'Отмена',
    isSubmitting: false,
    submitDisabled: false,
    submitVariant: 'primary',
  },
  argTypes: {
    errorMessage: {
      control: 'text',
      description: 'Текст общей ошибки отправки формы (рендерит `<AlertBanner tone="danger">`).',
    },
    successMessage: {
      control: 'text',
      description: 'Текст успешного сохранения формы (рендерит `<AlertBanner tone="success">`).',
    },
    submitLabel: {
      control: 'text',
      description: 'Подпись кнопки `type="submit"`.',
    },
    cancelLabel: {
      control: 'text',
      description: 'Подпись кнопки отмены (отображается при переданном `onCancel`).',
    },
    isSubmitting: {
      control: 'boolean',
      description: 'Включает индикатор загрузки `loading` на кнопке отправки и блокирует кнопку отмены.',
    },
    submitDisabled: {
      control: 'boolean',
      description: 'Блокирует кнопку отправки формы (`disabled`).',
    },
    submitVariant: {
      control: 'inline-radio',
      options: ['primary', 'secondary', 'ghost'],
      description: 'Визуальный вариант кнопки подтверждения формы.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Form>;

function InteractiveFormDemo(args: React.ComponentProps<typeof Form>): React.ReactElement {
  const [title, setTitle] = useState('Technical Screening');
  const [color, setColor] = useState('blue');

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Form — Структурированный контейнер формы с баннерами и панелью кнопок
        </Text>
        <Text variant="caption" tone="secondary">
          Настраивайте errorMessage, successMessage, isSubmitting и submitDisabled через Controls.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Form
          {...args}
          onSubmit={(e) => {
            e.preventDefault();
          }}
          onCancel={() => {
            setTitle('Technical Screening');
            setColor('blue');
          }}
        >
          <FormField label="НАЗВАНИЕ КОЛОНКИ" required>
            {(a11yProps) => (
              <Input
                {...a11yProps}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            )}
          </FormField>
          <FormField label="ЦВЕТОВОЙ АКЦЕНТ">
            <ColorPicker value={color} onChange={setColor} />
          </FormField>
        </Form>
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
          'Базовая интерактивная демонстрация `Form`. Проверьте все пропсы (`errorMessage`, `successMessage`, `submitLabel`, `cancelLabel`, `isSubmitting`, `submitDisabled`) через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveFormDemo {...args} />,
};

export const PropErrorAndSuccessMessages: Story = {
  name: 'Пропсы: errorMessage и successMessage (Баннеры обратной связи)',
  args: {
    errorMessage: 'Колонка с таким системным идентификатором уже существует.',
    successMessage: '',
    submitLabel: 'Повторить сохранение',
  },
  parameters: {
    docs: {
      description: {
        story:
          'При наличии `errorMessage` или `successMessage` в верхней части формы автоматически рендерится `<AlertBanner>` соответствующего тона.',
      },
    },
  },
  render: (args) => <InteractiveFormDemo {...args} />,
};

export const PropIsSubmittingAndSubmitDisabled: Story = {
  name: 'Пропсы: isSubmitting, submitDisabled, submitLabel и cancelLabel',
  args: {
    isSubmitting: true,
    submitLabel: 'Сохранение изменений...',
    cancelLabel: 'Отменить',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `isSubmitting` включает спиннер загрузки на кнопке `type="submit"` и блокирует кнопку `Cancel` во время сетевого запроса.',
      },
    },
  },
  render: (args) => <InteractiveFormDemo {...args} />,
};
