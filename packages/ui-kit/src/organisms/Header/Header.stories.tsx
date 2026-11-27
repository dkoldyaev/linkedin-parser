import { Badge, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
import { Header } from './Header';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { SearchBar } from '../../molecules';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Универсальный организм верхней шапки приложения `Header` на 32px сетке Blueprint. Композирует `<Header.Brand>`, центральный слот поиска `search` (с автоматическим скрытием соседних блоков при фокусе `searchFocused`), индикатор фоновой очереди `queueCount` со спиннером, главную CTA-кнопку `onPrimaryAction`, блок действий `<Header.Actions>`, профиль пользователя `<Header.UserMenu>` и кнопку мобильного бургер-меню `onMenuToggle`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'BLUEPRINT.UI',
    subtitle: 'DESIGN SYSTEM',
    queueCount: 2,
    queueLabel: '2 IN QUEUE',
    primaryActionLabel: 'CREATE NEW',
    refreshLabel: 'Refresh',
    showThemeToggle: true,
    theme: 'dark',
    settingsLabel: 'Settings',
    loginLabel: 'Sign in',
    logoutLabel: 'Sign out',
    menuOpen: false,
    searchFocused: false,
    user: {
      name: 'Alex Morgan',
      email: 'alex@blueprint.dev',
    },
  },
  argTypes: {
    title: { control: 'text', description: 'Основной заголовок бренда в левой части шапки.' },
    subtitle: { control: 'text', description: 'Подзаголовок бренда под основным названием.' },
    queueCount: {
      control: { type: 'number', min: 0, max: 50, step: 1 },
      description: 'Количество активных задач в фоновой очереди (при `> 0` отображает кнопку-пилюлю со `<Spinner>`).',
    },
    queueLabel: {
      control: 'text',
      description: 'Кастомный текст кнопки очереди (по умолчанию `"${queueCount} IN QUEUE"`).',
    },
    primaryActionLabel: {
      control: 'text',
      description: 'Текст главной CTA-кнопки добавления (`onPrimaryAction`).',
    },
    showThemeToggle: {
      control: 'boolean',
      description: 'Отображает кнопку переключения темы (`Sun` / `Moon`).',
    },
    theme: {
      control: 'inline-radio',
      options: ['dark', 'light'],
      description: 'Текущая активная тема для иконки переключателя.',
    },
    user: {
      control: 'object',
      description: 'Объект пользователя `HeaderUser` (`name`, `email`, `picture`, `isAnonymous`).',
    },
    menuOpen: {
      control: 'boolean',
      description: 'Состояние мобильного бургер-меню (`Menu` / `X`).',
    },
    searchFocused: {
      control: 'boolean',
      description: 'Принудительно активирует режим фокуса поиска (расширяет центральный слот поиска).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

function InteractiveHeaderDemo(args: React.ComponentProps<typeof Header>): React.ReactElement {
  const [search, setSearch] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(args.theme ?? 'dark');
  const [menuOpen, setMenuOpen] = useState(Boolean(args.menuOpen));

  return (
    <div className={layoutStyles.stackSm}>
      <Header
        {...args}
        theme={currentTheme}
        onThemeToggle={() => setCurrentTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
        menuOpen={menuOpen}
        onMenuToggle={() => setMenuOpen((prev) => !prev)}
        search={
          <SearchBar
            value={search}
            onValueChange={setSearch}
            placeholder="Поиск вакансий, компаний, тегов..."
            aria-label="Global search"
            expandOnFocus
          />
        }
        onPrimaryAction={() => undefined}
        onQueueClick={() => undefined}
        onRefresh={() => undefined}
        onSettingsClick={() => undefined}
        onLogin={() => undefined}
        onLogout={() => undefined}
      />
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Header`. Настраивайте `title`, `subtitle`, `queueCount`, `primaryActionLabel`, `showThemeToggle`, `theme`, `user` и `searchFocused` через панель Controls.',
      },
    },
  },
  render: (args) => <InteractiveHeaderDemo {...args} />,
};

export const PropTitleSubtitleAndBrand: Story = {
  name: 'Пропсы: title, subtitle, brandIcon и brand',
  args: {
    title: 'LINKEDIN.PARSER',
    subtitle: 'AI JOB TRACKER',
    queueCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `title`, `subtitle` и `brandIcon` передаются в `<Header.Brand>`, либо весь левый блок может быть заменен кастомным узлом `brand`.',
      },
    },
  },
  render: (args) => <InteractiveHeaderDemo {...args} />,
};

export const PropQueueCountAndPrimaryAction: Story = {
  name: 'Пропсы: queueCount, queueLabel и primaryActionLabel',
  args: {
    queueCount: 5,
    queueLabel: '5 ЗАДАЧ В ОЧЕРЕДИ',
    primaryActionLabel: 'ДОБАВИТЬ ВАКАНСИЮ',
  },
  parameters: {
    docs: {
      description: {
        story:
          'При `queueCount > 0` отображается индикатор очереди со спиннером (`queueLabel`), а при наличии `onPrimaryAction` — кнопка добавления с иконкой `Plus` (`primaryActionLabel`).',
      },
    },
  },
  render: (args) => <InteractiveHeaderDemo {...args} />,
};

export const PropUserAndGuestMode: Story = {
  name: 'Пропсы: user, loginLabel и logoutLabel (Авторизованный / Гость)',
  args: {
    user: {
      isAnonymous: true,
    },
    loginLabel: 'Войти через Google',
    queueCount: 0,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Если `user.isAnonymous === true`, в правой части шапки рендерится кнопка входа `loginLabel`; если пользователь авторизован — аватар, имя и кнопка выхода `logoutLabel`.',
      },
    },
  },
  render: (args) => <InteractiveHeaderDemo {...args} />,
};

export const PropStatusSlotAndNavigation: Story = {
  name: 'Пропсы: navigation, statusSlot и actions (Слоты расширения)',
  args: {
    navigation: (
      <div className={layoutStyles.row}>
        <Badge tone="accent" size="sm">
          Board
        </Badge>
        <Badge tone="neutral" size="sm">
          CV
        </Badge>
      </div>
    ),
    statusSlot: (
      <Text variant="mono" size="xs" tone="success">
        SSE: ONLINE
      </Text>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `navigation`, `statusSlot` и `actions` позволяют встраивать дополнительные элементы навигации и телеметрии в шапку.',
      },
    },
  },
  render: (args) => <InteractiveHeaderDemo {...args} />,
};
