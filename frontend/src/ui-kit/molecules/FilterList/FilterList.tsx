import React, { forwardRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { FilterItem, type FilterItemProps, type FilterOption } from './FilterItem';
import { TagList, type TagItem, type FilterTag } from '../TagList';
import { cn } from '../../utils';
import styles from './FilterList.module.css';

export type { FilterOption, FilterItemProps, TagItem, FilterTag };

export interface FilterDropdownGroup {
  readonly id: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly options: readonly FilterOption[];
  readonly onChange: (value: string) => void;
  readonly title?: string;
}

export interface FilterListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Array of filter items */
  readonly filters?: readonly FilterItemProps[];
  /** Legacy alias for filters */
  readonly dropdowns?: readonly (FilterItemProps | FilterDropdownGroup)[];
  /** Array of tag chips */
  readonly tags?: readonly TagItem[];
  readonly activeTag?: string;
  readonly onTagSelect?: (tagId: string) => void;
  readonly onReset?: () => void;
  readonly resetLabel?: string;
  readonly showReset?: boolean;
  readonly tagsLabel?: string;
  readonly bulkMode?: boolean;
  readonly bulkContent?: React.ReactNode;
  readonly children?: React.ReactNode;
}

/**
 * FilterList (FilterBar) molecule.
 * Snaps to the 32px Blueprint drafting grid (height: 32px), provides horizontal scrolling,
 * filter groups separated by mono slashes ('/'), active underlines, tag chips rail,
 * and a reset action button.
 */
export const FilterList = forwardRef<HTMLDivElement, FilterListProps>(
  function FilterList(
    {
      filters,
      dropdowns,
      tags,
      activeTag,
      onTagSelect,
      onReset,
      resetLabel = 'Сбросить фильтры',
      showReset,
      tagsLabel = 'Теги:',
      bulkMode = false,
      bulkContent,
      className,
      children,
      ...rest
    },
    ref
  ) {
    if (bulkMode && bulkContent !== undefined) {
      return (
        <div
          ref={ref}
          role="toolbar"
          aria-label="Bulk actions toolbar"
          className={cn(styles.filterBar, styles.bulkMode, className)}
          {...rest}
        >
          {bulkContent}
        </div>
      );
    }

    const items = filters ?? dropdowns ?? [];
    const hasFilters = items.length > 0;
    const hasTags = tags !== undefined && tags.length > 0;

    const hasActiveFilter = items.some(
      (d) => d.value !== '' && d.value !== undefined
    );
    const hasActiveTag =
      hasTags &&
      tags.some((t) => t.active === true || (activeTag !== undefined && activeTag === t.id));

    const shouldShowReset =
      showReset !== undefined ? showReset : Boolean(onReset && (hasActiveFilter || hasActiveTag));

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Filters"
        className={cn(styles.filterBar, className)}
        {...rest}
      >
        {/* Filter Items */}
        {hasFilters &&
          items.map((filter, index) => {
            const key = filter.id ?? filter.placeholder ?? `filter-${index}`;
            return (
              <React.Fragment key={key}>
                {index > 0 && <span className={styles.separator} aria-hidden>/</span>}
                <FilterItem {...filter} />
              </React.Fragment>
            );
          })}

        {/* Divider if both filters and tags are present */}
        {hasFilters && hasTags && <div className={styles.divider} aria-hidden />}

        {/* Tags Rail */}
        {hasTags && (
          <TagList
            tags={tags}
            activeTag={activeTag}
            onTagSelect={onTagSelect}
            label={tagsLabel}
          />
        )}

        {/* Composable Children slot */}
        {children}

        {/* Reset button */}
        {shouldShowReset && onReset && (
          <button
            type="button"
            className={styles.resetButton}
            onClick={onReset}
            title={resetLabel}
          >
            <RotateCcw size={11} aria-hidden />
            <span>{resetLabel}</span>
          </button>
        )}
      </div>
    );
  }
);

/**
 * FilterBar alias for semantic compatibility.
 */
export const FilterBar = FilterList;
