'use client';

import React, { useState, useCallback } from 'react';
import { STATUS_REJECTED } from '../constants/columns';
import { trackEvent, EVENTS } from '../utils/analytics';
import type { Vacancy, BoardColumn } from '../types/models';
import { vacancyService } from '../services/vacancyService';
import { applyVacancyUpdateToList, type TranslateFn } from './homeFilterHelpers';

export interface UseVacancyBoardActionsArgs {
  vacancies: Vacancy[];
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  columns: BoardColumn[];
  selectedVacancy: Vacancy | null;
  setSelectedVacancy: React.Dispatch<React.SetStateAction<Vacancy | null>>;
  closeVacancyModal: () => void;
  selectedCountry: string;
  selectedClosed: string;
  fetchVacancies: () => void;
  fetchTags: () => void;
  fetchCountries: () => void;
  fetchCities: (country: string) => void;
  fetchSources: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  t: TranslateFn;
}

function resolveTargetLane(columns: BoardColumn[], newStatus: string, lane: number | undefined): number {
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

async function patchVacancyStatusList(vacancyIds: number[], payload: Record<string, unknown>) {
  await Promise.all(vacancyIds.map((vid) => vacancyService.patchDetail(vid, payload)));
}

async function patchBulkVacancyTag(
  selectedIds: number[],
  vacancies: Vacancy[],
  tagName: string,
  mode: 'add' | 'remove'
) {
  await Promise.all(
    selectedIds.map(async (id) => {
      const v = vacancies.find((x) => x.id === id);
      if (!v) return;
      const tags = new Set(v.tags || []);
      if (mode === 'add') {
        tags.add(tagName);
      } else {
        tags.delete(tagName);
      }
      await vacancyService.patchDetail(id, { tags: Array.from(tags) });
    })
  );
}

async function requestPatchVacancyStatus(
  vacancyId: number,
  newStatus: string,
  targetLane: number
): Promise<Vacancy> {
  return vacancyService.patchDetail(vacancyId, { status: newStatus, lane: targetLane });
}

async function requestReorderVacancies(
  status: string,
  ids: number[],
  lane: number,
  movedId: number | null
): Promise<Vacancy[]> {
  return vacancyService.reorder(status, ids, lane, movedId);
}

function useBoardDragHandlers(args: UseVacancyBoardActionsArgs) {
  const handleStatusChange = async (vacancyId: number, newStatus: string, lane?: number) => {
    const targetLane = resolveTargetLane(args.columns, newStatus, lane);
    args.setVacancies((prev) => prev.map((v) => (v.id === vacancyId ? { ...v, status: newStatus, lane: targetLane } : v)));
    args.setSelectedVacancy((prev) => (prev && prev.id === vacancyId ? { ...prev, status: newStatus, lane: targetLane } : prev));

    try {
      const updatedVacancy = await requestPatchVacancyStatus(vacancyId, newStatus, targetLane);
      args.setVacancies((prev) => prev.map((v) => (v.id === vacancyId ? updatedVacancy : v)));
      args.setSelectedVacancy((prev) => (prev && prev.id === vacancyId ? updatedVacancy : prev));
      args.showToast(args.t('nav.moved_to', { status: args.t(`kanban.columns.${newStatus}`) }), 'success');
    } catch (err) {
      console.error('Failed to update status', err);
      args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    }
  };

  const handleReorder = async (status: string, ids: number[], lane?: number, movedId?: number | null) => {
    const resolvedLane = lane || 0;
    const resolvedMovedId = movedId !== undefined ? movedId : null;
    const positions = new Map(ids.map((id, i) => [id, i]));
    const hasLanes = Boolean(args.columns.find((c) => c.id === status)?.has_lanes);

    args.setVacancies((prev) =>
      prev.map((v) => computeReorderedVacancy(v, { status, positions, hasLanes, lane: resolvedLane, movedId: resolvedMovedId }))
    );

    try {
      const updated = await requestReorderVacancies(status, ids, resolvedLane, resolvedMovedId);
      const byId = new Map(updated.map((v) => [v.id, v]));
      args.setVacancies((prev) => prev.map((v) => byId.get(v.id) || v));
      args.setSelectedVacancy((prev) => (prev && byId.get(prev.id)) || prev);
    } catch (err) {
      console.error('Failed to reorder vacancies', err);
      args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    }
  };

  const handleStatusChangeMulti = async (vacancyIds: number[], newStatus: string, lane?: number) => {
    const targetLane = resolveTargetLane(args.columns, newStatus, lane);
    args.setVacancies((prev) => prev.map((v) => (vacancyIds.includes(v.id) ? { ...v, status: newStatus, lane: targetLane } : v)));
    try {
      await patchVacancyStatusList(vacancyIds, { status: newStatus, lane: targetLane });
      args.fetchVacancies();
      args.showToast(args.t('nav.moved_to', { status: args.t(`kanban.columns.${newStatus}`) }), 'success');
    } catch (err) {
      console.error('Failed to update status', err);
      args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    }
  };

  return { handleStatusChange, handleReorder, handleStatusChangeMulti };
}

function useBulkSelectionHandlers(args: UseVacancyBoardActionsArgs) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkTagInput, setBulkTagInput] = useState('');

  const toggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }, []);

  const handleBulkAddTag = async () => {
    const trimmed = bulkTagInput.trim();
    if (!trimmed) return;
    try {
      await patchBulkVacancyTag(selectedIds, args.vacancies, trimmed, 'add');
      setBulkTagInput('');
      args.fetchVacancies();
      args.fetchTags();
      args.showToast(args.t('kanban.bulk_tags_added'), 'success');
    } catch (e) {
      console.error(e);
    }
  };

  const handleBulkRemoveTag = async () => {
    const trimmed = bulkTagInput.trim();
    if (!trimmed) return;
    try {
      await patchBulkVacancyTag(selectedIds, args.vacancies, trimmed, 'remove');
      setBulkTagInput('');
      args.fetchVacancies();
      args.fetchTags();
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
      await Promise.all(selectedIds.map((id) => vacancyService.deleteVacancy(id)));
      setSelectedIds([]);
      args.fetchVacancies();
      args.fetchTags();
      args.fetchSources();
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
      args.fetchVacancies();
    } catch (e) {
      console.error(e);
    }
  };

  return { selectedIds, setSelectedIds, bulkTagInput, setBulkTagInput, toggleSelect, handleBulkAddTag, handleBulkRemoveTag, handleBulkDeleteSelected, handleRefreshVacancies };
}

export function useVacancyBoardActions(args: UseVacancyBoardActionsArgs) {
  const [isMovingAllRejected, setIsMovingAllRejected] = useState(false);
  const dragHandlers = useBoardDragHandlers(args);
  const bulkHandlers = useBulkSelectionHandlers(args);

  const refreshMetadataLists = () => {
    args.fetchTags();
    args.fetchCountries();
    args.fetchCities(args.selectedCountry);
    args.fetchSources();
  };

  const handleMoveAllClosedToRejected = async () => {
    const targets = args.vacancies.filter((v) => v.status !== STATUS_REJECTED);
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
        prev.map((v) => (ids.includes(v.id) ? { ...v, status: STATUS_REJECTED } : v))
      );
      await patchVacancyStatusList(ids, { status: STATUS_REJECTED });
      args.fetchVacancies();
      args.showToast(
        args.t('nav.move_all_to_rejected_success', { count: targets.length }),
        'success'
      );
    } catch (err) {
      console.error('Failed to move all to rejected', err);
      args.fetchVacancies();
      args.showToast(args.t('nav.update_status_failed'), 'error');
    } finally {
      setIsMovingAllRejected(false);
    }
  };

  const handleVacancyUpdate = (updatedVacancy: Vacancy) => {
    args.setVacancies((prev) =>
      applyVacancyUpdateToList(prev, updatedVacancy, args.selectedClosed)
    );
    args.setSelectedVacancy(updatedVacancy);
    refreshMetadataLists();
  };

  const handleVacancyDelete = async (deletedId: number) => {
    try {
      await vacancyService.deleteVacancy(deletedId);
    } catch (err) {
      console.error('Failed to delete vacancy', err);
    }
    args.setVacancies((prev) => prev.filter((v) => v.id !== deletedId));
    args.closeVacancyModal();
    args.setSelectedVacancy(null);
    refreshMetadataLists();
    args.showToast(args.t('nav.vacancy_deleted'), 'success');
  };

  const handleImportComplete = () => {
    args.fetchVacancies();
    refreshMetadataLists();
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
