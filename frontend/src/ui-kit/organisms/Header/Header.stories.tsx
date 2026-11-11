import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Header } from './Header';
import { SearchBar } from '../../molecules';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    title: 'CV.ALTER',
    subtitle: 'PARSER & TRACKER',
    queueCount: 2,
    showThemeToggle: true,
    theme: 'dark',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

function LiveHeaderStory(
  args: React.ComponentProps<typeof Header>
): React.ReactElement {
  const [search, setSearch] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(
    args.theme ?? 'dark'
  );
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Header
      {...args}
      theme={currentTheme}
      onThemeToggle={() =>
        setCurrentTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
      }
      menuOpen={menuOpen}
      onMenuToggle={() => setMenuOpen((prev) => !prev)}
      search={
        <SearchBar
          value={search}
          onValueChange={setSearch}
          placeholder="Поиск по названию или компании..."
          aria-label="Поиск вакансий"
          expandOnFocus
        />
      }
      onAddVacancies={() => alert('Add vacancies clicked')}
      onRefresh={() => alert('Refresh clicked')}
      onDownloadExtension={() => alert('Download extension clicked')}
      onSettingsClick={() => alert('Settings clicked')}
    />
  );
}

export const LiveApplicationHeader: Story = {
  args: {
    title: 'CV.ALTER',
    subtitle: 'PARSER & TRACKER',
    queueCount: 2,
    showThemeToggle: true,
    user: {
      name: 'Denis Koldyaev',
      email: 'denis@example.com',
    },
    onLogout: () => alert('Logout clicked'),
  },
  render: (args) => <LiveHeaderStory {...args} />,
};

export const GuestModeHeader: Story = {
  args: {
    title: 'CV.ALTER',
    subtitle: 'PARSER & TRACKER',
    queueCount: 0,
    showThemeToggle: true,
    user: {
      isAnonymous: true,
    },
    onLogin: () => alert('Login clicked'),
  },
  render: (args) => <LiveHeaderStory {...args} />,
};

export const SimpleSubpageHeader: Story = {
  args: {
    title: 'CV.ALTER',
    subtitle: 'CV MANAGEMENT',
    showThemeToggle: true,
    user: {
      name: 'Denis Koldyaev',
      email: 'denis@example.com',
    },
    onLogout: () => alert('Logout clicked'),
  },
  render: (args) => <LiveHeaderStory {...args} />,
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
  },
  args: {
    title: 'CV.ALTER',
    subtitle: 'PARSER & TRACKER',
    queueCount: 2,
    showThemeToggle: true,
    user: {
      name: 'Denis Koldyaev',
      email: 'denis@example.com',
    },
    onLogout: () => alert('Logout clicked'),
  },
  render: (args) => <LiveHeaderStory {...args} />,
};

export const MobilePortraitView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    title: 'CV.ALTER',
    subtitle: 'PARSER & TRACKER',
    queueCount: 2,
    showThemeToggle: true,
    user: {
      name: 'Denis Koldyaev',
      email: 'denis@example.com',
    },
    onLogout: () => alert('Logout clicked'),
  },
  render: (args) => <LiveHeaderStory {...args} />,
};

export const MobileSearchFocused: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    title: 'CV.ALTER',
    subtitle: 'PARSER & TRACKER',
    queueCount: 2,
    searchFocused: true,
    showThemeToggle: true,
    user: {
      name: 'Denis Koldyaev',
      email: 'denis@example.com',
    },
    onLogout: () => alert('Logout clicked'),
  },
  render: (args) => <LiveHeaderStory {...args} />,
};
