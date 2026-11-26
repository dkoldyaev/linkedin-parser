import { Button, Icon } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Trash2, XCircle } from 'lucide-react';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { ModalFooter } from './ModalFooter';

const meta: Meta<typeof ModalFooter> = {
  title: 'Organisms/Modal/ModalFooter',
  component: ModalFooter,
  tags: ['autodocs'],
  argTypes: {
    justify: {
      control: 'radio',
      options: ['start', 'center', 'end', 'between'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalFooter>;

export const JustifyEnd: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" size="sm" onClick={() => alert('Cancel')}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => alert('Save Changes')}>
            Save Changes
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </div>
  ),
};

export const JustifyBetween: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalFooter justify="between">
        <Button variant="secondary" tone="danger" size="sm" onClick={() => alert('Delete')}>
          <Icon icon={Trash2} size="sm" />
          <span>Delete Column</span>
        </Button>
        <ModalFooter.Actions>
          <Button variant="secondary" size="sm" onClick={() => alert('Cancel')}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={() => alert('Apply Changes')}>
            Apply Changes
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </div>
  ),
};

export const VacancyFooterAction: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalFooter justify="between">
        <Button variant="secondary" size="sm" onClick={() => alert('Move to rejected')}>
          <Icon icon={XCircle} size="sm" tone="danger" />
          <span>Перенести в отказ</span>
        </Button>
        <Button variant="secondary" size="sm" onClick={() => alert('Close')}>
          Закрыть
        </Button>
      </ModalFooter>
    </div>
  ),
};

export const JustifyStart: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalFooter justify="start">
        <ModalFooter.Actions>
          <Button variant="primary" size="sm" onClick={() => alert('Download')}>
            Download Report
          </Button>
          <Button variant="secondary" size="sm" onClick={() => alert('Copy Link')}>
            Copy Link
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </div>
  ),
};

export const JustifyCenter: Story = {
  render: () => (
    <div className={layoutStyles.panel}>
      <ModalFooter justify="center">
        <Button variant="primary" size="sm" onClick={() => alert('Acknowledged')}>
          I Understand and Agree
        </Button>
      </ModalFooter>
    </div>
  ),
};
