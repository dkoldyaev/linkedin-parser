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
  name: 'Базовая (Все контролы)',
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

export const PropToneAll: Story = {
  name: 'Пропс: tone — Все 4 тона (Контрол: children)',
  args: {
    children: 'Пример текста уведомления для сравнения всех 4 семантических тонов баннера.',
  },
  parameters: {
    controls: { include: ['children'] },
    docs: {
      description: {
        story:
          'Витрина всех 4 значений `tone`: `info`, `success`, `warning`, `danger`. Доступен только один контрол — `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Все 4 тона одновременно) — Контролы: [children]
        </Text>
        <Text variant="caption" tone="secondary">
          Измените текст children в панели Controls для всех 4 баннеров:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.stackSm}>
          <AlertBanner tone="info" title="tone='info'">
            {args.children}
          </AlertBanner>
          <AlertBanner tone="success" title="tone='success'">
            {args.children}
          </AlertBanner>
          <AlertBanner tone="warning" title="tone='warning'">
            {args.children}
          </AlertBanner>
          <AlertBanner tone="danger" title="tone='danger'">
            {args.children}
          </AlertBanner>
        </div>
      </div>
    </div>
  ),
};

export const PropToneSingle: Story = {
  name: 'Пропс: tone — Интерактивный выбор (Контролы: tone, children)',
  args: {
    tone: 'warning',
    children: 'Резюме было изменено после последней проверки совместимости. Запустите анализ повторно.',
  },
  parameters: {
    controls: { include: ['tone', 'children'] },
    docs: {
      description: {
        story:
          'Интерактивная настройка пропса `tone` на одном баннере. Доступны только два контрола: `tone` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: tone (Одиночный баннер) — Контролы: [tone, children]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте tone и текст сообщения в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner tone={args.tone} title="CV OUTDATED NOTICE">
          {args.children}
        </AlertBanner>
      </div>
    </div>
  ),
};

export const PropTitleAndChildren: Story = {
  name: 'Пропсы: title и children (Заголовок и текст сообщения)',
  args: {
    title: 'ВЕРСИЯ РЕЗЮМЕ #4 СГЕНЕРИРОВАНА',
    children: 'Соответствие ключевым словам вакансии выросло до 94%.',
  },
  parameters: {
    controls: { include: ['title', 'children'] },
    docs: {
      description: {
        story:
          'Пропс `title` рендерит верхний моноширинный заголовок (опционален), а `children` — основной текст сообщения. Доступны только контролы `title` и `children`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title &amp; children — Контролы: [title, children]
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение баннера с заголовком (title) и компактного однострочного баннера без title:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner tone="success" title={args.title}>
          {args.children}
        </AlertBanner>
        <AlertBanner tone="success" title={undefined}>
          {args.children}
        </AlertBanner>
      </div>
    </div>
  ),
};

export const PropOnDismissAndDismissLabel: Story = {
  name: 'Пропсы: onDismiss и dismissLabel (Кнопка закрытия)',
  args: {
    dismissLabel: 'Скрыть сообщение об ошибке',
  },
  parameters: {
    controls: { include: ['dismissLabel'] },
    docs: {
      description: {
        story:
          'При передаче функции `onDismiss` в правой части баннера рендерится кнопка с иконкой `X` и атрибутом `aria-label={dismissLabel}`. Доступен только контрол `dismissLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: onDismiss &amp; dismissLabel — Контролы: [dismissLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте dismissLabel в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <AlertBanner
          tone="danger"
          title="RATE LIMIT EXCEEDED"
          dismissLabel={args.dismissLabel}
          onDismiss={() => undefined}
        >
          Задача поставлена в очередь на повторную попытку через 60 секунд.
        </AlertBanner>
      </div>
    </div>
  ),
};
