import type { Meta, StoryObj } from '@storybook/react-vite';
import { ExternalLink, Sparkles } from 'lucide-react';
import { Card } from './Card';
import { Badge, Button, Icon, Text } from '../../atoms';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Card> = {
  title: 'Organisms/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const VacancyKanbanCard: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <Card
        interactive
        title="Staff Frontend Architect"
        subtitle="Stripe • Remote (EU) • $195k–$230k"
        headerActions={<Badge tone="success">96% Match</Badge>}
        footer={
          <>
            <Text variant="mono" tone="muted">
              ID: #VAC-8421
            </Text>
            <div className={layoutStyles.row}>
              <Button
                size="sm"
                variant="ghost"
                endIcon={<Icon icon={ExternalLink} size="xs" />}
              >
                LinkedIn
              </Button>
              <Button
                size="sm"
                variant="primary"
                startIcon={<Icon icon={Sparkles} size="xs" />}
              >
                Adapt CV
              </Button>
            </div>
          </>
        }
      >
        <div className={layoutStyles.row}>
          <Badge size="sm" tone="primary">
            React 19
          </Badge>
          <Badge size="sm" tone="primary">
            Design Systems
          </Badge>
          <Badge size="sm" tone="neutral">
            TypeScript
          </Badge>
          <Badge size="sm" tone="neutral">
            Storybook
          </Badge>
        </div>
      </Card>
    </div>
  ),
};
