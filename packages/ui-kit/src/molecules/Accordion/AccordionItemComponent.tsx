import React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Icon, Text } from '../../atoms';
import { cn } from '../../utils';
import { useAccordionContext } from './AccordionContext';
import styles from './Accordion.module.css';

export interface AccordionItemProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title' | 'content'> {
  readonly id: string;
  readonly title: React.ReactNode;
  readonly content?: React.ReactNode;
  readonly actionLabel?: React.ReactNode;
  readonly bullet?: boolean | React.ReactNode;
  readonly disabled?: boolean;
}

export function AccordionItemComponent({
  id,
  title,
  content,
  actionLabel,
  bullet: itemBullet,
  disabled = false,
  className,
  children,
  ...rest
}: AccordionItemProps): React.ReactElement {
  const { activeExpandedIds, toggleItem, defaultActionLabel, bullet: defaultBullet } = useAccordionContext();

  const isExpanded = activeExpandedIds.includes(id);
  const hasContent = (content !== undefined && content !== null) || children !== undefined;
  const showBullet = itemBullet !== undefined ? itemBullet : defaultBullet;
  const actionText = actionLabel ?? defaultActionLabel;

  const handleToggle = () => {
    if (disabled || !hasContent) {
      return;
    }
    toggleItem(id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || !hasContent) {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div
      className={cn(
        styles.item,
        disabled && styles.itemDisabled,
        isExpanded && styles.itemExpanded,
        className
      )}
      {...rest}
    >
      <div
        data-ui-snap
        className={cn(
          styles.header,
          disabled && styles.headerDisabled,
          !hasContent && styles.headerStatic
        )}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role={hasContent && !disabled ? 'button' : undefined}
        tabIndex={hasContent && !disabled ? 0 : undefined}
        aria-expanded={hasContent && !disabled ? isExpanded : undefined}
        aria-disabled={disabled ? true : undefined}
      >
        <div className={styles.titleGroup}>
          {showBullet && (
            <Text as="span" variant="body-sm" weight="bold" tone="secondary" className={styles.bullet} aria-hidden>
              {typeof showBullet === 'boolean' ? '•' : showBullet}
            </Text>
          )}
          <Text as="div" variant="body-sm" tone="primary" className={styles.title}>
            {title}
          </Text>
        </div>

        {hasContent && (
          <span className={styles.actionButton} aria-hidden>
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
          aria-label={typeof title === 'string' ? title : undefined}
        >
          {content ?? children}
        </div>
      )}
    </div>
  );
}
