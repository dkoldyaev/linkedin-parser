import React, { forwardRef } from 'react';
import { ChevronDown, Filter, RotateCcw } from 'lucide-react';
import { cn } from '../../utils';
import styles from './FilterList.module.css';

export interface FilterOption {
  readonly value: string;
  readonly label: string;
  readonly count?: number;
}

export interface FilterDropdownGroup {
  readonly id: string;
  readonly value: string;
  readonly placeholder?: string;
  readonly options: readonly FilterOption[];
  readonly onChange: (value: string) => void;
  readonly title?: string;
}

export interface FilterTag {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
  readonly active?: boolean;
}

export interface FilterListProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly dropdowns?: readonly FilterDropdownGroup[];
  readonly tags?: readonly FilterTag[];
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
 * dropdown filter groups separated by mono slashes ('/'), active underlines, tag chips,
 * and a reset action button.
 */
export const FilterList = forwardRef<HTMLDivElement, FilterListProps>(
  function FilterList(
    {
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

    const hasDropdowns = dropdowns !== undefined && dropdowns.length > 0;
    const hasTags = tags !== undefined && tags.length > 0;

    const hasActiveDropdown =
      hasDropdowns && dropdowns.some((d) => d.value !== '' && d.value !== undefined);
    const hasActiveTag =
      hasTags &&
      tags.some((t) => t.active === true || (activeTag !== undefined && activeTag === t.id));

    const shouldShowReset =
      showReset !== undefined ? showReset : Boolean(onReset && (hasActiveDropdown || hasActiveTag));

    return (
      <div
        ref={ref}
        role="region"
        aria-label="Filters"
        className={cn(styles.filterBar, className)}
        {...rest}
      >
        {/* Dropdown Groups */}
        {hasDropdowns &&
          dropdowns.map((group) => {
            const isActive = group.value !== '' && group.value !== undefined;
            return (
              <div key={group.id} className={styles.filterGroup}>
                <div className={styles.selectWrapper}>
                  <select
                    className={cn(styles.select, isActive && styles.selectActive)}
                    value={group.value}
                    onChange={(e) => group.onChange(e.target.value)}
                    title={group.title ?? group.placeholder}
                    aria-label={group.title ?? group.placeholder ?? group.id}
                  >
                    {group.placeholder !== undefined && (
                      <option value="">{group.placeholder}</option>
                    )}
                    {group.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                        {opt.count !== undefined ? ` [${opt.count}]` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={11} className={styles.chevron} aria-hidden />
                </div>
              </div>
            );
          })}

        {/* Divider if both dropdowns and tags are present */}
        {hasDropdowns && hasTags && <div className={styles.divider} aria-hidden />}

        {/* Tags Rail */}
        {hasTags && (
          <div className={styles.tagsRail}>
            {tagsLabel && (
              <div className={styles.tagLabel}>
                <Filter size={12} aria-hidden />
                <span>{tagsLabel}</span>
              </div>
            )}
            {tags.map((tag) => {
              const isTagActive =
                tag.active === true || (activeTag !== undefined && activeTag === tag.id);
              return (
                <button
                  key={tag.id}
                  type="button"
                  className={cn(styles.tagChip, isTagActive && styles.tagChipActive)}
                  onClick={() => onTagSelect?.(tag.id)}
                >
                  {tag.label.startsWith('#') || tag.id === '' || tag.id === 'all'
                    ? tag.label
                    : `#${tag.label}`}
                  {tag.count !== undefined ? ` [${tag.count}]` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Children slot */}
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
