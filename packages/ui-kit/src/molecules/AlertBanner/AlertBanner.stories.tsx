import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertBanner } from './AlertBanner';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof AlertBanner> = {
  title: 'Molecules/AlertBanner',
  component: AlertBanner,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула `AlertBanner` — информационная или статусная плашка уведомления, квантованная по 32px сетке Blueprint. Автоматически подбирает иконку из `lucide-react` (`Info`, `CheckCircle2`, `AlertTriangle`, `AlertCircle`) и ARIA-роль (`role="status"` или `role="alert"`) в зависимости от семантического тона (`tone`). Композирует `<Icon>`, `<Text>` и кнопку закрытия `<Button>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    tone: 'info',
    title: 'MERCURE SSE CONNECTED',
    children: 'Подключен поток обновлений фонового воркера адаптации CV в реальном времени.',
    dismissLabel: 'Закрыть уведомление',
  },
  argTypes: {
    tone: {
      control: 'inline-radio',
      options: ['info', 'success', 'warning', 'danger'],
      description:
        'Семантический тон баннера (`info`, `success`, `warning`, `danger`), определяющий цвет, иконку и `role` (`status` / `alert`).',
    },
    title: {
      control: 'text',
      description: 'Моноширинный заголовок баннера (`<Text variant="mono-label">`).',
    },
    children: {
      control: 'text',
      description: 'Основной поясняющий текст сообщения.',
    },
    dismissLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для кнопки закрытия баннера.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AlertBanner>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `AlertBanner`. Настраивайте `tone`, `title`, `children` и `dismissLabel` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          AlertBanner — Системный баннер уведомлений и ошибок
        </Text>
        <Text variant="caption" tone="secondary">
          Квантуется по высоте кратно 32px (--ui-grid-cell) и поддерживает кнопку закрытия.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner {...args} onDismiss={() => undefined} />
      </div>
    </div>
  ),
};

export const PropTone: Story = {
  name: 'Пропс: tone (Семантический тип уведомления)',
  args: {
    tone: 'warning',
    title: 'CV OUTDATED NOTICE',
    children: 'Резюме было изменено после последней проверки совместимости. Запустите анализ повторно.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `tone` выбирает один из 4 режимов: `info` (справка), `success` (успех), `warning` (предупреждение, `role="alert"`), `danger` (критическая ошибка, `role="alert"`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (&quot;info&quot; | &quot;success&quot; | &quot;warning&quot; | &quot;danger&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте tone в Controls для верхнего образца или сравните все 4 тона ниже:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner {...args} />
        <div className={layoutStyles.stackSm}>
          <AlertBanner tone="info" title="tone='info'">
            Информационное системное сообщение.
          </AlertBanner>
          <AlertBanner tone="success" title="tone='success'">
            Операция сохранения успешно завершена.
          </AlertBanner>
          <AlertBanner tone="warning" title="tone='warning'">
            Внимание: часть вакансий будет перемещена в архив.
          </AlertBanner>
          <AlertBanner tone="danger" title="tone='danger'">
            Ошибка подключения к API парсера.
          </AlertBanner>
        </div>
      </div>
    </div>
  ),
};

export const PropTitleAndChildren: Story = {
  name: 'Пропсы: title и children (Заголовок и текст сообщения)',
  args: {
    tone: 'success',
    title: 'ВЕРСИЯ РЕЗЮМЕ #4 СГЕНЕРИРОВАНА',
    children: 'Соответствие ключевым словам вакансии выросло до 94%.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `title` рендерит верхний моноширинный заголовок (опционален), а `children` — основной текст сообщения.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title &amp; children
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение баннера с заголовком (title) и компактного однострочного баннера без title:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner {...args} />
        <AlertBanner tone={args.tone} title={undefined}>
          Баннер без заголовка (title={'{undefined}'}) — только основной текст children.
        </AlertBanner>
      </div>
    </div>
  ),
};

export const PropOnDismissAndDismissLabel: Story = {
  name: 'Пропсы: onDismiss и dismissLabel (Кнопка закрытия)',
  args: {
    tone: 'danger',
    title: 'RATE LIMIT EXCEEDED',
    children: 'Задача поставлена в очередь на повторную попытку через 60 секунд.',
    dismissLabel: 'Скрыть сообщение об ошибке',
  },
  parameters: {
    docs: {
      description: {
        story:
          'При передаче функции `onDismiss` в правой части баннера рендерится кнопка с иконкой `X` и атрибутом `aria-label={dismissLabel}`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: onDismiss &amp; dismissLabel
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте dismissLabel в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner {...args} onDismiss={() => undefined} />
      </div>
    </div>
  ),
};
