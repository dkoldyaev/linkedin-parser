import React from 'react';
import { Layers, Trash2, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';
import { Button, Icon, Text, Badge } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { BASE_STATUSES } from '../constants/columns';
import type { BoardColumn } from '../types/models';

export interface SettingsColumnRowProps {
  col: BoardColumn;
  index: number;
  total: number;
  onMoveColumn: (index: number, direction: number) => void;
  onEditColumn: (col: BoardColumn) => void;
  onDeleteColumn: (col: BoardColumn) => void;
}

function isBaseColumn(col: BoardColumn): boolean {
  if (col.is_base || col.system_role) return true;
  return BASE_STATUSES.includes(col.id);
}

function getColumnRowStyle(color?: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 'var(--ui-space-2) var(--ui-space-3)',
    background: 'var(--ui-bg-subtle)',
    border: '1px solid var(--ui-border-subtle)',
    borderLeft: `4px solid ${color || '#2563eb'}`,
  };
}

const LAYERS_ICON = <Icon icon={Layers} size="2xs" />;
const UP_ICON = <Icon icon={ArrowUp} size="xs" />;
const DOWN_ICON = <Icon icon={ArrowDown} size="xs" />;
const EDIT_ICON = <Icon icon={Edit2} size="xs" />;
const TRASH_ICON = <Icon icon={Trash2} size="xs" />;

export default function SettingsColumnRow({
  col,
  index,
  total,
  onMoveColumn,
  onEditColumn,
  onDeleteColumn,
}: SettingsColumnRowProps): React.ReactElement {
  const { t } = useTranslation();
  const isBase = isBaseColumn(col);

  return (
    <div style={getColumnRowStyle(col.color)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
        <Text variant="body" weight="medium">
          {t(`kanban.columns.${col.id}`)}
        </Text>
        {isBase && (
          <Badge variant="subtle" size="xs">
            {t('kanban.base_column')}
          </Badge>
        )}
        {col.has_lanes && (
          <Badge variant="outline" size="xs" tone="accent" icon={LAYERS_ICON}>
            {t('kanban.stages_badge')}
          </Badge>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-1)' }}>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={index === 0}
          onClick={() => onMoveColumn(index, -1)}
          title={t('kanban.move_up')}
          aria-label={t('kanban.move_up')}
        >
          {UP_ICON}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          disabled={index === total - 1}
          onClick={() => onMoveColumn(index, 1)}
          title={t('kanban.move_down')}
          aria-label={t('kanban.move_down')}
        >
          {DOWN_ICON}
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEditColumn(col)}
          title={t('kanban.edit_column')}
          aria-label={t('kanban.edit_column')}
        >
          {EDIT_ICON}
        </Button>
        {!isBase && (
          <Button
            variant="ghost"
            size="icon-xs"
            tone="danger"
            onClick={() => onDeleteColumn(col)}
            title={t('kanban.delete_column')}
            aria-label={t('kanban.delete_column')}
          >
            {TRASH_ICON}
          </Button>
        )}
      </div>
    </div>
  );
}
