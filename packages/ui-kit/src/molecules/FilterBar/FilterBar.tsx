import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Button, Icon, Text } from '../../atoms';
import { Select, type SelectOption } from '../Select';
import { TokenList, type TokenListItem } from '../TokenList';
import { cn } from '../../utils';
import styles from './FilterBar.module.css';

export interface FilterBarSelectConfig {
  readonly id: string;
  readonly ariaLabel?: string;
  readonly placeholder?: string;
  readonly value: string;
  readonly options: readonly SelectOption[];
  readonly onChange: (value: string) => void;
}

export interface FilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly selects?: readonly FilterBarSelectConfig[];
  readonly tags?: readonly TokenListItem[];
  readonly selectedTags?: readonly string[];
  readonly onToggleTag?: (tag: string) => void;
  readonly tagPrefix?: string;
  readonly maxVisibleTags?: number;
  readonly hasActiveFilters?: boolean;
  readonly onReset?: () => void;
  readonly resetLabel?: string;
  readonly actionsSlot?: React.ReactNode;
}

/**
 * FilterBar molecule.
 * Composes Select (variant="filter"), TokenList (mode="selectable"), Text separators,
 * and a Reset Button on the 32px Blueprint grid.
 */
export function FilterBar({
  selects = [],
  tags = [],
  selectedTags = [],
  onToggleTag,
  tagPrefix,
  maxVisibleTags,
  hasActiveFilters,
  onReset,
  resetLabel = 'Reset',
  actionsSlot,
  className,
  ...rest
}: FilterBarProps): React.ReactElement {
  const computedHasActive =
    hasActiveFilters ??
    (selects.some((s) => s.value !== '') || selectedTags.length > 0);

  return (
    <div
      role="toolbar"
      aria-label="Filters"
      className={cn(styles.filterBar, className)}
      {...rest}
    >
      <div className={styles.controlsGroup}>
        {selects.map((filter, index) => (
          <React.Fragment key={filter.id}>
            {index > 0 && (
              <Text
                as="span"
                variant="mono"
                tone="muted"
                className={styles.separator}
                aria-hidden="true"
              >
                /
              </Text>
            )}
            <Select
              variant="filter"
              value={filter.value}
              onValueChange={filter.onChange}
              options={filter.options}
              placeholder={filter.placeholder}
              ariaLabel={filter.ariaLabel ?? filter.placeholder ?? filter.id}
            />
          </React.Fragment>
        ))}

        {selects.length > 0 && tags.length > 0 && (
          <Text
            as="span"
            variant="mono"
            tone="muted"
            className={styles.separator}
            aria-hidden="true"
          >
            /
          </Text>
        )}

        {tags.length > 0 && (
          <TokenList
            mode="selectable"
            size="xs"
            items={tags}
            selectedTokens={selectedTags}
            onToggleToken={onToggleTag}
            prefix={tagPrefix}
            maxVisible={maxVisibleTags}
            className={styles.tagList}
          />
        )}
      </div>

      <div className={styles.rightActions}>
        {computedHasActive && onReset !== undefined && (
          <Button
            variant="ghost"
            size="sm"
            tone="danger"
            onClick={onReset}
            startIcon={<Icon icon={RotateCcw} size="xs" />}
          >
            {resetLabel}
          </Button>
        )}
        {actionsSlot}
      </div>
    </div>
  );
}
