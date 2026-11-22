import { useState, useEffect, useCallback } from 'react';
import type React from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import type { ColumnCreatePayload } from './ColumnCreateModal';
import type { ColumnUpdatePayload } from './ColumnEditModal';
import type { BoardColumn } from '../types/models';
import { columnService } from '../services/columnService';
import { settingsService } from '../services/settingsService';
import type { RemoteSettingsData } from '../services/settings.types';

function useColumnCrudHandlers(
  columnsList: BoardColumn[],
  setColumnsList: (cols: BoardColumn[]) => void,
  onColumnsUpdated: ((columns: BoardColumn[]) => void) | undefined,
  fetchSettings: () => void
) {
  const updateColumnsList = (updated: BoardColumn[]) => {
    setColumnsList(updated);
    onColumnsUpdated?.(updated);
  };

  const handleCreateColumn = async (newColData: ColumnCreatePayload) => {
    const updated = await columnService.createColumn(newColData);
    updateColumnsList(updated);
  };

  const handleSaveColumn = async (colId: string, updateData: ColumnUpdatePayload) => {
    const updated = await columnService.updateColumn(colId, updateData);
    updateColumnsList(updated);
  };

  const handleDeleteColumn = async (colId: string, migrateTo: string) => {
    const updated = await columnService.deleteColumn(colId, migrateTo);
    updateColumnsList(updated);
  };

  const handleMoveColumn = async (index: number, direction: number) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= columnsList.length) return;
    const newCols = [...columnsList];
    const [moved] = newCols.splice(index, 1);
    newCols.splice(targetIdx, 0, moved);
    setColumnsList(newCols);

    try {
      const updated = await columnService.reorderColumns(newCols);
      updateColumnsList(updated);
    } catch (err) {
      console.error('Failed to reorder columns', err);
      fetchSettings();
    }
  };

  return {
    handleCreateColumn,
    handleSaveColumn,
    handleDeleteColumn,
    handleMoveColumn,
  };
}

function trackGeneralSettingsSaved(locale: string, format: string, currency: string): void {
  trackEvent(EVENTS.LANGUAGE_CHANGE, { locale });
  trackEvent(EVENTS.SALARY_FORMAT_CHANGE, { format });
  trackEvent(EVENTS.SALARY_CURRENCY_CHANGE, { currency });
}

async function postGeneralSettings(locale: string, format: string, currency: string): Promise<boolean> {
  try {
    await settingsService.saveSettings({
      locale,
      salary_display_format: format,
      salary_target_currency: currency,
    });
    return true;
  } catch {
    return false;
  }
}

export function useSettingsController(isOpen: boolean, onColumnsUpdated?: (columns: BoardColumn[]) => void) {
  const i18n = useTranslation();
  const [selectedLocale, setSelectedLocale] = useState<string>(i18n.locale || 'ru');
  const [selectedSalaryFormat, setSelectedSalaryFormat] = useState(i18n.salaryDisplayFormat || 'month');
  const [selectedCurrency, setSelectedCurrency] = useState(i18n.salaryTargetCurrency || '');
  const [columnsList, setColumnsList] = useState<BoardColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const applySettingsPayload = useCallback(
    (data: RemoteSettingsData) => {
      if (data.locale) {
        setSelectedLocale(data.locale);
        i18n.setLocale(data.locale);
      }
      if (data.salary_display_format) {
        setSelectedSalaryFormat(data.salary_display_format);
        i18n.setSalaryDisplayFormat(data.salary_display_format);
      }
      if (data.salary_target_currency !== undefined) {
        const curr = data.salary_target_currency || '';
        setSelectedCurrency(curr);
        i18n.setSalaryTargetCurrency(curr);
      }
      if (Array.isArray(data.columns)) {
        setColumnsList(data.columns);
      }
    },
    [i18n]
  );

  const fetchSettings = useCallback(() => {
    settingsService
      .getSettings()
      .then((data: RemoteSettingsData) => applySettingsPayload(data))
      .catch((err) => console.error('Failed to load settings', err));
  }, [applySettingsPayload]);

  useEffect(() => {
    if (isOpen) fetchSettings();
  }, [isOpen, fetchSettings]);

  const handleSaveGeneral = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      const ok = await postGeneralSettings(selectedLocale, selectedSalaryFormat, selectedCurrency);
      if (ok) {
        i18n.setLocale(selectedLocale);
        i18n.setSalaryDisplayFormat(selectedSalaryFormat);
        i18n.setSalaryTargetCurrency(selectedCurrency);
        trackGeneralSettingsSaved(selectedLocale, selectedSalaryFormat, selectedCurrency);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  const colHandlers = useColumnCrudHandlers(columnsList, setColumnsList, onColumnsUpdated, fetchSettings);

  return {
    selectedLocale,
    setSelectedLocale,
    selectedSalaryFormat,
    setSelectedSalaryFormat,
    selectedCurrency,
    setSelectedCurrency,
    columnsList,
    loading,
    savedSuccess,
    handleSaveGeneral,
    ...colHandlers,
  };
}
