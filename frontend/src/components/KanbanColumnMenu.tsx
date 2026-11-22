import React from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import type { BoardColumn } from '../types/models';

export interface KanbanColumnMenuProps {
  col: BoardColumn;
  isBase: boolean;
  isMenuOpen: boolean;
  onToggleMenu: (colId: string) => void;
  onEdit: (col: BoardColumn) => void;
  onDelete: (col: BoardColumn) => void;
}

const MENU_POPOVER_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  right: 0,
  zIndex: 100,
  minWidth: '180px',
  padding: 'var(--ui-space-1)',
  backgroundColor: 'var(--ui-bg-surface)',
  border: '1px solid var(--ui-border-strong)',
  boxShadow: 'var(--ui-shadow-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-1)',
};

const MORE_ICON = <Icon icon={MoreVertical} size="xs" />;
const EDIT_ICON = <Icon icon={Edit2} size="xs" tone="accent" />;
const TRASH_ICON = <Icon icon={Trash2} size="xs" />;

export default function KanbanColumnMenu({
  col,
  isBase,
  isMenuOpen,
  onToggleMenu,
  onEdit,
  onDelete,
}: KanbanColumnMenuProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={(e) => {
          e.stopPropagation();
          onToggleMenu(col.id);
        }}
        title={t('kanban.edit_column')}
        aria-label={t('kanban.edit_column')}
      >
        {MORE_ICON}
      </Button>

      {isMenuOpen && (
        <div onClick={(e) => e.stopPropagation()} style={MENU_POPOVER_STYLE}>
          <Button
            variant="ghost"
            size="sm"
            startIcon={EDIT_ICON}
            onClick={() => onEdit(col)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {t('kanban.edit_column')}
          </Button>

          {!isBase && (
            <Button
              variant="ghost"
              size="sm"
              tone="danger"
              startIcon={TRASH_ICON}
              onClick={() => onDelete(col)}
              style={{ width: '100%', justifyContent: 'flex-start' }}
            >
              {t('kanban.delete_column')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
