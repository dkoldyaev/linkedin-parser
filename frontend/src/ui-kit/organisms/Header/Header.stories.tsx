import type { Meta, StoryObj } from '@storybook/react-vite';
import { Layers, Plus, Settings } from 'lucide-react';
import { Header } from './Header';
import { Button, Icon } from '../../atoms';

const meta: Meta<typeof Header> = {
  title: 'Organisms/Header',
  component: Header,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Header>;

export const DefaultWorkspaceHeader: Story = {
  render: () => (
    <Header
      title="CV.ALTER"
      versionBadge="v2.0 BLUEPRINT"
      statusLabel="WORKER IDLE"
      statusTone="success"
      statusPulse
      actions={
        <>
          <Button
            size="sm"
            variant="secondary"
            startIcon={<Icon icon={Layers} size="xs" />}
          >
            Queue (0)
          </Button>
          <Button
            size="sm"
            variant="secondary"
            startIcon={<Icon icon={Settings} size="xs" />}
          >
            Admin
          </Button>
          <Button
            size="sm"
            variant="primary"
            startIcon={<Icon icon={Plus} size="xs" />}
          >
            Add Vacancy
          </Button>
        </>
      }
    />
  ),
};
