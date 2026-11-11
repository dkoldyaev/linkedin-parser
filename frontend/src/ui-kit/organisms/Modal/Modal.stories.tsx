import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Layers } from 'lucide-react';
import { Modal } from './Modal';
import { Button, Icon, Input } from '../../atoms';
import { ColorPicker, FormField } from '../../molecules';
import { useDisclosure } from '../../hooks';

const meta: Meta<typeof Modal> = {
  title: 'Organisms/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ModalDemo(): React.ReactElement {
  const { isOpen, open, close } = useDisclosure({ defaultIsOpen: false });

  return (
    <div>
      <Button variant="primary" onClick={open}>
        Open Blueprint Modal
      </Button>
      <Modal
        isOpen={isOpen}
        onClose={close}
        title="Create Kanban Column"
        description="Configure a new pipeline stage on the 32px Blueprint board."
        headerIcon={<Icon icon={Layers} size="md" tone="accent" />}
        footer={
          <>
            <Button variant="secondary" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" onClick={close}>
              Create Column
            </Button>
          </>
        }
      >
        <FormField label="Column Name" required>
          {(a11yProps) => (
            <Input {...a11yProps} defaultValue="System Design Round" />
          )}
        </FormField>
        <FormField label="Accent Palette">
          <ColorPicker value="blue" onChange={() => undefined} />
        </FormField>
      </Modal>
    </div>
  );
}

export const InteractiveModal: Story = {
  render: () => <ModalDemo />,
};
