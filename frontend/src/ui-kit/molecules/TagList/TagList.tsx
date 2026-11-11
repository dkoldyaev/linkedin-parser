import React, { forwardRef } from 'react';
import { Filter } from 'lucide-react';
import { cn } from '../../utils';
import styles from './TagList.module.css';

export interface TagItem {
  readonly id: string;
  readonly label: string;
  readonly count?: number;
  readonly active?: boolean;
}

export type FilterTag = TagItem;

export interface TagListProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly tags?: readonly TagItem[];
  readonly activeTag?: string;
  readonly onTagSelect?: (tagId: string) => void;
  readonly label?: React.ReactNode;
  readonly showIcon?: boolean;
  readonly children?: React.ReactNode;
}

/**
 * TagList molecule.
 * Displays a horizontal rail of selectable tag chips snapped to the 32px Blueprint grid.
 */
export const TagList = forwardRef<HTMLDivElement, TagListProps>(function TagList(
  {
    tags = [],
    activeTag,
    onTagSelect,
    label = 'Теги:',
    showIcon = true,
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <div
      ref={ref}
      role="toolbar"
      aria-label="Tags"
      className={cn(styles.tagsRail, className)}
      {...rest}
    >
      {(label !== undefined || showIcon) && (
        <div className={styles.tagLabel}>
          {showIcon && <Filter size={12} aria-hidden />}
          {label !== undefined && <span>{label}</span>}
        </div>
      )}
      {tags.map((tag) => {
        const isTagActive =
          tag.active === true || (activeTag !== undefined && activeTag === tag.id);
        const displayLabel =
          tag.label.startsWith('#') || tag.id === '' || tag.id === 'all'
            ? tag.label
            : `#${tag.label}`;
        return (
          <button
            key={tag.id}
            type="button"
            className={cn(styles.tagChip, isTagActive && styles.tagChipActive)}
            onClick={() => onTagSelect?.(tag.id)}
            aria-pressed={isTagActive}
          >
            {displayLabel}
            {tag.count !== undefined ? ` [${tag.count}]` : ''}
          </button>
        );
      })}
      {children}
    </div>
  );
});
