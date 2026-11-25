
import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from '../i18n/I18nContext';
import type { ApiKeyItem } from '../types/models';
import { apiKeyService } from '../services/apiKeyService';
import { ApiError } from '../services/apiClient';

async function requestCreateApiKey(name: string): Promise<string | null> {
  try {
    const res = await apiKeyService.createApiKey({ name });
    return res.token || null;
  } catch {
    return null;
  }
}

export function useApiKeys(hasApiAccess: boolean) {
  const { t } = useTranslation();
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [createdKeyToken, setCreatedKeyToken] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(hasApiAccess);
  const [, setError] = useState<string | null>(null);

  const fetchApiKeys = useCallback(async () => {
    if (!hasApiAccess) return;
    await Promise.resolve();
    try {
      setLoading(true);
      setError(null);
      const data = await apiKeyService.getApiKeys();
      if (Array.isArray(data)) setApiKeys(data);
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setError('403');
        return;
      }
      console.error('Failed to load api keys', err);
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [hasApiAccess]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleGenerateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyName.trim();
    if (!trimmed) return;
    try {
      setGeneratingKey(true);
      const token = await requestCreateApiKey(trimmed);
      if (token) {
        setCreatedKeyToken(token);
        setNewKeyName('');
        fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to generate api key', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleCopyToken = () => {
    if (!createdKeyToken) return;
    navigator.clipboard.writeText(createdKeyToken);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRevokeApiKey = async (key: ApiKeyItem) => {
    const confirmMsg = t('settingsModal.confirm_revoke_key').replace('{name}', key.name);
    if (!window.confirm(confirmMsg)) return;
    try {
      await apiKeyService.revokeApiKey(key.id);
      fetchApiKeys();
    } catch (err) {
      console.error('Failed to revoke api key', err);
    }
  };

  return { apiKeys, newKeyName, setNewKeyName, generatingKey, createdKeyToken, copiedKey, loading, handleGenerateApiKey, handleCopyToken, handleRevokeApiKey };
}
