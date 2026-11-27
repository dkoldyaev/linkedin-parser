import type { Meta, StoryObj } from '@storybook/react-vite';
import { HeaderUserMenu } from './HeaderUserMenu';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof HeaderUserMenu> = {
  title: 'Organisms/Header/HeaderUserMenu',
  component: HeaderUserMenu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент профиля пользователя в шапке `HeaderUserMenu` (`Header.UserMenu`). В авторизованном состоянии отображает аватар (или инициал имени), моноширинное имя пользователя и кнопку выхода с иконкой `LogOut`. В гостевом режиме (`user.isAnonymous === true`) рендерит кнопку входа с иконкой `LogIn`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    user: {
      name: 'Dmitry Koldyaev',
      email: 'dmitry@blueprint.dev',
      isAnonymous: false,
    },
    loginLabel: 'Войти',
    logoutLabel: 'Выйти из аккаунта',
  },
  argTypes: {
    user: {
      control: 'object',
      description: 'Объект пользователя `HeaderUser` (`name`, `email`, `picture`, `isAnonymous`).',
    },
    loginLabel: {
      control: 'text',
      description: 'Текст кнопки входа для гостевого пользователя (`user.isAnonymous === true`).',
    },
    logoutLabel: {
      control: 'text',
      description: 'Подсказка `title` и `aria-label` для кнопки выхода из аккаунта.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderUserMenu>;

export const Base: Story = {
  name: 'Базовая (Все контролы)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `HeaderUserMenu`. Изменяйте поля объекта `user` (`name`, `email`, `isAnonymous`), `loginLabel` и `logoutLabel` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          HeaderUserMenu — Блок профиля пользователя / входа в шапке
        </Text>
        <Text variant="caption" tone="secondary">
          Автоматически генерирует инициал пользователя, если URL аватара (picture) не указан.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <HeaderUserMenu {...args} onLogin={() => undefined} onLogout={() => undefined} />
        </div>
      </div>
    </div>
  ),
};

export const PropUserAuthenticatedVsAnonymous: Story = {
  name: 'Пропс: user (Авторизованный профиль / Гостевой режим isAnonymous)',
  args: {
    user: {
      isAnonymous: true,
    },
  },
  parameters: {
    controls: { include: ['user'] },
    docs: {
      description: {
        story:
          'Пропс `user` определяет режим отображения: при `user.isAnonymous = true` рендерится кнопка входа; при `isAnonymous = false` — плашка профиля с кнопкой выхода. Доступен только контрол `user`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: user (HeaderUser) — Контролы: [user]
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение гостевого режима (isAnonymous=true) и авторизованного профиля:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <HeaderUserMenu
            user={args.user}
            loginLabel="Войти через Google"
            onLogin={() => undefined}
            onLogout={() => undefined}
          />
          <HeaderUserMenu
            user={{ name: 'Alex Morgan', email: 'alex@blueprint.dev' }}
            onLogout={() => undefined}
          />
        </div>
      </div>
    </div>
  ),
};

export const PropLoginAndLogoutLabels: Story = {
  name: 'Пропсы: loginLabel и logoutLabel (Локализация кнопок)',
  args: {
    loginLabel: 'Sign In',
    logoutLabel: 'Завершить сеанс',
  },
  parameters: {
    controls: { include: ['loginLabel', 'logoutLabel'] },
    docs: {
      description: {
        story:
          'Пропсы `loginLabel` и `logoutLabel` задают подписи и `aria-label` кнопок авторизации. Доступны только контролы `loginLabel` и `logoutLabel`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: loginLabel &amp; logoutLabel — Контролы: [loginLabel, logoutLabel]
        </Text>
        <Text variant="caption" tone="secondary">
          Настройте тексты кнопок в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.row}>
          <HeaderUserMenu
            user={{ isAnonymous: true }}
            loginLabel={args.loginLabel}
            onLogin={() => undefined}
          />
          <HeaderUserMenu
            user={{ name: 'Elena Architect', email: 'elena@blueprint.dev' }}
            logoutLabel={args.logoutLabel}
            onLogout={() => undefined}
          />
        </div>
      </div>
    </div>
  ),
};
