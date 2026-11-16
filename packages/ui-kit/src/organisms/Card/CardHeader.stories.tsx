import type { Meta, StoryObj } from '@storybook/react-vite';
import { Ban } from 'lucide-react';
import { Card, CardBody, CardHeader } from './Card';
import { Badge, Icon } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CardHeader> = {
  title: 'Organisms/Card/CardHeader',
  component: CardHeader,
  tags: ['autodocs'],
  args: {
    title: 'Staff Frontend Architect (Design Systems)',
    subtitle: 'Core product infra & design systems team',
    overline: 'Stripe',
    overlineHref: 'https://stripe.com',
    selectable: true,
    checked: false,
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    overline: { control: 'text' },
    overlineHref: { control: 'text' },
    selectable: { control: 'boolean' },
    checked: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CardHeader>;

export const Default: Story = {
  render: (args) => (
    <div className={layoutStyles.narrowBox}>
      <Card matchScore={85}>
        <CardBody snapToGrid={false}>
          <CardHeader {...args} />
        </CardBody>
      </Card>
    </div>
  ),
};

export const WithStatusIndicators: Story = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <div className={layoutStyles.stack}>
        <Card matchScore={88} selected>
          <CardBody snapToGrid={false}>
            <CardHeader
              overline="Stripe"
              overlineHref="https://stripe.com"
              title="Staff Frontend Architect (Design Systems)"
              selectable
              checked
              statusIndicators={
                <Badge variant="outline" tone="info" size="xs">
                  Interview
                </Badge>
              }
            />
          </CardBody>
        </Card>

        <Card matchScore={42}>
          <CardBody snapToGrid={false}>
            <CardHeader
              overline="Linear"
              overlineHref="https://linear.app"
              title="Senior Product Engineer"
              selectable
              checked={false}
              statusIndicators={
                <Badge
                  variant="outline"
                  tone="danger"
                  size="xs"
                  icon={<Icon icon={Ban} size="2xs" aria-hidden="true" />}
                >
                  Closed
                </Badge>
              }
            />
          </CardBody>
        </Card>
      </div>
    </div>
  ),
};
