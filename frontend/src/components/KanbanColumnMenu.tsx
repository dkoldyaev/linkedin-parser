import React, { useRef } from 'react';
import { MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { Button, Icon, Overlay } from '@blueprint/ui-kit';
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
  minWidth: '180px',
  padding: 'var(--ui-space-1)',
  backgroundColor: 'var(--ui-bg-surface)',
  border: '1px solid var(--ui-border-strong)',
  boxShadow: 'var(--ui-shadow-md)',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-1)',
};

const MENU_ITEM_STYLE: React.CSSProperties = {
  width: '100%',
  justifyContent: 'flex-start',
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
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <Button
        ref={triggerRef}
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

      <Overlay
        isOpen={isMenuOpen}
        anchorRef={triggerRef}
        placement="bottom-end"
        offsetPx={4}
        onClose={() => onToggleMenu(col.id)}
      >
        <div onClick={(e) => e.stopPropagation()} style={MENU_POPOVER_STYLE}>
          <Button
            variant="ghost"
            size="sm"
            startIcon={EDIT_ICON}
            onClick={() => onEdit(col)}
            style={MENU_ITEM_STYLE}
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
              style={MENU_ITEM_STYLE}
            >
              {t('kanban.delete_column')}
            </Button>
          )}
        </div>
      </Overlay>
    </div>
  );
}
