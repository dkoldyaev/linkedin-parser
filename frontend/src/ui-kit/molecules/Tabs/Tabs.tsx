import React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { useBlueprintGrid } from '../../hooks';
import { cn } from '../../utils';
import styles from './Tabs.module.css';

export interface TabItem {
  readonly value: string;
  readonly label: React.ReactNode;
  readonly count?: number;
  readonly icon?: React.ReactNode;
  readonly disabled?: boolean;
  readonly content?: React.ReactNode;
}

export interface TabsProps {
  readonly value?: string;
  readonly defaultValue?: string;
  readonly onValueChange?: (value: string) => void;
  readonly items: readonly TabItem[];
  readonly ariaLabel?: string;
  readonly className?: string;
  readonly listClassName?: string;
  readonly contentClassName?: string;
}

/**
 * Accessible Tabs molecule powered by `@radix-ui/react-tabs` with full keyboard arrow-key navigation
 * and 32px Blueprint grid width quantization (`useBlueprintGrid`).
 */
export function Tabs({
  value,
  defaultValue,
  onValueChange,
  items,
  ariaLabel,
  className,
  listClassName,
  contentClassName,
}: TabsProps): React.ReactElement {
  const rootRef = useBlueprintGrid<HTMLDivElement>([items.length]);

  const resolvedDefault =
    defaultValue !== undefined
      ? defaultValue
      : items.length > 0
        ? items[0].value
        : undefined;

  return (
    <TabsPrimitive.Root
      ref={rootRef}
      value={value}
      defaultValue={resolvedDefault}
      onValueChange={onValueChange}
      className={cn(styles.root, className)}
    >
      <TabsPrimitive.List
        aria-label={ariaLabel}
        className={cn(styles.list, listClassName)}
      >
        {items.map((item) => (
          <TabsPrimitive.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            data-bp-snap-width=""
            className={styles.trigger}
          >
            {item.icon !== undefined && (
              <span className={styles.iconSlot} aria-hidden="true">
                {item.icon}
              </span>
            )}
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className={styles.countBadge}>{item.count}</span>
            )}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>

      {items.map(
        (item) =>
          item.content !== undefined && (
            <TabsPrimitive.Content
              key={item.value}
              value={item.value}
              className={cn(styles.content, contentClassName)}
            >
              {item.content}
            </TabsPrimitive.Content>
          )
      )}
    </TabsPrimitive.Root>
  );
}
