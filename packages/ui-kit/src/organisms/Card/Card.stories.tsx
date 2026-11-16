import type { Meta, StoryObj } from '@storybook/react-vite';
import { Award, Banknote, ChevronLeft, ChevronRight, Globe, History, MapPin, X } from 'lucide-react';
import { Card, CardFooter } from './Card';
import { Badge, Button, Icon, Paragraph, Text } from '../../atoms';
import { ButtonGroup, TokenList } from '../../molecules';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof Card> = {
  title: 'Organisms/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    title: 'Staff Frontend Architect — UI Platform',
    overline: 'Stripe',
    overlineHref: 'https://stripe.com',
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
    horizontal: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Card>;

export const ComposableCard: Story = {
  render: (args) => (
    <div className={layoutStyles.narrowBox}>
      <Card
        overline={args.overline}
        overlineHref={args.overlineHref}
        title={args.title}
        statusIndicators={
          <Badge variant="outline" tone="info" size="xs">
            Interview
          </Badge>
        }
        footer={
          <CardFooter
            metaSlot={
              <div className={layoutStyles.row}>
                <Text variant="caption" tone="muted">
                  14 Nov
                </Text>
                <Text
                  variant="caption"
                  tone="muted"
                  startIcon={<Icon icon={History} size="2xs" />}
                >
                  3
                </Text>
              </div>
            }
            actionsSlot={
              <ButtonGroup>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => undefined}
                  aria-label="Move previous"
                >
                  <Icon icon={ChevronLeft} size="sm" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  tone="danger"
                  onClick={() => undefined}
                  aria-label="Dismiss card"
                >
                  <Icon icon={X} size="sm" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => undefined}
                  aria-label="Move next"
                >
                  <Icon icon={ChevronRight} size="sm" />
                </Button>
              </ButtonGroup>
            }
          />
        }
      >
          <div className={layoutStyles.row}>
            <Badge
              variant="solid"
              tone="success"
              size="xs"
              icon={<Icon icon={Award} size="2xs" />}
            >
              92%
            </Badge>
            <Text
              variant="caption"
              tone="accent"
              startIcon={<Icon icon={Globe} size="xs" />}
            >
              Remote
            </Text>
            <Text
              variant="caption"
              tone="secondary"
              startIcon={<Icon icon={MapPin} size="xs" />}
            >
              EU / Dublin
            </Text>
            <Text
              variant="mono"
              tone="success"
              startIcon={<Icon icon={Banknote} size="xs" />}
            >
              €140k – €165k
            </Text>
          </div>
          <Paragraph size="sm" tone="secondary">
            Architecture and evolution of the Blueprint component system with strict token governance and automated verification.
          </Paragraph>
          <TokenList
            mode="readonly"
            size="xs"
            tokens={['TypeScript', 'React 19', 'Storybook 10', 'Radix UI', 'CSS Modules']}
            maxVisible={4}
          />
      </Card>
    </div>
  ),
};

export const AccentTonesComparison: Story = {
  render: () => (
    <div className={layoutStyles.grid3}>
      <Card
        title="High Priority Entity"
        overline="Success Edge"
        accentTone="success"
        footer={<Text variant="caption" tone="muted">Updated today</Text>}
      >
        <Paragraph size="sm" tone="secondary">
          Uses semantic success accent bar on the left edge.
        </Paragraph>
      </Card>
      <Card
        title="Medium Priority Entity"
        overline="Warning Edge"
        accentTone="warning"
        footer={<Text variant="caption" tone="muted">Updated 2d ago</Text>}
      >
        <Paragraph size="sm" tone="secondary">
          Uses semantic warning accent bar on the left edge.
        </Paragraph>
      </Card>
      <Card
        title="Critical / Blocked Entity"
        overline="Danger Edge"
        accentTone="danger"
        footer={<Text variant="caption" tone="muted">Action required</Text>}
      >
        <Paragraph size="sm" tone="secondary">
          Uses semantic danger accent bar on the left edge.
        </Paragraph>
      </Card>
    </div>
  ),
};
