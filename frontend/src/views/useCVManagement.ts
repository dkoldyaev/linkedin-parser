import { clearLocalCV, getLocalCV, saveLocalCV } from '../utils/cvIndexedDB';
import React, { useCallback, useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { cvService } from '../services/cvService';
import { extractTextFromFile } from '../utils/textExtractor';
import type { LocalCVRecord } from '../utils/cvIndexedDB';
import type { ServerCVData } from '../services/cvService.types';
import type { User } from '../types/models';
import { useTranslation } from '../i18n/I18nContext';

export type CVSyncStatus = 'none' | 'draft' | 'approved' | 'outdated';

export type { ServerCVData };

interface InitialCVState {
  sourceText: string;
  sourceRevision: number;
  approvedRevision: number;
  filename: string;
  syncStatus: CVSyncStatus;
}

function computeSyncStatusForContent(content: string, serverCV: ServerCVData | null): CVSyncStatus {
  const trimmed = content.trim();
  if (serverCV) {
    const serverTrimmed = (serverCV.content || '').trim();
    return trimmed === serverTrimmed ? 'approved' : 'outdated';
  }
  return trimmed ? 'draft' : 'none';
}

function deriveLocalCVState(local: LocalCVRecord, sCv: ServerCVData | null): InitialCVState {
  const content = local.content || '';
  return {
    sourceText: content,
    sourceRevision: local.revision || 1,
    approvedRevision: sCv?.revision || 0,
    filename: local.filename || '',
    syncStatus: computeSyncStatusForContent(content, sCv),
  };
}

function deriveServerCVState(sCv: ServerCVData | null): InitialCVState {
  if (!sCv) {
    return {
      sourceText: '',
      sourceRevision: 1,
      approvedRevision: 0,
      filename: '',
      syncStatus: 'none',
    };
  }
  return {
    sourceText: sCv.content || '',
    sourceRevision: sCv.revision || 1,
    approvedRevision: sCv.revision || 0,
    filename: '',
    syncStatus: 'approved',
  };
}

function deriveInitialCVState(
  local: LocalCVRecord | null,
  sCv: ServerCVData | null,
): InitialCVState {
  if (local && local.content) {
    return deriveLocalCVState(local, sCv);
  }
  return deriveServerCVState(sCv);
}

async function extractValidatedFileText(file: File, emptyErrorMsg: string): Promise<string> {
  const text = await extractTextFromFile(file);
  if (!text.trim()) {
    throw new Error(emptyErrorMsg);
  }
  return text;
}

async function postCVToServer(
  content: string,
  revision: number,
  fallbackError: string,
): Promise<ServerCVData & { revision: number }> {
  try {
    return await cvService.saveCV({ content, revision });
  } catch (err) {
    const msg = err instanceof Error ? err.message : fallbackError;
    throw new Error(msg);
  }
}

function useCVDataState(user: User | null | undefined) {
  const [, setCurrentUser] = useState<User | null>(user || null);
  const [, setLoading] = useState(true);
  const [sourceText, setSourceText] = useState('');
  const [sourceRevision, setSourceRevision] = useState(1);
  const [approvedRevision, setApprovedRevision] = useState(0);
  const [serverCV, setServerCV] = useState<ServerCVData | null>(null);
  const [syncStatus, setSyncStatus] = useState<CVSyncStatus>('none');
  const [filename, setFilename] = useState('');

  const fetchServerApprovedCV = useCallback(async (): Promise<ServerCVData | null> => {
    try {
      const data = await cvService.getCV();
      setServerCV(data);
      return data;
    } catch (err) {
      console.warn('Failed to fetch server CV:', err);
    }
    return null;
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const u = await authService.getMe();
      if (u) {
        setCurrentUser(u);
      }
    } catch (err) {
      console.warn('Failed to fetch current user:', err);
    }
  }, []);

  const applyCVState = useCallback((next: InitialCVState) => {
    setSourceText(next.sourceText);
    setSourceRevision(next.sourceRevision);
    setApprovedRevision(next.approvedRevision);
    setFilename(next.filename);
    setSyncStatus(next.syncStatus);
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      if (!user) await fetchCurrentUser();
      const sCv = await fetchServerApprovedCV();
      const local = await getLocalCV(user?.id);
      if (!isMounted) return;
      applyCVState(deriveInitialCVState(local, sCv));
      setLoading(false);
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [user, fetchCurrentUser, fetchServerApprovedCV, applyCVState]);

  return {
    sourceText,
    setSourceText,
    sourceRevision,
    setSourceRevision,
    approvedRevision,
    setApprovedRevision,
    serverCV,
    setServerCV,
    syncStatus,
    setSyncStatus,
    filename,
    setFilename,
    applyCVState,
  };
}

export function useCVManagement(user: User | null | undefined) {
  const { t } = useTranslation();
  const state = useCVDataState(user);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTextChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const newRev = state.sourceRevision + 1;
    state.setSourceText(newText);
    state.setSourceRevision(newRev);
    state.setSyncStatus(computeSyncStatusForContent(newText, state.serverCV));
    await saveLocalCV(
      {
        content: newText,
        revision: newRev,
        filename: state.filename,
        updated_at: new Date().toISOString(),
      },
      user?.id,
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    try {
      const text = await extractValidatedFileText(file, t('pages.cv.empty_file_error'));
      const newRev = state.sourceRevision + 1;
      state.setSourceText(text);
      state.setSourceRevision(newRev);
      state.setFilename(file.name);
      state.setSyncStatus(computeSyncStatusForContent(text, state.serverCV));
      await saveLocalCV(
        {
          content: text,
          revision: newRev,
          filename: file.name,
          updated_at: new Date().toISOString(),
        },
        user?.id,
      );
      setMessage(t('pages.cv.uploaded_success', { filename: file.name }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.cv.upload_failed'));
    } finally {
      e.target.value = '';
    }
  };

  const handleSaveToServer = async () => {
    if (!state.sourceText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const saved = await postCVToServer(
        state.sourceText,
        state.sourceRevision,
        t('pages.cv.save_failed'),
      );
      state.setServerCV(saved);
      state.setApprovedRevision(saved.revision);
      state.setSyncStatus('approved');
      setMessage(t('pages.cv.approved_saved_success'));
      await saveLocalCV(
        {
          content: state.sourceText,
          revision: saved.revision,
          filename: state.filename,
          updated_at: new Date().toISOString(),
        },
        user?.id,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : t('pages.cv.save_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServerCV = async () => {
    if (!window.confirm(t('pages.cv.confirm_delete_server'))) return;
    try {
      setIsSubmitting(true);
      await cvService.deleteCV();
      state.setServerCV(null);
      state.setApprovedRevision(0);
      state.setSyncStatus(state.sourceText ? 'draft' : 'none');
      setMessage(t('pages.cv.server_deleted_success'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete CV');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearLocal = async () => {
    if (!window.confirm(t('pages.cv.confirm_clear_draft'))) return;
    await clearLocalCV(user?.id);
    state.applyCVState(deriveServerCVState(state.serverCV));
    setMessage(t('pages.cv.draft_cleared'));
  };

  return {
    ...state,
    message,
    error,
    isSubmitting,
    handleTextChange,
    handleFileUpload,
    handleSaveToServer,
    handleDeleteServerCV,
    handleClearLocal,
  };
}
