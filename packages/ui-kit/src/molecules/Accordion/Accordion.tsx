import React, { forwardRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Icon, Text } from '../../atoms';
import { useBlueprintGrid, useControllableState } from '../../hooks';
import { cn } from '../../utils';
import styles from './Accordion.module.css';

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
  readonly items: readonly AccordionItem[];
  readonly expandedIds?: readonly string[];
  readonly defaultExpandedIds?: readonly string[];
  readonly onToggleItem?: (id: string, expanded: boolean) => void;
  readonly defaultActionLabel?: string;
  readonly bullet?: boolean;
  readonly multiple?: boolean;
}

/**
 * Accordion molecule.
 * Context-agnostic collapsible accordion list aligned to the 32px Blueprint grid.
 * Composes Icon and Text atoms and uses useControllableState.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      items,
      expandedIds: controlledExpandedIds,
      defaultExpandedIds,
      onToggleItem,
      defaultActionLabel = 'Details',
      bullet = true,
      multiple = true,
      className,
      ...rest
    },
    ref
  ) {
    const initialExpandedIds =
      defaultExpandedIds ?? items.filter((item) => item.defaultExpanded).map((item) => item.id);

    const [activeExpandedIds, setActiveExpandedIds] = useControllableState<readonly string[]>({
      value: controlledExpandedIds,
      defaultValue: initialExpandedIds,
      onChange: undefined,
    });

    const handleToggle = (itemId: string, itemDisabled?: boolean, hasContent?: boolean) => {
      if (itemDisabled || !hasContent) {
        return;
      }

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

    const handleKeyDown = (
      event: React.KeyboardEvent<HTMLDivElement>,
      itemId: string,
      itemDisabled?: boolean,
      hasContent?: boolean
    ) => {
      if (itemDisabled || !hasContent) {
        return;
      }
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle(itemId, itemDisabled, hasContent);
      }
    };

    const gridRef = useBlueprintGrid<HTMLDivElement>([items, activeExpandedIds]);

    const setMergedRef = (node: HTMLDivElement | null) => {
      gridRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        ref.current = node;
      }
    };

    return (
      <div ref={setMergedRef} className={cn(styles.accordion, className)} {...rest}>
        {items.map((item) => {
          const isExpanded = activeExpandedIds.includes(item.id);
          const hasContent = item.content !== undefined && item.content !== null;
          const showBullet = item.bullet !== undefined ? item.bullet : bullet;
          const actionText = item.actionLabel ?? defaultActionLabel;

          return (
            <div
              key={item.id}
              className={cn(
                styles.item,
                item.disabled && styles.itemDisabled,
                isExpanded && styles.itemExpanded
              )}
            >
              <div
                data-ui-snap
                className={cn(
                  styles.header,
                  item.disabled && styles.headerDisabled,
                  !hasContent && styles.headerStatic
                )}
                onClick={() => handleToggle(item.id, item.disabled, hasContent)}
                onKeyDown={(e) => handleKeyDown(e, item.id, item.disabled, hasContent)}
                role={hasContent && !item.disabled ? 'button' : undefined}
                tabIndex={hasContent && !item.disabled ? 0 : undefined}
                aria-expanded={hasContent && !item.disabled ? isExpanded : undefined}
                aria-disabled={item.disabled ? true : undefined}
              >
                <div className={styles.titleGroup}>
                  {showBullet && (
                    <Text as="span" variant="body-sm" weight="bold" tone="secondary" className={styles.bullet} aria-hidden>
                      {typeof showBullet === 'boolean' ? '•' : showBullet}
                    </Text>
                  )}
                  <Text as="div" variant="body-sm" tone="primary" className={styles.title}>
                    {item.title}
                  </Text>
                </div>

                {hasContent && (
                  <span
                    className={styles.actionButton}
                    aria-hidden
                  >
                    {actionText && (
                      <Text as="span" variant="caption" tone="secondary" className={styles.actionLabel}>
                        {actionText}
                      </Text>
                    )}
                    <Icon
                      icon={isExpanded ? ChevronUp : ChevronDown}
                      size="sm"
                      className={styles.chevron}
                    />
                  </span>
                )}
              </div>

              {isExpanded && hasContent && (
                <div
                  data-ui-snap
                  className={styles.content}
                  role="region"
                  aria-label={typeof item.title === 'string' ? item.title : undefined}
                >
                  {item.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
);
