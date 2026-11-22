'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';
import {
  Button,
  Icon,
  Badge,
  Input,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export interface HomeBulkActionsBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  bulkTagInput: string;
  onBulkTagInputChange: (val: string) => void;
  onBulkAddTag: () => void;
  onBulkRemoveTag: () => void;
  onBulkDeleteSelected: () => void;
}

const CLOSE_ICON = <Icon icon={X} size="xs" />;
const TRASH_ICON = <Icon icon={Trash2} size="xs" />;

export default function HomeBulkActionsBar({
  selectedCount,
  onClearSelection,
  bulkTagInput,
  onBulkTagInputChange,
  onBulkAddTag,
  onBulkRemoveTag,
  onBulkDeleteSelected,
}: HomeBulkActionsBarProps) {
  const { t } = useTranslation();

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        boxSizing: 'border-box',
        gap: 'var(--ui-space-3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-3)' }}>
        <Badge variant="solid" tone="primary" size="sm">
          {t('kanban.selected_count', { count: selectedCount })}
        </Badge>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClearSelection}
          title={t('kanban.clear_selection')}
          aria-label={t('kanban.clear_selection')}
        >
          {CLOSE_ICON}
        </Button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <div style={{ width: 'calc(4 * var(--ui-grid-cell))' }}>
          <Input
            size="sm"
            placeholder={t('kanban.bulk_tag_placeholder')}
            value={bulkTagInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onBulkTagInputChange(e.target.value)}
          />
        </div>
        <Button variant="secondary" size="sm" onClick={onBulkAddTag}>
          {t('kanban.bulk_add_tag')}
        </Button>
        <Button variant="secondary" size="sm" tone="danger" onClick={onBulkRemoveTag}>
          {t('kanban.bulk_remove_tag')}
        </Button>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--ui-pixel-line)', margin: '0 var(--ui-space-1)' }} />
        <Button
          variant="ghost"
          size="icon-sm"
          tone="danger"
          onClick={onBulkDeleteSelected}
          title={t('kanban.bulk_delete_title')}
          aria-label={t('kanban.bulk_delete_title')}
        >
          {TRASH_ICON}
        </Button>
      </div>
    </div>
  );
}
