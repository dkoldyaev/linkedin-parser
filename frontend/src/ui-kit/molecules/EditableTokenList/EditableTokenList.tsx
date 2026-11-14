import React, { useEffect, useRef, useState } from 'react';
import { Plus, Tag } from 'lucide-react';
import { Badge, Button, Icon, Input, Label, type BadgeTone } from '../../atoms';
import { useBlueprintGrid } from '../../hooks';
import { cn } from '../../utils';
import styles from './EditableTokenList.module.css';

export interface EditableTokenListProps {
  readonly label?: React.ReactNode;
  readonly value?: readonly string[];
  /** @deprecated use `value` */
  readonly tokens?: readonly string[];
  readonly onChange?: (nextValues: readonly string[]) => void;
  /**
   * Controlled boolean enabling the inline token input at the end of the token list.
   */
  readonly addMode?: boolean;
  readonly onAddModeChange?: (addMode: boolean) => void;
  readonly placeholder?: string;
  readonly removeLabelPrefix?: string;
  readonly showTagIcon?: boolean;
  readonly readOnly?: boolean;
  readonly autoFocusOnAddMode?: boolean;
  readonly tone?: BadgeTone;
  readonly className?: string;
}

/**
 * EditableTokenList molecule matching the live `.editable-token-list` in VacancyModal.
 * Simple controlled component via `value` (or `tokens`) and `onChange`.
 * Aligns every token row and inline input to the 32px Blueprint grid so toggling `addMode`
 * never causes a height jump, and tokens never stick together between lines.
 */
export function EditableTokenList({
  label,
  value,
  tokens,
  onChange,
  addMode = false,
  onAddModeChange,
  placeholder = 'Добавить технологию...',
  removeLabelPrefix = 'Удалить',
  showTagIcon = false,
  readOnly = false,
  autoFocusOnAddMode = false,
  tone,
  className,
}: EditableTokenListProps): React.ReactElement {
  const currentTokens = value ?? tokens ?? [];
  const [draftValue, setDraftValue] = useState('');

  const containerRef = useBlueprintGrid<HTMLDivElement>([
    currentTokens.length,
    addMode,
  ]);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prevAddModeRef = useRef<boolean>(addMode);

  useEffect(() => {
    if (
      addMode &&
      (!prevAddModeRef.current || autoFocusOnAddMode) &&
      inputRef.current
    ) {
      inputRef.current.focus();
    }
    prevAddModeRef.current = addMode;
  }, [addMode, autoFocusOnAddMode]);

  const commitRawItems = (raw: string) => {
    const items = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    const uniqueAdded = Array.from(new Set(items)).filter(
      (item) => !currentTokens.includes(item)
    );
    if (uniqueAdded.length === 0) {
      return;
    }
    const nextTokens = [...currentTokens, ...uniqueAdded];
    onChange?.(nextTokens);
  };

  const handleRemove = (index: number) => {
    const nextTokens = currentTokens.filter((_item, idx) => idx !== index);
    onChange?.(nextTokens);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value;
    if (nextValue.includes(',')) {
      const parts = nextValue.split(',');
      const remainder = parts.pop() ?? '';
      setDraftValue(remainder);
      commitRawItems(parts.join(','));
    } else {
      setDraftValue(nextValue);
    }
  };

  const handleInputBlur = () => {
    if (draftValue.trim().length > 0) {
      commitRawItems(draftValue);
    }
    setDraftValue('');
    if (onAddModeChange) {
      onAddModeChange(false);
    }
  };

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (draftValue.trim().length > 0) {
        commitRawItems(draftValue);
      }
      setDraftValue('');
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setDraftValue('');
      if (onAddModeChange) {
        onAddModeChange(false);
      }
    }
  };

  const isEditing = !readOnly && addMode;

  return (
    <div ref={containerRef} className={cn(styles.container, className)}>
      {label !== undefined && (
        <div className={styles.header}>
          <Label className={styles.label}>{label}</Label>
          {!readOnly && onAddModeChange !== undefined && (
            <Button
              variant="ghost"
              size="icon-sm"
              className={styles.addBtn}
              onClick={() => onAddModeChange(true)}
              title={placeholder}
              aria-label={placeholder}
            >
              <Icon icon={Plus} size="xs" />
            </Button>
          )}
        </div>
      )}
      {(currentTokens.length > 0 || isEditing) && (
        <div className={styles.tokenList}>
          {currentTokens.map((token, index) => (
            <div key={`${token}-${index}`} className={styles.tokenItem}>
              <Badge
                variant="chip"
                tone={tone ?? 'neutral'}
                icon={showTagIcon ? <Tag size={11} aria-hidden="true" /> : undefined}
                onRemove={!readOnly ? () => handleRemove(index) : undefined}
                removeLabel={`${removeLabelPrefix} ${token}`}
              >
                {token}
              </Badge>
            </div>
          ))}
          {isEditing && (
            <Input
              ref={inputRef}
              type="text"
              mono
              className={styles.tokenInput}
              aria-label={placeholder}
              placeholder={placeholder}
              value={draftValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleInputKeyDown}
              autoFocus={autoFocusOnAddMode}
            />
          )}
        </div>
      )}
    </div>
  );
}
