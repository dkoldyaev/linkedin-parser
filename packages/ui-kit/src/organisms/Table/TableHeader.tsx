import React from 'react';
import {
  Badge,
  StatusDot,
  Text,
  type StatusDotPalette,
  type StatusDotTone,
} from '../../atoms';
import { cn } from '../../utils';
import styles from './Table.module.css';

export interface TableHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly index?: string | number;
  readonly indicatorColor?: StatusDotPalette | string;
  readonly indicatorTone?: StatusDotTone;
  readonly indicatorStyle?: React.CSSProperties;
  readonly title?: React.ReactNode;
  readonly badge?: React.ReactNode;
  readonly actions?: React.ReactNode;
  readonly size?: 'sm' | 'md';
  readonly children?: React.ReactNode;
  readonly className?: string;
}

const PALETTE_SET = new Set(['slate', 'blue', 'purple', 'emerald', 'amber', 'rose', 'cyan', 'indigo']);

/**
 * Flex table header for columns or table headers on the 32px blueprint grid.
 * Composes StatusDot, Text, and Badge atoms. Supports arbitrary indicator colors and styles.
 */
export function TableHeader({
  index,
  indicatorColor,
  indicatorTone,
  indicatorStyle,
  title,
  badge,
  actions,
  size = 'sm',
  children,
  className,
  ...restProps
}: TableHeaderProps): React.ReactElement {
  const isPalette = typeof indicatorColor === 'string' && PALETTE_SET.has(indicatorColor);
  const palette = isPalette ? (indicatorColor as StatusDotPalette) : undefined;
  const customColor = indicatorColor && !isPalette ? indicatorColor : undefined;

  const dotRef = React.useRef<HTMLSpanElement | null>(null);
  React.useEffect(() => {
    if (dotRef.current && indicatorStyle) {
      Object.assign(dotRef.current.style, indicatorStyle);
    }
  }, [indicatorStyle]);

  return (
    <div
      role="columnheader"
      className={cn(
        styles.header,
        size === 'md' ? styles.headerSizeMd : styles.headerSizeSm,
        className
      )}
      {...restProps}
    >
      {children !== undefined ? (
        children
      ) : (
        <>
          <div className={styles.headerTitleGroup}>
            {index !== undefined && (
              <Text as="span" variant="mono" weight="semibold" tone="accent" className={styles.headerIndex}>
                {index}
              </Text>
            )}
            {(indicatorColor !== undefined || indicatorTone !== undefined || indicatorStyle !== undefined) && (
              <StatusDot
                ref={dotRef}
                palette={palette}
                tone={indicatorTone}
                color={customColor}
                size="md"
                className={styles.headerDot}
              />
            )}
            {title !== undefined && (
              <Text
                as="span"
                variant="mono-label"
                weight="semibold"
                tone="primary"
                truncate
                className={styles.headerTitle}
              >
                {title}
              </Text>
            )}
            {badge !== undefined && (
              <Badge variant="counter" size="xs" tone="neutral">
                {badge}
              </Badge>
            )}
          </div>
          {actions !== undefined && (
            <div className={styles.headerActions}>{actions}</div>
          )}
        </>
      )}
    </div>
  );
}
