import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Layers, ExternalLink, RefreshCw, Trash2, FileText, Shield } from 'lucide-react';
import { Modal } from './Modal';
import { Button, Icon, Input, Text } from '../../atoms';
import { ColorPicker, FormField, Tabs } from '../../molecules';
import { useDisclosure } from '../../hooks';

const meta: Meta<typeof Modal> = {
  title: 'Organisms/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ShorthandModalDemo(): React.ReactElement {
  const { isOpen, open, close } = useDisclosure({ defaultIsOpen: false });

  return (
    <div>
      <Button variant="primary" onClick={open}>
        Open Shorthand Modal
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

function ComposableModalDemo(): React.ReactElement {
  const { isOpen, open, close } = useDisclosure({ defaultIsOpen: false });
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');

  return (
    <div>
      <Button variant="secondary" onClick={open}>
        Open Composable Compound Modal
      </Button>
      <Modal isOpen={isOpen} onClose={close} size="lg">
        <Modal.Header
          title="Component Inspector"
          description="Decomposed into Modal.Header, Modal.Body, and Modal.Footer."
          headerIcon={<Icon icon={Layers} size="md" tone="accent" />}
          actions={
            <>
              <Button variant="ghost" size="sm">
                <Icon icon={RefreshCw} size="sm" />
                <span>Sync</span>
              </Button>
              <Button variant="ghost" size="sm">
                <Icon icon={ExternalLink} size="sm" />
              </Button>
            </>
          }
          tabs={
            <Tabs
              value={activeTab}
              onValueChange={(val) => setActiveTab(val as 'details' | 'audit')}
              items={[
                {
                  value: 'details',
                  label: 'Details',
                  icon: <Icon icon={FileText} size="sm" />,
                },
                {
                  value: 'audit',
                  label: 'Audit Log',
                  icon: <Icon icon={Shield} size="sm" />,
                },
              ]}
            />
          }
        />

        <Modal.Body padding="md">
          <Text as="p" variant="body" tone="secondary">
            Active view: <strong>{activeTab.toUpperCase()}</strong>.
          </Text>
          <Text as="p" variant="body">
            This demonstrates composition where `Modal.Header` holds custom accessories and tabs,
            `Modal.Body` provides grid-aligned scrollable content, and `Modal.Footer` formats split action triggers.
          </Text>
        </Modal.Body>

        <Modal.Footer justify="between">
          <Button variant="danger" size="sm" onClick={close}>
            <Icon icon={Trash2} size="sm" />
            <span>Delete Entity</span>
          </Button>
          <Modal.Footer.Actions>
            <Button variant="secondary" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={close}>
              Save Changes
            </Button>
          </Modal.Footer.Actions>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export const InteractiveModal: Story = {
  render: () => <ShorthandModalDemo />,
};

export const ComposableCompoundModal: Story = {
  render: () => <ComposableModalDemo />,
};
