import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Save, 
  ShieldAlert,
} from 'lucide-react';
import {
  PageLayout,
  Button,
  Icon,
  Input,
  Checkbox,
  Badge,
  Text,
  AlertBanner,
  Spinner,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

export default function UserManagementPage({ user }) {
  const { t, locale } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingFlags, setEditingFlags] = useState({}); // { [userId]: string[] }
  const [savingUserId, setSavingUserId] = useState(null);
  const [statusMsg, setStatusMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const availableFlags = [
    { key: 'api_access', label: t('settingsModal.feature_api_access_title') || 'api_access' },
    { key: 'admin', label: t('settingsModal.feature_admin_title') || 'admin' },
  ];

  const userFlags = user?.feature_flags || [];
  const hasAccess = userFlags.includes('admin');

  const fetchUsers = useCallback(async () => {
    if (!hasAccess) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/users');
      if (res.status === 403) {
        setErrorMsg(t('pages.userManagement.access_denied_desc'));
        setUsers([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
      const initial = {};
      data.forEach(u => {
        initial[u.id] = Array.isArray(u.feature_flags) ? [...u.feature_flags] : [];
      });
      setEditingFlags(initial);
    } catch (err) {
      console.error('Fetch users error:', err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  }, [hasAccess, t]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleFlag = (userId, flagKey) => {
    setEditingFlags(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(flagKey)
        ? current.filter(k => k !== flagKey)
        : [...current, flagKey];
      return { ...prev, [userId]: updated };
    });
  };

  const handleSaveFlags = async (targetUser) => {
    try {
      setSavingUserId(targetUser.id);
      setStatusMsg(null);
      setErrorMsg(null);

      const flags = editingFlags[targetUser.id] || [];
      const res = await fetch(`/api/users/${targetUser.id}/feature-flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: flags })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Failed to update flags');
      }

      setStatusMsg(t('pages.userManagement.flags_saved_success', { email: targetUser.email }));
      setTimeout(() => setStatusMsg(null), 3000);
      fetchUsers();
    } catch (err) {
      console.error('Save flags error:', err);
      setErrorMsg(err.message);
    } finally {
      setSavingUserId(null);
    }
  };

  if (!hasAccess) {
    return (
      <PageLayout gridDeps={[locale]} className="user-management-page">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 'var(--ui-space-12)', textAlign: 'center' }}>
          <div style={{ color: 'var(--ui-danger)', marginBottom: 'var(--ui-space-3)' }}>
            <Icon icon={ShieldAlert} size="lg" />
          </div>
          <Text variant="title" weight="bold" tone="primary" style={{ marginBottom: 'var(--ui-space-2)' }}>
            {t('pages.userManagement.access_denied_title')}
          </Text>
          <Text variant="body" tone="secondary">
            {t('pages.userManagement.access_denied_desc')}
          </Text>
        </div>
      </PageLayout>
    );
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (u.email && u.email.toLowerCase().includes(q)) ||
           (u.name && u.name.toLowerCase().includes(q));
  });

  return (
    <PageLayout
      gridDeps={[users, loading, search, locale]}
      className="user-management-page"
      header={
        <div
          className="bp-subbar bp-snap"
          data-min-grids="1"
          style={{
            height: 'var(--ui-grid-cell)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--ui-space-4)',
            backgroundColor: 'var(--ui-bg-surface)',
            borderBottom: '1px solid var(--ui-pixel-line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-primary)' }} />
            <Text variant="mono" weight="bold" tone="primary">
              {t('pages.userManagement.title')}
            </Text>
            <Text variant="mono" tone="muted">
              /
            </Text>
            <Text variant="caption" tone="secondary">
              {t('pages.userManagement.subtitle')}
            </Text>
          </div>

          <div style={{ width: '260px' }}>
            <Input
              placeholder={t('pages.userManagement.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              startIcon={<Icon icon={Search} size="xs" />}
            />
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)', padding: 'var(--ui-space-4)' }}>
        {statusMsg && <AlertBanner tone="success" title={statusMsg} />}
        {errorMsg && <AlertBanner tone="danger" title={errorMsg} />}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ui-space-12)' }}>
            <Spinner size="lg" />
          </div>
        ) : (
          <div
            style={{
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--ui-pixel-line)', backgroundColor: 'var(--ui-bg-surface)' }}>
                  <th style={{ padding: 'var(--ui-space-3) var(--ui-space-4)', fontFamily: 'var(--ui-font-mono)', fontSize: 'var(--ui-font-size-xs)', textTransform: 'uppercase', color: 'var(--ui-text-secondary)' }}>
                    {t('pages.userManagement.col_user')}
                  </th>
                  <th style={{ padding: 'var(--ui-space-3) var(--ui-space-4)', fontFamily: 'var(--ui-font-mono)', fontSize: 'var(--ui-font-size-xs)', textTransform: 'uppercase', color: 'var(--ui-text-secondary)' }}>
                    {t('pages.userManagement.col_flags')}
                  </th>
                  <th style={{ padding: 'var(--ui-space-3) var(--ui-space-4)', fontFamily: 'var(--ui-font-mono)', fontSize: 'var(--ui-font-size-xs)', textTransform: 'uppercase', color: 'var(--ui-text-secondary)', textAlign: 'right' }}>
                    {t('common.save')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const currentFlags = editingFlags[u.id] || [];
                  const isSaving = savingUserId === u.id;

                  return (
                    <tr
                      key={u.id}
                      style={{ borderBottom: '1px solid var(--ui-border-subtle)' }}
                    >
                      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
                          <Text variant="body" weight="medium" tone="primary">
                            {u.name || '—'}
                          </Text>
                          {u.is_anonymous && (
                            <Badge variant="outline" size="xs" tone="neutral">
                              Guest
                            </Badge>
                          )}
                        </div>
                        <Text variant="caption" tone="secondary">
                          {u.email}
                        </Text>
                      </td>
                      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-4)', flexWrap: 'wrap' }}>
                          {availableFlags.map((flag) => {
                            const isChecked = currentFlags.includes(flag.key);
                            return (
                              <label
                                key={flag.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--ui-space-2)',
                                  cursor: 'pointer',
                                }}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handleToggleFlag(u.id, flag.key)}
                                />
                                <Badge
                                  variant={isChecked ? 'solid' : 'outline'}
                                  tone={isChecked ? 'accent' : 'neutral'}
                                  size="xs"
                                >
                                  {flag.key}
                                </Badge>
                              </label>
                            );
                          })}
                        </div>
                      </td>
                      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)', textAlign: 'right' }}>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={isSaving}
                          onClick={() => handleSaveFlags(u)}
                          startIcon={<Icon icon={Save} size="xs" />}
                        >
                          {t('common.save')}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
