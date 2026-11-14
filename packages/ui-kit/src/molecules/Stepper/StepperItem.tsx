import React from 'react';
import { ArrowRight } from 'lucide-react';
import {
  Badge,
  Icon,
  StatusDot,
  Text,
  type BadgeTone,
  type StatusDotTone,
} from '../../atoms';
import { cn } from '../../utils';
import styles from './Stepper.module.css';

export interface StepperItemData {
  readonly id: string;
  readonly label: React.ReactNode;
  readonly fromLabel?: React.ReactNode;
  readonly timestamp?: React.ReactNode;
  readonly duration?: React.ReactNode;
  readonly description?: React.ReactNode;
  readonly tone?: BadgeTone;
  readonly active?: boolean;
}

export interface StepperItemProps extends StepperItemData {
  readonly isLast?: boolean;
}

const BADGE_TO_STATUS_TONE: Record<BadgeTone, StatusDotTone> = {
  neutral: 'neutral',
  primary: 'primary',
  accent: 'accent',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
};

/**
 * StepperItem sub-component.
 * Renders a single timeline transition step composing StatusDot, Badge, Icon, and Text.
 */
export function StepperItem({
  label,
  fromLabel,
  timestamp,
  duration,
  description,
  tone = 'neutral',
  active = false,
  isLast = false,
}: StepperItemProps): React.ReactElement {
  const dotTone: StatusDotTone = active ? 'accent' : BADGE_TO_STATUS_TONE[tone];

  return (
    <li className={cn(styles.stepItem, active && styles.stepActive)}>
      <div className={styles.timelineTrack} aria-hidden="true">
        <StatusDot
          tone={dotTone}
          size="md"
          pulse={active}
          className={styles.dot}
        />
        {!isLast && <span className={styles.connector} />}
      </div>

      <div className={styles.stepContent}>
        <div className={styles.stepHeader}>
          <div className={styles.transitionBadges}>
            {fromLabel !== undefined && (
              <>
                <Badge variant="outline" size="xs" tone="neutral">
                  {fromLabel}
                </Badge>
                <Icon icon={ArrowRight} size="xs" tone="muted" />
              </>
            )}
            <Badge
              variant={active ? 'solid' : 'outline'}
              size="xs"
              tone={active ? 'accent' : tone}
            >
              {label}
            </Badge>
          </div>

          <div className={styles.metaGroup}>
            {duration !== undefined && (
              <Badge variant="counter" size="xs" tone="neutral">
                {duration}
              </Badge>
            )}
            {timestamp !== undefined && (
              <Text as="time" variant="mono" tone="muted" className={styles.timestamp}>
                {timestamp}
              </Text>
            )}
          </div>
        </div>

        {description !== undefined && (
          <Text as="p" variant="caption" tone="secondary" className={styles.description}>
            {description}
          </Text>
        )}
      </div>
    </li>
  );
}
