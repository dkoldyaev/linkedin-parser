import {
  Award,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Globe,
  History,
  MapPin,
  X,
} from 'lucide-react';
import { Badge, Button, Icon, Paragraph, Text } from '../../atoms';
import { ButtonGroup, TokenList } from '../../molecules';
import { Card, CardFooter } from './Card';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
                <Text variant="caption" tone="muted" startIcon={<Icon icon={History} size="2xs" />}>
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
          <Badge variant="solid" tone="success" size="xs" icon={<Icon icon={Award} size="2xs" />}>
            92%
          </Badge>
          <Text variant="caption" tone="accent" startIcon={<Icon icon={Globe} size="xs" />}>
            Remote
          </Text>
          <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
            EU / Dublin
          </Text>
          <Text variant="mono" tone="success" startIcon={<Icon icon={Banknote} size="xs" />}>
            €140k – €165k
          </Text>
        </div>
        <Paragraph size="sm" tone="secondary">
          Architecture and evolution of the Blueprint component system with strict token governance
          and automated verification.
        </Paragraph>
        <TokenList>
          {['TypeScript', 'React 19', 'Storybook 10', 'Radix UI', 'CSS Modules']
            .slice(0, 4)
            .map((tech) => (
              <Badge key={tech} size="xs" variant="chip">
                {tech}
              </Badge>
            ))}
        </TokenList>
      </Card>
    </div>
  ),
};

export const CompactFormat: Story = {
  render: () => (
    <div className={layoutStyles.stackSm}>
      <div className={layoutStyles.narrowBox}>
        <Card
          compact
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
        <Card
          compact
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
        <Card
          compact
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

export const LoadingSkeletons: Story = {
  render: () => (
    <div className={layoutStyles.grid2}>
      <div>
        <Text variant="caption" tone="muted">
          Standard Card (isLoading)
        </Text>
        <Card isLoading accentTone="accent" />
      </div>
      <div>
        <Text variant="caption" tone="muted">
          Compact Card (isLoading + compact)
        </Text>
        <div className={layoutStyles.stackSm}>
          <Card isLoading compact accentTone="success" />
          <Card isLoading compact accentTone="warning" />
          <Card isLoading compact accentTone="danger" />
        </div>
      </div>
    </div>
  ),
};
