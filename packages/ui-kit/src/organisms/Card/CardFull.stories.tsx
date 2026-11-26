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
import { CardFooter, CardFull } from './index';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CardFull> = {
  title: 'Organisms/Card/CardFull',
  component: CardFull,
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
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof CardFull>;

export const Default: Story = {
  render: (args) => (
    <div className={layoutStyles.narrowBox}>
      <CardFull
        {...args}
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
      </CardFull>
    </div>
  ),
};
