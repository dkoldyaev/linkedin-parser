import {
  anyUrlRequiresExtension,
  checkExtensionPromptRequirement,
  type ExtensionPromptRequirement,
} from '../utils/extension';
import { EVENTS, trackEvent } from '../utils/analytics';
import { ApiError } from '../services/apiClient';
import type { BatchDuplicateCheckResponse } from '../services/vacancy.types';
import type { BatchImportResult } from './BatchImportResultView';
import type { DuplicateWarningState } from './BatchDuplicateWarningView';
import type React from 'react';
import { useState } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import { vacancyService } from '../services/vacancyService';

function parseLinesList(text: string, delimiter: string): string[] {
  return text
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

async function checkServerDuplicates(urls: string[]): Promise<BatchDuplicateCheckResponse | null> {
  try {
    return await vacancyService.checkBatchDuplicates(urls);
  } catch (err) {
    console.warn('Failed to pre-check duplicates:', err);
    return null;
  }
}

async function submitBatchVacancies(
  urls: string[],
  defaultTags: string[],
  t: (path: string, params?: Record<string, string | number>) => string,
): Promise<BatchImportResult> {
  try {
    return (await vacancyService.batchImport(urls, defaultTags)) as BatchImportResult;
  } catch (err) {
    if (err instanceof ApiError) {
      throw new Error(t('batchModal.error_server', { status: err.status }));
    }
    throw err;
  }
}

function hasDuplicateItems(checkData: BatchDuplicateCheckResponse | null): boolean {
  if (!checkData?.has_duplicates || !checkData.duplicates) return false;
  return checkData.duplicates.length > 0;
}

function resolveRequiresExtension(warning: DuplicateWarningState): boolean {
  if (typeof warning.requiresExtension === 'boolean') {
    return warning.requiresExtension;
  }
  return anyUrlRequiresExtension(warning.urls);
}

interface BatchSubmissionDeps {
  t: (path: string, params?: Record<string, string | number>) => string;
  onImportComplete?: () => void;
  setLoading: (val: boolean) => void;
  setError: (val: string | null) => void;
  setResult: (val: BatchImportResult | null) => void;
  setDuplicateWarning: (val: DuplicateWarningState | null) => void;
}

function createBatchSubmitter(deps: BatchSubmissionDeps) {
  return async (urls: string[], defaultTags: string[]) => {
    deps.setLoading(true);
    deps.setError(null);
    deps.setResult(null);

    trackEvent(EVENTS.BATCH_IMPORT_SUBMIT, {
      urls_count: urls.length,
      has_tags: defaultTags.length > 0,
      tags_count: defaultTags.length,
    });

    try {
      const data = await submitBatchVacancies(urls, defaultTags, deps.t);
      trackEvent(EVENTS.BATCH_IMPORT_SUCCESS, {
        urls_count: urls.length,
        status: data.status,
        queued: data.queued,
        results_count: (data.results || []).length,
      });
      deps.setResult(data);
      deps.onImportComplete?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Batch import failed';
      trackEvent(EVENTS.BATCH_IMPORT_ERROR, { urls_count: urls.length, error: msg });
      deps.setError(msg);
    } finally {
      deps.setLoading(false);
      deps.setDuplicateWarning(null);
    }
  };
}

function useExtensionPromptGate(
  performSubmit: (urls: string[], defaultTags: string[]) => Promise<void>,
  setLoading: (val: boolean) => void,
) {
  const [showExtModal, setShowExtModal] = useState(false);
  const [extModalInfo, setExtModalInfo] = useState<ExtensionPromptRequirement | null>(null);
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null);

  const runWithExtensionCheck = async (
    urls: string[],
    defaultTags: string[],
    needsExt: boolean,
  ) => {
    if (needsExt) {
      const promptReq = await checkExtensionPromptRequirement();
      if (promptReq.show) {
        setExtModalInfo(promptReq);
        setPendingSubmit(() => () => {
          void performSubmit(urls, defaultTags);
        });
        setShowExtModal(true);
        setLoading(false);
        return;
      }
    }
    await performSubmit(urls, defaultTags);
  };

  const handleExtClose = () => {
    setShowExtModal(false);
    setPendingSubmit(null);
  };

  const handleExtProceed = () => {
    setShowExtModal(false);
    const run = pendingSubmit;
    setPendingSubmit(null);
    run?.();
  };

  return {
    showExtModal,
    extModalInfo,
    setPendingSubmit,
    runWithExtensionCheck,
    handleExtClose,
    handleExtProceed,
  };
}

export function useBatchImportController(onClose: () => void, onImportComplete?: () => void) {
  const { t } = useTranslation();
  const [urlsText, setUrlsText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BatchImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateWarningState | null>(null);

  const performSubmit = createBatchSubmitter({
    t,
    onImportComplete,
    setLoading,
    setError,
    setResult,
    setDuplicateWarning,
  });

  const extGate = useExtensionPromptGate(performSubmit, setLoading);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const urls = parseLinesList(urlsText, '\n');
    if (urls.length === 0) {
      setError(t('batchModal.error_empty'));
      return;
    }
    const defaultTags = parseLinesList(tagsInput, ',');

    setLoading(true);
    const checkData = await checkServerDuplicates(urls);
    if (hasDuplicateItems(checkData) && checkData?.duplicates) {
      setDuplicateWarning({
        duplicates: checkData.duplicates,
        urls,
        defaultTags,
        requiresExtension: checkData.requires_extension,
      });
      setLoading(false);
      return;
    }

    await extGate.runWithExtensionCheck(urls, defaultTags, anyUrlRequiresExtension(urls));
  };

  const handleProceedDuplicates = async () => {
    if (!duplicateWarning) return;
    await extGate.runWithExtensionCheck(
      duplicateWarning.urls,
      duplicateWarning.defaultTags,
      resolveRequiresExtension(duplicateWarning),
    );
  };

  const handleClose = () => {
    setUrlsText('');
    setTagsInput('');
    setResult(null);
    setError(null);
    setDuplicateWarning(null);
    extGate.setPendingSubmit(null);
    onClose();
  };

  return {
    urlsText,
    setUrlsText,
    tagsInput,
    setTagsInput,
    loading,
    result,
    error,
    duplicateWarning,
    setDuplicateWarning,
    handleSubmit,
    handleProceedDuplicates,
    handleClose,
    ...extGate,
  };
}
