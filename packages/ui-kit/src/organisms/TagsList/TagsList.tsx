import { Badge, type BadgeSize, type BadgeTone, type BadgeVariant } from '../../atoms';
import React, { useState } from 'react';
import { TagsListInput, type TagsListInputProps } from './TagsListInput';
import { cn } from '../../utils';
import styles from './TagsList.module.css';
import { TokenList } from '../../molecules/TokenList';

export { TagsListInput, type TagsListInputProps };

export interface TagsListProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /** Array of tag strings */
  readonly value: readonly string[];
  /** Callback fired when tags are added or removed */
  readonly onChange?: (nextTags: string[]) => void;
  /** Whether tags can be removed (shows delete 'X' button on each badge) */
  readonly deletable?: boolean;
  /** Whether the inline text input for adding new tags is visible */
  readonly addable?: boolean;
  /** Maximum number of tags visible before truncating into a "+N" counter badge */
  readonly maxVisible?: number;
  /**
   * Character delimiter that immediately splits and creates tags on typing.
   * e.g. "," -> typing "react, typescript" commits items.
   * @default ","
   */
  readonly separator?: string;
  /** Badge visual variant */
  readonly variant?: BadgeVariant;
  /** Badge size preset */
  readonly size?: BadgeSize;
  /** Semantic tone for badges */
  readonly tone?: BadgeTone;
  /** Leading icon for each badge */
  readonly icon?: React.ReactNode;
  /** Input placeholder */
  readonly placeholder?: string;
  /** Callback when input loses focus or cancels */
  readonly onFinishAdd?: () => void;
  readonly className?: string;
}

/**
 * TagsList organism.
 * Manages an editable list of tags/chips rendered inside a TokenList container.
 * Supports removal (`deletable`), inline text addition (`addable`), and typing delimiters (`separator`).
 */
function TagsListBase({
  value = [],
  onChange,
  deletable = false,
  addable = false,
  maxVisible,
  separator = ',',
  variant = 'chip',
  size = 'sm',
  tone = 'neutral',
  icon,
  placeholder = 'Добавить...',
  onFinishAdd,
  className,
  ...rest
}: TagsListProps): React.ReactElement {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddTags = (newParts: readonly string[]) => {
    const next = [...value];
    for (const part of newParts) {
      if (!next.includes(part)) {
        next.push(part);
      }
    }
    onChange?.(next);
  };

  const handleRemove = (tagToRemove: string) => {
    const next = value.filter((t) => t !== tagToRemove);
    onChange?.(next);
  };

  const visibleTags =
    maxVisible !== undefined && maxVisible > 0 && !isExpanded ? value.slice(0, maxVisible) : value;

  const hiddenCount =
    maxVisible !== undefined && maxVisible > 0 && !isExpanded
      ? Math.max(0, value.length - maxVisible)
      : 0;

  return (
    <TokenList className={cn(styles.tagsList, className)} {...rest}>
      {visibleTags.map((tag) => (
        <Badge
          key={tag}
          variant={variant}
          size={size}
          tone={tone}
          icon={icon}
          onRemove={deletable ? () => handleRemove(tag) : undefined}
        >
          {tag}
        </Badge>
      ))}

      {hiddenCount > 0 && (
        <Badge
          variant="counter"
          size={size}
          interactive
          onClick={() => setIsExpanded(true)}
          aria-label={`Show ${hiddenCount} more tags`}
        >
          +{hiddenCount}
        </Badge>
      )}

      {addable && (
        <TagsListInput
          separator={separator}
          placeholder={placeholder}
          onCommit={handleAddTags}
          onCancel={onFinishAdd}
        />
      )}
    </TokenList>
  );
}

export const TagsList = Object.assign(TagsListBase, {
  Input: TagsListInput,
});
