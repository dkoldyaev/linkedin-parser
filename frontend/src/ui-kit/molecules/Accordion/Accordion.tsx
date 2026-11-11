import React, { forwardRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
 * Renders items with optional bullets, titles, action trigger labels with chevrons,
 * and expandable detail content panels.
 */
export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  function Accordion(
    {
      items,
      expandedIds: controlledExpandedIds,
      defaultExpandedIds,
      onToggleItem,
      defaultActionLabel = 'Обоснование',
      bullet = true,
      multiple = true,
      className,
      ...rest
    },
    ref
  ) {
    const isControlled = controlledExpandedIds !== undefined;
    const [internalExpandedIds, setInternalExpandedIds] = useState<readonly string[]>(() => {
      if (defaultExpandedIds) {
        return defaultExpandedIds;
      }
      return items.filter((item) => item.defaultExpanded).map((item) => item.id);
    });

    const activeExpandedIds = isControlled ? controlledExpandedIds : internalExpandedIds;

    const handleToggle = (itemId: string, itemDisabled?: boolean, hasContent?: boolean) => {
      if (itemDisabled || !hasContent) {
        return;
      }

      const isCurrentlyExpanded = activeExpandedIds.includes(itemId);
      const nextExpanded = !isCurrentlyExpanded;

      let nextIds: readonly string[];
      if (nextExpanded) {
        nextIds = multiple ? [...activeExpandedIds, itemId] : [itemId];
      } else {
        nextIds = activeExpandedIds.filter((id) => id !== itemId);
      }

      if (!isControlled) {
        setInternalExpandedIds(nextIds);
      }
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

    return (
      <div ref={ref} className={cn(styles.accordion, className)} {...rest}>
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
                    <span className={styles.bullet} aria-hidden>
                      {typeof showBullet === 'boolean' ? '•' : showBullet}
                    </span>
                  )}
                  <div className={styles.title}>{item.title}</div>
                </div>

                {hasContent && (
                  <span
                    className={styles.actionButton}
                    aria-hidden
                  >
                    {actionText && <span className={styles.actionLabel}>{actionText}</span>}
                    {isExpanded ? (
                      <ChevronUp size={14} className={styles.chevron} />
                    ) : (
                      <ChevronDown size={14} className={styles.chevron} />
                    )}
                  </span>
                )}
              </div>

              {isExpanded && hasContent && (
                <div className={styles.content} role="region" aria-label={typeof item.title === 'string' ? item.title : undefined}>
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
