import React from 'react';
import ColumnCreateModal, { type ColumnCreatePayload } from './ColumnCreateModal';
import ColumnEditModal, { type ColumnUpdatePayload } from './ColumnEditModal';
import ColumnDeleteModal from './ColumnDeleteModal';
import type { BoardColumn } from '../types/models';

export interface SettingsColumnModalsProps {
  isCreateOpen: boolean;
  onCloseCreate: () => void;
  onCreateColumn: (data: ColumnCreatePayload) => Promise<void>;
  editingCol: BoardColumn | null;
  onCloseEdit: () => void;
  onSaveColumn: (id: string, data: ColumnUpdatePayload) => Promise<void>;
  deletingCol: BoardColumn | null;
  onCloseDelete: () => void;
  onDeleteColumn: (id: string, migrateTo: string) => Promise<void>;
  funnelColumns: BoardColumn[];
  deletingVacanciesCount: number;
}

export default function SettingsColumnModals({
  isCreateOpen,
  onCloseCreate,
  onCreateColumn,
  editingCol,
  onCloseEdit,
  onSaveColumn,
  deletingCol,
  onCloseDelete,
  onDeleteColumn,
  funnelColumns,
  deletingVacanciesCount,
}: SettingsColumnModalsProps): React.ReactElement {
  return (
    <>
      <ColumnCreateModal
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onCreate={onCreateColumn}
      />

      <ColumnEditModal
        isOpen={Boolean(editingCol)}
        column={editingCol}
        onClose={onCloseEdit}
        onSave={onSaveColumn}
      />

      <ColumnDeleteModal
        isOpen={Boolean(deletingCol)}
        column={deletingCol}
        availableColumns={funnelColumns}
        vacanciesCount={deletingVacanciesCount}
        onClose={onCloseDelete}
        onDelete={onDeleteColumn}
      />
    </>
  );
}
