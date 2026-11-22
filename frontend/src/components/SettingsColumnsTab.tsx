import React from 'react';
import { Plus } from 'lucide-react';
import { Button, Icon, Text } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import SettingsColumnRow from './SettingsColumnRow';
import type { BoardColumn } from '../types/models';

export interface SettingsColumnsTabProps {
  funnelColumns: BoardColumn[];
  onOpenCreate: () => void;
  onMoveColumn: (index: number, direction: number) => void;
  onEditColumn: (col: BoardColumn) => void;
  onDeleteColumn: (col: BoardColumn) => void;
}

const PLUS_ICON = <Icon icon={Plus} size="xs" />;

export default function SettingsColumnsTab({
  funnelColumns,
  onOpenCreate,
  onMoveColumn,
  onEditColumn,
  onDeleteColumn,
}: SettingsColumnsTabProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text variant="caption" weight="medium">
          {t('settingsModal.columns_manager_desc')}
        </Text>
        <Button variant="primary" size="sm" startIcon={PLUS_ICON} onClick={onOpenCreate}>
          {t('kanban.add_column')}
        </Button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
        {funnelColumns.map((col, idx) => (
          <SettingsColumnRow
            key={col.id}
            col={col}
            index={idx}
            total={funnelColumns.length}
            onMoveColumn={onMoveColumn}
            onEditColumn={onEditColumn}
            onDeleteColumn={onDeleteColumn}
          />
        ))}
      </div>
    </div>
  );
}
