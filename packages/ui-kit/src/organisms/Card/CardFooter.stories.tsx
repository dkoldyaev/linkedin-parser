import { Button, Icon, Text } from '../../atoms';
import { Card, CardFooter } from './index';
import { ChevronLeft, ChevronRight, History, RotateCcw, X } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ButtonGroup } from '../../molecules';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof CardFooter> = {
  title: 'Organisms/Card/CardFooter',
  component: CardFooter,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof CardFooter>;

export const Default: Story = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <Card tone="success">
        <CardFooter
          metaSlot={
            <div className={layoutStyles.row}>
              <Text variant="caption" tone="muted">
                14 Nov
              </Text>
              <Text variant="caption" tone="muted" startIcon={<Icon icon={History} size="2xs" />}>
                2
              </Text>
            </div>
          }
          actionsSlot={
            <ButtonGroup>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => alert('Move left')}
                aria-label="Move left"
              >
                <Icon icon={ChevronLeft} size="sm" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                tone="danger"
                onClick={() => alert('Reject')}
                aria-label="Reject"
              >
                <Icon icon={X} size="sm" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => alert('Move right')}
                aria-label="Move right"
              >
                <Icon icon={ChevronRight} size="sm" />
              </Button>
            </ButtonGroup>
          }
        />
      </Card>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className={layoutStyles.narrowBox}>
      <div className={layoutStyles.stack}>
        <Card tone="success">
          <CardFooter
            metaSlot={
              <>
                <Text variant="caption" tone="muted">
                  10 Nov
                </Text>
                <Text variant="caption" tone="muted" startIcon={<Icon icon={History} size="2xs" />}>
                  4
                </Text>
              </>
            }
            actionsSlot={
              <ButtonGroup>
                <Button variant="ghost" size="icon" disabled aria-label="Move left">
                  <Icon icon={ChevronLeft} size="sm" />
                </Button>
                <Button variant="ghost" size="icon" tone="danger" aria-label="Reject">
                  <Icon icon={X} size="sm" />
                </Button>
                <Button variant="ghost" size="icon" aria-label="Move right">
                  <Icon icon={ChevronRight} size="sm" />
                </Button>
              </ButtonGroup>
            }
          />
        </Card>

        <Card tone="danger">
          <CardFooter
            metaSlot={
              <Text variant="caption" tone="muted">
                1 Nov (Archived)
              </Text>
            }
            actionsSlot={
              <Button
                variant="secondary"
                size="sm"
                onClick={() => alert('Restore')}
                startIcon={<Icon icon={RotateCcw} size="xs" />}
              >
                Восстановить
              </Button>
            }
          />
        </Card>
      </div>
    </div>
  ),
};
