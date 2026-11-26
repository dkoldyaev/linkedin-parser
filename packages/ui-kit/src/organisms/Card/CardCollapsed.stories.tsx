import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../../atoms';
import { CardCollapsed } from './index';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CardCollapsed> = {
  title: 'Organisms/Card/CardCollapsed',
  component: CardCollapsed,
  tags: ['autodocs'],
  args: {
    overline: 'Stripe',
    title: 'Staff Frontend Architect — UI Platform',
    accentTone: 'success',
    selected: false,
    interactive: true,
  },
  argTypes: {
    accentTone: {
      control: 'select',
      options: ['none', 'success', 'warning', 'danger', 'accent', 'info'],
    },
    selected: { control: 'boolean' },
    interactive: { control: 'boolean' },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CardCollapsed>;

export const Default: Story = {
  render: (args) => (
    <div className={layoutStyles.narrowBox}>
      <CardCollapsed
        {...args}
        statusIndicators={
          <Badge variant="outline" tone="info" size="xs">
            Interview
          </Badge>
        }
      />
    </div>
  ),
};

export const StatesList: Story = {
  render: () => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsed
          interactive
          accentTone="success"
          overline="Stripe"
          title="Staff Frontend Architect"
          statusIndicators={
            <Badge variant="outline" tone="info" size="xs">
              Interview
            </Badge>
          }
        />
      </div>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsed
          interactive
          accentTone="warning"
          overline="Revolut"
          title="Senior Fullstack Developer (Node.js + React)"
          statusIndicators={
            <Badge variant="solid" tone="warning" size="xs">
              68%
            </Badge>
          }
        />
      </div>
      <div className={layoutStyles.narrowBox}>
        <CardCollapsed
          interactive
          accentTone="danger"
          overline="Figma"
          title="Lead UI Engineer"
          statusIndicators={
            <Badge variant="outline" tone="danger" size="xs">
              Closed
            </Badge>
          }
        />
      </div>
    </div>
  ),
};
