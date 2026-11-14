import React, { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  Badge,
  Button,
  Icon,
  Input,
  Label,
  Text,
  type BadgeTone,
} from '../../atoms';
import { useControllableState } from '../../hooks';
import { cn } from '../../utils';
import styles from './TokenList.module.css';

export type TokenListMode = 'readonly' | 'selectable' | 'editable';

export interface TokenListItem {
  readonly id?: string;
  readonly label: string;
  readonly count?: number;
  readonly tone?: BadgeTone;
}

export interface TokenListProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * Mode of the token list:
   * - 'readonly': displays static chips/tags
   * - 'selectable': chips toggle active state on click
   * - 'editable': supports adding new tokens and removing existing tokens
   */
  readonly mode?: TokenListMode;
  readonly label?: React.ReactNode;
  readonly tokens?: readonly string[];
  readonly defaultTokens?: readonly string[];
  readonly onChange?: (tokens: string[]) => void;
  readonly items?: readonly TokenListItem[];
  readonly selectedTokens?: readonly string[];
  readonly defaultSelectedTokens?: readonly string[];
  readonly onToggleToken?: (token: string) => void;
  readonly onAddToken?: (token: string) => void;
  readonly onRemoveToken?: (token: string) => void;
  readonly variant?: 'chip' | 'tag';
  readonly size?: 'xs' | 'sm' | 'md';
  readonly prefix?: string;
  readonly maxVisible?: number;
  readonly placeholder?: string;
  readonly addLabel?: string;
  readonly removeLabelPrefix?: string;
  readonly emptyText?: React.ReactNode;
  readonly disabled?: boolean;
  readonly allowDuplicates?: boolean;
  /**
   * Controls whether the inline add input is currently open (when controlled externally).
   */
  readonly isAdding?: boolean;
  readonly onAddingChange?: (adding: boolean) => void;
  readonly hideHeaderAddButton?: boolean;
}

/**
 * TokenList molecule.
 * Unified token/tag/chip list supporting 'readonly', 'selectable', and 'editable' modes.
 * Composes Badge, Button, Input, Label, Icon, and Text atoms on the 32px Blueprint grid.
 */
export function TokenList({
  mode = 'readonly',
  label,
  tokens: controlledTokens,
  defaultTokens = [],
  onChange,
  items,
  selectedTokens: controlledSelected,
  defaultSelectedTokens = [],
  onToggleToken,
  onAddToken,
  onRemoveToken,
  variant = 'chip',
  size = 'sm',
  prefix,
  maxVisible,
  placeholder = 'New item...',
  addLabel = 'Add item',
  removeLabelPrefix = 'Remove',
  emptyText = 'No items',
  disabled = false,
  allowDuplicates = false,
  isAdding: controlledAdding,
  onAddingChange,
  hideHeaderAddButton = false,
  className,
  ...rest
}: TokenListProps): React.ReactElement {
  const [tokenValues, setTokenValues] = useControllableState<readonly string[]>({
    value: controlledTokens,
    defaultValue: defaultTokens,
    onChange: onChange ? (next) => onChange([...next]) : undefined,
  });

  const [selectedValues, setSelectedValues] = useControllableState<readonly string[]>({
    value: controlledSelected,
    defaultValue: defaultSelectedTokens,
    onChange: undefined,
  });

  const [isAddingOpen, setIsAddingOpen] = useControllableState<boolean>({
    value: controlledAdding,
    defaultValue: false,
    onChange: onAddingChange,
  });

  const [draft, setDraft] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const normalizedItems: readonly TokenListItem[] =
    items ??
    tokenValues.map((token) => ({
      id: token,
      label: token,
    }));

  const isEditable = mode === 'editable' && !disabled;
  const isSelectable = mode === 'selectable' && !disabled;

  const visibleItems =
    maxVisible !== undefined && maxVisible > 0 && !isExpanded
      ? normalizedItems.slice(0, maxVisible)
      : normalizedItems;

  const hiddenCount =
    maxVisible !== undefined && maxVisible > 0 && !isExpanded
      ? Math.max(0, normalizedItems.length - maxVisible)
      : 0;

  const commitAdd = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setIsAddingOpen(false);
      setDraft('');
      return;
    }

    const exists = tokenValues.some(
      (existing) => existing.toLowerCase() === trimmed.toLowerCase()
    );
    if (!allowDuplicates && exists) {
      setDraft('');
      setIsAddingOpen(false);
      return;
    }

    const next = [...tokenValues, trimmed];
    setTokenValues(next);
    onAddToken?.(trimmed);
    setDraft('');
    setIsAddingOpen(false);
  };

  const handleRemove = (labelToRemove: string) => {
    const next = tokenValues.filter((t) => t !== labelToRemove);
    setTokenValues(next);
    onRemoveToken?.(labelToRemove);
  };

  const handleSelectToggle = (tokenLabel: string) => {
    if (!isSelectable) {
      return;
    }
    const exists = selectedValues.includes(tokenLabel);
    const next = exists
      ? selectedValues.filter((item) => item !== tokenLabel)
      : [...selectedValues, tokenLabel];
    setSelectedValues(next);
    onToggleToken?.(tokenLabel);
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitAdd();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setDraft('');
      setIsAddingOpen(false);
    }
  };

  return (
    <div className={cn(styles.root, className)} {...rest}>
      {(label !== undefined || (isEditable && !hideHeaderAddButton)) && (
        <div className={styles.header}>
          {label !== undefined && <Label className={styles.label}>{label}</Label>}
          {isEditable && !hideHeaderAddButton && !isAddingOpen && (
            <Button
              variant="secondary"
              size="icon-sm"
              onClick={() => setIsAddingOpen(true)}
              aria-label={addLabel}
            >
              <Icon icon={Plus} size="xs" />
            </Button>
          )}
        </div>
      )}

      {isEditable && isAddingOpen && (
        <div className={styles.addRow}>
          <Input
            size="sm"
            mono
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={placeholder}
            aria-label={placeholder}
            autoFocus
            wrapperClassName={styles.addInputWrapper}
          />
          <Button
            variant="primary"
            size="icon-sm"
            onClick={commitAdd}
            aria-label="Confirm add"
          >
            <Icon icon={Check} size="xs" />
          </Button>
          <Button
            variant="secondary"
            size="icon-sm"
            onClick={() => {
              setDraft('');
              setIsAddingOpen(false);
            }}
            aria-label="Cancel add"
          >
            <Icon icon={X} size="xs" />
          </Button>
        </div>
      )}

      <div className={styles.list} role="list">
        {visibleItems.length === 0 && !isAddingOpen ? (
          <Text variant="caption" tone="muted">
            {emptyText}
          </Text>
        ) : (
          visibleItems.map((item) => {
            const key = item.id ?? item.label;
            const isSelected = selectedValues.includes(item.label);
            const displayLabel =
              prefix !== undefined && !item.label.startsWith(prefix)
                ? `${prefix}${item.label}`
                : item.label;

            return (
              <div key={key} role="listitem" className={styles.item}>
                <Badge
                  variant="chip"
                  size={size}
                  tone={item.tone ?? (variant === 'tag' ? 'accent' : 'neutral')}
                  interactive={isSelectable}
                  active={isSelected}
                  onClick={
                    isSelectable ? () => handleSelectToggle(item.label) : undefined
                  }
                  onRemove={
                    isEditable ? () => handleRemove(item.label) : undefined
                  }
                  removeLabel={`${removeLabelPrefix} ${item.label}`}
                >
                  <span>{displayLabel}</span>
                  {item.count !== undefined && (
                    <Text as="span" variant="mono" tone="muted" className={styles.count}>
                      {item.count}
                    </Text>
                  )}
                </Badge>
              </div>
            );
          })
        )}

        {hiddenCount > 0 && (
          <Badge
            variant="counter"
            size={size}
            interactive
            onClick={() => setIsExpanded(true)}
          >
            +{hiddenCount}
          </Badge>
        )}
      </div>
    </div>
  );
}
