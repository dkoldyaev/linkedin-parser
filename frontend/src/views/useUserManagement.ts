'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '../types/models';
import { useTranslation } from '../i18n/I18nContext';
import { userService } from '../services/userService';
import { ApiError } from '../services/apiClient';

function buildInitialEditingFlags(data: User[]): Record<number, string[]> {
  const initial: Record<number, string[]> = {};
  data.forEach((u) => {
    initial[u.id] = Array.isArray(u.feature_flags) ? [...u.feature_flags] : [];
  });
  return initial;
}

function toggleFlagList(current: string[], flagKey: string): string[] {
  return current.includes(flagKey)
    ? current.filter((k) => k !== flagKey)
    : [...current, flagKey];
}

export function filterUsersByQuery(users: User[], search: string): User[] {
  const q = search.toLowerCase();
  return users.filter((u) => {
    const emailMatch = Boolean(u.email && u.email.toLowerCase().includes(q));
    const nameMatch = Boolean(u.name && u.name.toLowerCase().includes(q));
    return emailMatch || nameMatch;
  });
}

async function putUserFeatureFlags(userId: number, flags: string[]) {
  await userService.updateFeatureFlags(userId, flags);
}

export function useUserManagement(hasAccess: boolean) {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(hasAccess);
  const [search, setSearch] = useState('');
  const [editingFlags, setEditingFlags] = useState<Record<number, string[]>>({});
  const [savingUserId, setSavingUserId] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!hasAccess) return;
    await Promise.resolve();
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await userService.getUsers();
      setUsers(data);
      setEditingFlags(buildInitialEditingFlags(data));
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setErrorMsg(t('pages.userManagement.access_denied_desc'));
        setUsers([]);
        return;
      }
      console.error('Fetch users error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [hasAccess, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleFlag = (userId: number, flagKey: string) => {
    setEditingFlags((prev) => ({
      ...prev,
      [userId]: toggleFlagList(prev[userId] || [], flagKey),
    }));
  };

  const handleSaveFlags = async (targetUser: User) => {
    try {
      setSavingUserId(targetUser.id);
      setStatusMsg(null);
      setErrorMsg(null);
      await putUserFeatureFlags(targetUser.id, editingFlags[targetUser.id] || []);
      setStatusMsg(t('pages.userManagement.flags_saved_success', { email: targetUser.email || '' }));
      setTimeout(() => setStatusMsg(null), 3000);
      fetchUsers();
    } catch (err) {
      console.error('Save flags error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update flags');
    } finally {
      setSavingUserId(null);
    }
  };

  return { users, loading, search, setSearch, editingFlags, savingUserId, statusMsg, errorMsg, handleToggleFlag, handleSaveFlags };
}
