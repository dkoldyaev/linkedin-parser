import { AccordionContext, type AccordionContextValue } from './AccordionContext';
import { AccordionItemComponent, type AccordionItemProps } from './AccordionItemComponent';
import React, { forwardRef, useMemo } from 'react';
import { useBlueprintGrid, useControllableState } from '../../hooks';
import { cn } from '../../utils';
import styles from './Accordion.module.css';

export type { AccordionItemProps };

export interface AccordionItem {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly content?: React.ReactNode;
  readonly actionLabel?: React.ReactNode;
  readonly bullet?: boolean | React.ReactNode;
  readonly disabled?: boolean;
  readonly defaultExpanded?: boolean;
}

export interface AccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly items?: readonly AccordionItem[];
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onToggleItem?: (id: string, expanded: boolean) => void;
  readonly defaultActionLabel?: string;
  readonly bullet?: boolean;
  readonly multiple?: boolean;
  readonly children?: React.ReactNode;
}

/**
 * Accordion molecule.
 * Context-agnostic collapsible accordion list aligned to the 32px Blueprint grid.
 * Supports both declaration via `items` array or composition via `<Accordion.Item>`.
 */
const AccordionBase = forwardRef<HTMLDivElement, AccordionProps>(function Accordion(
  {
    items,
    expandedIds: controlledExpandedIds,
    defaultExpandedIds,
    onToggleItem,
    defaultActionLabel = 'Details',
    bullet = true,
    multiple = true,
    className,
    children,
    ...rest
  },
  ref,
) {
  const initialExpandedIds = useMemo(() => {
    if (defaultExpandedIds) {
      return defaultExpandedIds;
    }
    if (items) {
      return items.filter((item) => item.defaultExpanded).map((item) => item.id);
    }
    return [];
  }, [defaultExpandedIds, items]);

  const [activeExpandedIds, setActiveExpandedIds] = useControllableState<readonly string[]>({
    value: controlledExpandedIds,
    defaultValue: initialExpandedIds,
    onChange: undefined,
  });

  const toggleItem = (itemId: string) => {
    const isCurrentlyExpanded = activeExpandedIds.includes(itemId);
    const nextExpanded = !isCurrentlyExpanded;

    const nextIds = nextExpanded
      ? multiple
        ? [...activeExpandedIds, itemId]
        : [itemId]
      : activeExpandedIds.filter((id) => id !== itemId);

    setActiveExpandedIds(nextIds);
    onToggleItem?.(itemId, nextExpanded);
  };

  const gridRef = useBlueprintGrid<HTMLDivElement>([items, activeExpandedIds, children]);

  const setMergedRef = (node: HTMLDivElement | null) => {
    gridRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  };

  const contextValue: AccordionContextValue = useMemo(
    () => ({
      activeExpandedIds,
      toggleItem,
      defaultActionLabel,
      bullet,
    }),
    [activeExpandedIds, defaultActionLabel, bullet],
  );

  return (
    <AccordionContext.Provider value={contextValue}>
      <div ref={setMergedRef} className={cn(styles.accordion, className)} {...rest}>
        {items !== undefined
          ? items.map((item) => (
              <AccordionItemComponent
                key={item.id}
                id={item.id}
                title={item.title}
                content={item.content}
                actionLabel={item.actionLabel}
                bullet={item.bullet}
                disabled={item.disabled}
              />
            ))
          : children}
      </div>
    </AccordionContext.Provider>
  );
});

export const Accordion = Object.assign(AccordionBase, {
  Item: AccordionItemComponent,
});
