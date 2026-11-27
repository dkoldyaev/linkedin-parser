import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderActions } from './HeaderActions';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof HeaderActions> = {
  title: 'Organisms/Header/HeaderActions',
  component: HeaderActions,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент иконочных кнопок управления в шапке `HeaderActions` (`Header.Actions`). Отображает кнопки обновления данных (`onRefresh`, `RefreshCw`), переключения цветовой темы (`showThemeToggle`, `theme`, `Sun`/`Moon`) и открытия настроек (`onSettingsClick`, `Settings`) с иконками из `lucide-react`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    refreshLabel: 'Обновить данные',
    showThemeToggle: true,
    theme: 'dark',
    settingsLabel: 'Открыть настройки',
  },
  argTypes: {
    refreshLabel: {
      control: 'text',
      description: 'Подсказка `title` и `aria-label` для кнопки обновления.',
    },
    showThemeToggle: {
      control: 'boolean',
      description: 'Показывает или скрывает кнопку переключения темы (`Sun` / `Moon`).',
    },
    theme: {
      control: 'inline-radio',
      options: ['dark', 'light'],
      description: 'Текущая тема (`dark` показывает иконку `Sun`, `light` — иконку `Moon`).',
    },
    settingsLabel: {
      control: 'text',
      description: 'Подсказка `title` и `aria-label` для кнопки настроек.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderActions>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `HeaderActions`. Настраивайте `showThemeToggle`, `theme`, `refreshLabel` и `settingsLabel` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          HeaderActions — Группа системных действий шапки (Refresh, Theme, Settings)
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерит 32x32px иконочные кнопки на сетке Blueprint.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <HeaderActions
            {...args}
            onRefresh={() => undefined}
            onThemeToggle={() => undefined}
            onSettingsClick={() => undefined}
          />
        </div>
      </div>
    </div>
  ),
};

export const PropShowThemeToggleAndTheme: Story = {
  name: 'Пропсы: showThemeToggle и theme (Переключатель темы)',
  args: {
    showThemeToggle: true,
    theme: 'dark',
  },
  parameters: {
    controls: { include: ['showThemeToggle', 'theme'] },
    docs: {
      description: {
        story:
          'Пропс `showThemeToggle` включает кнопку смены темы, а `theme` (`"dark" | "light"`) меняет иконку между `Sun` и `Moon`. Доступны только контролы `showThemeToggle` и `theme`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: showThemeToggle &amp; theme — Контролы: [showThemeToggle, theme]
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте theme (&quot;dark&quot; / &quot;light&quot;) и showThemeToggle в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <HeaderActions
            showThemeToggle={args.showThemeToggle}
            theme={args.theme}
            onThemeToggle={() => undefined}
          />
        </div>
      </div>
    </div>
  ),
};

export const PropRefreshAndSettingsLabels: Story = {
  name: 'Пропсы: refreshLabel и settingsLabel (Тексты подсказок кнопок)',
  args: {
    refreshLabel: 'Синхронизировать Канбан-доску',
    settingsLabel: 'Параметры колонок и резюме',
  },
  parameters: {
    controls: { include: ['refreshLabel', 'settingsLabel'] },
    docs: {
      description: {
        story:
          'Кнопки обновления и настроек отображаются, когда переданы обработчики `onRefresh` и `onSettingsClick`, а их `aria-label`/`title` регулируются пропсами `refreshLabel` и `settingsLabel`. Доступны только контролы `refreshLabel` и `settingsLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: refreshLabel &amp; settingsLabel — Контролы: [refreshLabel, settingsLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Наведите курсор на кнопки для проверки title / aria-label:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <HeaderActions
            refreshLabel={args.refreshLabel}
            settingsLabel={args.settingsLabel}
            showThemeToggle={false}
            onRefresh={() => undefined}
            onSettingsClick={() => undefined}
          />
        </div>
      </div>
    </div>
  ),
};
