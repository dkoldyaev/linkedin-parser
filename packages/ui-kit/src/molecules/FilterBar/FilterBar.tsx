import { Badge, Text } from '../../atoms';
import { FilterBarReset, type FilterBarResetProps } from './FilterBarReset';
import { Select, type SelectOption } from '../Select';
import { cn } from '../../utils';
import React from 'react';
import styles from './FilterBar.module.css';
import { TokenList } from '../TokenList';

export { FilterBarReset, type FilterBarResetProps };

export interface FilterBarTagItem {
  readonly label: string;
  readonly count?: number;
}

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
  readonly tags?: readonly FilterBarTagItem[];
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
 * Composes Select, TokenList, Text separators, and Reset Button on the 32px Blueprint grid.
 */
function FilterBarBase({
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
  children,
  ...rest
}: FilterBarProps): React.ReactElement {
  const computedHasActive =
    hasActiveFilters ?? (selects.some((s) => s.value !== '') || selectedTags.length > 0);

  return (
    <div role="toolbar" aria-label="Filters" className={cn(styles.filterBar, className)} {...rest}>
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
          <TokenList className={styles.tagList}>
            {(maxVisibleTags !== undefined ? tags.slice(0, maxVisibleTags) : tags).map((tag) => {
              const isSelected = selectedTags.includes(tag.label);
              const labelText = tagPrefix !== undefined ? `${tagPrefix}${tag.label}` : tag.label;
              return (
                <Badge
                  key={tag.label}
                  variant="chip"
                  size="xs"
                  tone={isSelected ? 'accent' : 'neutral'}
                  interactive
                  active={isSelected}
                  onClick={() => onToggleTag?.(tag.label)}
                >
                  {tag.count !== undefined ? `${labelText} (${tag.count})` : labelText}
                </Badge>
              );
            })}
          </TokenList>
        )}

        {children}
      </div>

      <div className={styles.rightActions}>
        {computedHasActive && onReset !== undefined && (
          <FilterBarReset onReset={onReset} label={resetLabel} />
        )}
        {actionsSlot}
      </div>
    </div>
  );
}

export const FilterBar = Object.assign(FilterBarBase, {
  Reset: FilterBarReset,
});
