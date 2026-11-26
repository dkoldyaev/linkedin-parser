import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useState } from 'react';
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
    title: 'BLUEPRINT.UI',
    subtitle: 'DESIGN SYSTEM',
    queueCount: 2,
    showThemeToggle: true,
    theme: 'dark',
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

function InteractiveHeaderStory(args: React.ComponentProps<typeof Header>): React.ReactElement {
  const [search, setSearch] = useState('');
  const [currentTheme, setCurrentTheme] = useState<'dark' | 'light'>(args.theme ?? 'dark');
  const [menuOpen, setMenuOpen] = useState(false);

  return (
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
          placeholder="Search entities, tags, or metrics..."
          aria-label="Global search"
          expandOnFocus
        />
      }
      onPrimaryAction={() => undefined}
      onRefresh={() => undefined}
      onSettingsClick={() => undefined}
    />
  );
}

export const DefaultApplicationHeader: Story = {
  args: {
    title: 'BLUEPRINT.UI',
    subtitle: 'DESIGN SYSTEM',
    queueCount: 2,
    showThemeToggle: true,
    user: {
      name: 'Alex Morgan',
      email: 'alex@blueprint.dev',
    },
    onLogout: () => undefined,
  },
  render: (args) => <InteractiveHeaderStory {...args} />,
};

export const GuestModeHeader: Story = {
  args: {
    title: 'BLUEPRINT.UI',
    subtitle: 'DESIGN SYSTEM',
    queueCount: 0,
    showThemeToggle: true,
    user: {
      isAnonymous: true,
    },
    onLogin: () => undefined,
  },
  render: (args) => <InteractiveHeaderStory {...args} />,
};

export const ComposedHeader: Story = {
  render: () => (
    <Header
      brand={<Header.Brand title="BLUEPRINT" subtitle="MODULAR DESIGN" />}
      actions={
        <Header.Actions showThemeToggle theme="dark" onThemeToggle={() => alert('Theme toggle')} />
      }
      userSlot={
        <Header.UserMenu
          user={{
            name: 'Alex Developer',
            email: 'alex@example.com',
          }}
          onLogout={() => alert('Log out')}
        />
      }
    />
  ),
};
