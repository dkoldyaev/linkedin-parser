import { applyVacancyUpdateToList, type TranslateFn } from './homeFilterHelpers';
import type { BoardColumn, Vacancy } from '../types/models';
import { EVENTS, trackEvent } from '../utils/analytics';
import React, { useCallback, useState } from 'react';
import { resolveRejectedStatusId } from '../components/kanbanCardHelpers';
import { vacancyService } from '../services/vacancyService';

export interface UseVacancyBoardActionsArgs {
  vacancies: Vacancy[];
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  columns: BoardColumn[];
  hiddenVacancyIds: Set<number>;
  onOpenVacancyPatched: (updated: Vacancy) => void;
  closeVacancyModal: () => void;
  fetchVacancies: () => Promise<void>;
  showToast: (msg: string, type: 'success' | 'error') => void;
  t: TranslateFn;
}

function resolveTargetLane(
  columns: BoardColumn[],
  newStatus: string,
  lane: number | undefined,
): number {
  const targetCol = columns.find((c) => c.id === newStatus);
  return targetCol?.has_lanes ? lane || 0 : 0;
}

interface ReorderComputeOptions {
  status: string;
  positions: Map<number, number>;
  hasLanes: boolean;
  lane: number;
  movedId: number | null;
}

function computeReorderedVacancy(v: Vacancy, opts: ReorderComputeOptions): Vacancy {
  const sortOrder = opts.positions.get(v.id);
  if (sortOrder === undefined) return v;
  let newLane = v.lane || 0;
  if (!opts.hasLanes) {
    newLane = 0;
  } else if (v.id === opts.movedId || opts.movedId == null) {
    newLane = opts.lane;
  }
  return {
    ...v,
    status: opts.status,
    lane: newLane,
    sort_order: sortOrder,
  };
}

async function patchVacancyStatusList(
  vacancyIds: number[],
  payload: Record<string, unknown>,
): Promise<Vacancy[]> {
  return Promise.all(vacancyIds.map((vid) => vacancyService.patchDetail(vid, payload)));
}

async function patchBulkVacancyTag(
  selectedIds: number[],
  vacancies: Vacancy[],
  tagName: string,
  mode: 'add' | 'remove',
): Promise<Vacancy[]> {
  const results = await Promise.all(
    selectedIds.map(async (id) => {
      const v = vacancies.find((x) => x.id === id);
      if (!v) return null;
      const tags = new Set(v.tags || []);
      if (mode === 'add') {
        tags.add(tagName);
      } else {
        tags.delete(tagName);
      }
      return vacancyService.patchDetail(id, { tags: Array.from(tags) });
    }),
  );
  return results.filter((item): item is Vacancy => item !== null);
}

function mergeUpdatedVacanciesInMemory(prev: Vacancy[], updatedItems: Vacancy[]): Vacancy[] {
  if (updatedItems.length === 0) return prev;
  const byId = new Map(updatedItems.map((u) => [u.id, u]));
  return prev.map((v) => {
    const incoming = byId.get(v.id);
    return incoming ? { ...v, ...incoming } : v;
  });
}

function createReorderHandler(args: UseVacancyBoardActionsArgs) {
  return async (status: string, ids: number[], lane?: number, movedId?: number | null) => {
    const resolvedLane = lane || 0;
    const resolvedMovedId = movedId !== undefined ? movedId : null;
    const positions = new Map(ids.map((id, i) => [id, i]));
    const hasLanes = Boolean(args.columns.find((c) => c.id === status)?.has_lanes);

    args.setVacancies((prev) =>
      prev.map((v) =>
        computeReorderedVacancy(v, {
          status,
          positions,
          hasLanes,
          lane: resolvedLane,
          movedId: resolvedMovedId,
        }),
      ),
    );

    try {
      const updated = await vacancyService.reorder(status, ids, resolvedLane, resolvedMovedId);
      args.setVacancies((prev) => mergeUpdatedVacanciesInMemory(prev, updated));
    } catch (err) {
      console.error('Failed to reorder vacancies', err);
      void args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    }
  };
}

function useBoardDragHandlers(args: UseVacancyBoardActionsArgs) {
  const handleStatusChange = async (vacancyId: number, newStatus: string, lane?: number) => {
    const targetLane = resolveTargetLane(args.columns, newStatus, lane);
    args.setVacancies((prev) =>
      prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus, lane: targetLane } : v)),
    );

    try {
      const updatedVacancy = await vacancyService.patchDetail(vacancyId, {
        status: newStatus,
        lane: targetLane,
      });
      args.setVacancies((prev) => applyVacancyUpdateToList(prev, updatedVacancy));
      args.onOpenVacancyPatched(updatedVacancy);
      args.showToast(
        args.t('nav.moved_to', { status: args.t(`kanban.columns.${newStatus}`) }),
        'success',
      );
    } catch (err) {
      console.error('Failed to update status', err);
      void args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    }
  };

  const handleReorder = createReorderHandler(args);

  const handleStatusChangeMulti = async (
    vacancyIds: number[],
    newStatus: string,
    lane?: number,
  ) => {
    const targetLane = resolveTargetLane(args.columns, newStatus, lane);
    args.setVacancies((prev) =>
      prev.map((v) =>
        vacancyIds.includes(v.id) ? { ...v, status: newStatus, lane: targetLane } : v,
      ),
    );
    try {
      const updated = await patchVacancyStatusList(vacancyIds, {
        status: newStatus,
        lane: targetLane,
      });
      args.setVacancies((prev) => mergeUpdatedVacanciesInMemory(prev, updated));
      args.showToast(
        args.t('nav.moved_to', { status: args.t(`kanban.columns.${newStatus}`) }),
        'success',
      );
    } catch (err) {
      console.error('Failed to update status', err);
      void args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    }
  };

  return { handleStatusChange, handleReorder, handleStatusChangeMulti };
}

function useBulkSelectionHandlers(args: UseVacancyBoardActionsArgs) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState('');

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }, []);

  const handleBulkAddTag = async () => {
    const trimmed = bulkTagInput.trim();
    if (!trimmed) return;
    try {
      const updated = await patchBulkVacancyTag(selectedIds, args.vacancies, trimmed, 'add');
      args.setVacancies((prev) => mergeUpdatedVacanciesInMemory(prev, updated));
      setBulkTagInput('');
      args.showToast(args.t('kanban.bulk_tags_added'), 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkRemoveTag = async () => {
    const trimmed = bulkTagInput.trim();
    if (!trimmed) return;
    try {
      const updated = await patchBulkVacancyTag(selectedIds, args.vacancies, trimmed, 'remove');
      args.setVacancies((prev) => mergeUpdatedVacanciesInMemory(prev, updated));
      setBulkTagInput('');
      args.showToast(args.t('kanban.bulk_tags_removed'), 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkDeleteSelected = async () => {
    const confirmMsg = args.t('kanban.confirm_delete_selected', {
      count: selectedIds.length,
    });
    if (!window.confirm(confirmMsg)) return;
    try {
      const toDelete = new Set(selectedIds);
      await Promise.all(selectedIds.map((id) => vacancyService.deleteVacancy(id)));
      setSelectedIds([]);
      args.setVacancies((prev) => prev.filter((v) => !toDelete.has(v.id)));
      args.showToast(args.t('kanban.bulk_deleted'), 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleRefreshVacancies = async () => {
    trackEvent(EVENTS.REFRESH_CLICK);
    try {
      if (selectedIds.length > 0) {
        await Promise.all(selectedIds.map((id) => vacancyService.reparse(id)));
      } else {
        await vacancyService.reparseAll();
      }
      await args.fetchVacancies();
    } catch (e) {
      console.error(e);
    }
  };

  return {
    selectedIds,
    setSelectedIds,
    bulkTagInput,
    setBulkTagInput,
    toggleSelect,
    handleBulkAddTag,
    handleBulkRemoveTag,
    handleBulkDeleteSelected,
    handleRefreshVacancies,
  };
}

export function useVacancyBoardActions(args: UseVacancyBoardActionsArgs) {
  const [isMovingAllRejected, setIsMovingAllRejected] = useState(false);
  const dragHandlers = useBoardDragHandlers(args);
  const bulkHandlers = useBulkSelectionHandlers(args);

  const handleMoveAllClosedToRejected = async () => {
    const rejectedStatusId = resolveRejectedStatusId(args.columns);
    const targets = args.vacancies.filter(
      (v) =>
        Boolean(v.is_closed) && v.status !== rejectedStatusId && !args.hiddenVacancyIds.has(v.id),
    );
    if (targets.length === 0) return;
    const confirmMsg = args.t('nav.move_all_to_rejected_confirm', {
      count: targets.length,
    });
    if (!window.confirm(confirmMsg)) return;

    setIsMovingAllRejected(true);
    trackEvent(EVENTS.MOVE_ALL_CLOSED_REJECTED, { count: targets.length });
    try {
      const ids = targets.map((v) => v.id);
      args.setVacancies((prev) =>
        prev.map((v) => (ids.includes(v.id) ? { ...v, status: rejectedStatusId } : v)),
      );
      const updated = await patchVacancyStatusList(ids, { status: rejectedStatusId });
      args.setVacancies((prev) => mergeUpdatedVacanciesInMemory(prev, updated));
      args.showToast(
        args.t('nav.move_all_to_rejected_success', { count: targets.length }),
        'success',
      );
    } catch (err) {
      console.error('Failed to move all to rejected', err);
      void args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    } finally {
      setIsMovingAllRejected(false);
    }
  };

  const handleVacancyUpdate = (updatedVacancy: Vacancy) => {
    args.setVacancies((prev) => applyVacancyUpdateToList(prev, updatedVacancy));
    args.onOpenVacancyPatched(updatedVacancy);
  };

  const handleVacancyDelete = async (deletedId: number) => {
    try {
      await vacancyService.deleteVacancy(deletedId);
    } catch (err) {
      console.error('Failed to delete vacancy', err);
    }
    args.setVacancies((prev) => prev.filter((v) => v.id !== deletedId));
    args.closeVacancyModal();
    args.showToast(args.t('nav.vacancy_deleted'), 'success');
  };

  const handleImportComplete = () => {
    args.showToast(args.t('nav.batch_import_completed'), 'success');
  };

  return {
    ...dragHandlers,
    ...bulkHandlers,
    isMovingAllRejected,
    handleMoveAllClosedToRejected,
    handleVacancyUpdate,
    handleVacancyDelete,
    handleImportComplete,
  };
}
