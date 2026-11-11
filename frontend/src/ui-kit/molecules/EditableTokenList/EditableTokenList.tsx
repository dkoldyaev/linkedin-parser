import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge, type BadgeTone, Button, Icon, Input, Label, Text } from '../../atoms';
import { useBlueprintGrid } from '../../hooks';
import { cn } from '../../utils';
import styles from './EditableTokenList.module.css';

export interface EditableTokenListProps {
  readonly label?: React.ReactNode;
  readonly tokens: readonly string[];
  readonly onAddToken?: (token: string) => void;
  readonly onRemoveToken?: (token: string, index: number) => void;
  readonly tone?: BadgeTone;
  readonly placeholder?: string;
  readonly addButtonLabel?: string;
  readonly emptyMessage?: string;
  readonly readOnly?: boolean;
  readonly className?: string;
}

/**
 * EditableTokenList molecule replacing the 3x duplicated token editor in VacancyModal and AdminPage.
 * Composed strictly from Label, Badge, Input, Button, Icon, and Text atoms.
 */
export function EditableTokenList({
  label,
  tokens,
  onAddToken,
  onRemoveToken,
  tone = 'neutral',
  placeholder = 'Add token...',
  addButtonLabel = 'Add',
  emptyMessage = 'No tokens configured',
  readOnly = false,
  className,
}: EditableTokenListProps): React.ReactElement {
  const [draftValue, setDraftValue] = useState<string>('');
  const containerRef = useBlueprintGrid<HTMLDivElement>([tokens.length]);

  const handleCommit = () => {
    const trimmed = draftValue.trim();
    if (trimmed.length === 0 || !onAddToken) {
      return;
    }
    onAddToken(trimmed);
    setDraftValue('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleCommit();
    }
  };

  return (
    <div ref={containerRef} className={cn(styles.container, className)}>
      {label !== undefined && (
        <div className={styles.header}>
          <Label>{label}</Label>
          <Text variant="mono" tone="muted">
            {tokens.length}
          </Text>
        </div>
      )}
      <div data-bp-snap="" className={styles.tokens}>
        {tokens.length === 0 ? (
          <Text variant="caption" tone="muted">
            {emptyMessage}
          </Text>
        ) : (
          tokens.map((token, index) => (
            <Badge
              key={`${token}-${index}`}
              tone={tone}
              onRemove={
                !readOnly && onRemoveToken !== undefined
                  ? () => onRemoveToken(token, index)
                  : undefined
              }
              removeLabel={`Remove ${token}`}
            >
              {token}
            </Badge>
          ))
        )}
      </div>
      {!readOnly && onAddToken !== undefined && (
        <div className={styles.addRow}>
          <Input
            size="sm"
            mono
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={typeof label === 'string' ? `Add to ${label}` : placeholder}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCommit}
            disabled={draftValue.trim().length === 0}
            startIcon={<Icon icon={Plus} size="xs" />}
          >
            {addButtonLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
