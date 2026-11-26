import { useEffect, useState } from 'react';
import type { BoardColumn } from '../types/models';
import type { ColumnCreatePayload } from './ColumnCreateModal';
import { columnService } from '../services/columnService';
import type { ColumnUpdatePayload } from './ColumnEditModal';

export function useColumnCrudModals(onColumnsChange?: (cols: BoardColumn[]) => void) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<BoardColumn | null>(null);
  const [activeMenuColId, setActiveMenuColId] = useState<string | null>(null);

  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuColId(null);
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const handleCreateColumn = async (newColData: ColumnCreatePayload) => {
    const updated = await columnService.createColumn(newColData);
    onColumnsChange?.(updated);
  };

  const handleSaveColumn = async (colId: string, updateData: ColumnUpdatePayload) => {
    const updated = await columnService.updateColumn(colId, updateData);
    onColumnsChange?.(updated);
  };

  const handleDeleteColumn = async (colId: string, migrateTo: string) => {
    const updated = await columnService.deleteColumn(colId, migrateTo);
    onColumnsChange?.(updated);
  };

  return {
    isCreateOpen,
    setIsCreateOpen,
    editingColumn,
    setEditingColumn,
    deletingColumn,
    setDeletingColumn,
    activeMenuColId,
    handleToggleMenu: (colId: string) =>
      setActiveMenuColId((prev) => (prev === colId ? null : colId)),
    handleEditCol: (col: BoardColumn) => {
      setActiveMenuColId(null);
      setEditingColumn(col);
    },
    handleDeleteCol: (col: BoardColumn) => {
      setActiveMenuColId(null);
      setDeletingColumn(col);
    },
    handleCreateColumn,
    handleSaveColumn,
    handleDeleteColumn,
  };
}
