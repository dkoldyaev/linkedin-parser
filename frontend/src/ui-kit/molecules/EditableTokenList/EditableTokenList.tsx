import React, { useEffect, useRef } from 'react';
import { Plus, Tag, X } from 'lucide-react';
import { type BadgeTone, Input, Label } from '../../atoms';
import { useBlueprintGrid, useControllableState } from '../../hooks';
import { cn } from '../../utils';
import styles from './EditableTokenList.module.css';

export interface EditableTokenListProps {
  readonly label?: React.ReactNode;
  readonly tokens: readonly string[];
  readonly onChange?: (nextTokens: string[]) => void;
  readonly onAddToken?: (token: string) => void;
  readonly onAddTokens?: (tokens: string[]) => void;
  readonly onRemoveToken?: (token: string, index: number) => void;
  /**
   * Controlled boolean enabling the inline token input at the end of the token list.
   */
  readonly addMode?: boolean;
  readonly onAddModeChange?: (addMode: boolean) => void;
  readonly inputValue?: string;
  readonly onInputValueChange?: (value: string) => void;
  readonly placeholder?: string;
  readonly removeLabelPrefix?: string;
  readonly lowercaseTokens?: boolean;
  readonly showTagIcon?: boolean;
  readonly readOnly?: boolean;
  readonly autoFocusOnAddMode?: boolean;
  readonly tone?: BadgeTone;
  readonly addButtonLabel?: string;
  readonly emptyMessage?: string;
  readonly className?: string;
}

/**
 * EditableTokenList molecule matching the live `.editable-token-list` in VacancyModal.
 * Controlled via `tokens` and `addMode` (`boolean`), commits tokens immediately when `,` or `Enter`
 * is typed, and aligns every token row and the inline input to the 32px Blueprint grid so toggling
 * `addMode` never causes a height jump.
 */
export function EditableTokenList({
  label,
  tokens,
  onChange,
  onAddToken,
  onAddTokens,
  onRemoveToken,
  addMode = false,
  onAddModeChange,
  inputValue,
  onInputValueChange,
  placeholder = 'Добавить технологию...',
  removeLabelPrefix = 'Удалить',
  lowercaseTokens = false,
  showTagIcon = false,
  readOnly = false,
  autoFocusOnAddMode = false,
  className,
}: EditableTokenListProps): React.ReactElement {
  const [draftValue, setDraftValue] = useControllableState<string>({
    prop: inputValue,
    defaultProp: '',
    onChange: onInputValueChange,
  });

  const containerRef = useBlueprintGrid<HTMLDivElement>([
    tokens.length,
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
      .map((part) => (lowercaseTokens ? part.trim().toLowerCase() : part.trim()))
      .filter(Boolean);
    const uniqueAdded = Array.from(new Set(items)).filter(
      (item) => !tokens.includes(item)
    );
    if (uniqueAdded.length === 0) {
      return;
    }
    const nextTokens = [...tokens, ...uniqueAdded];
    if (onChange) {
      onChange(nextTokens);
    }
    if (onAddTokens) {
      onAddTokens(uniqueAdded);
    }
    if (onAddToken) {
      for (const token of uniqueAdded) {
        onAddToken(token);
      }
    }
  };

  const handleRemove = (token: string, index: number) => {
    if (onChange) {
      onChange(tokens.filter((_item, idx) => idx !== index));
    }
    if (onRemoveToken) {
      onRemoveToken(token, index);
    }
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
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => onAddModeChange(true)}
              title={placeholder}
              aria-label={placeholder}
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      )}
      {(tokens.length > 0 || isEditing) && (
        <div className={styles.tokenList}>
          {tokens.map((token, index) => (
            <span key={`${token}-${index}`} className={styles.token}>
              {showTagIcon && <Tag size={11} aria-hidden="true" />}
              <span>{token}</span>
              {!readOnly && (
                <button
                  type="button"
                  className={styles.tokenRemove}
                  onClick={() => handleRemove(token, index)}
                  aria-label={`${removeLabelPrefix} ${token}`}
                >
                  <X size={12} />
                </button>
              )}
            </span>
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
