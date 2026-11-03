import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Search, 
  CheckCircle2, 
  Save, 
  Loader2, 
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function UserManagementPage({ user }) {
  const { t } = useTranslation();
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
        ? current.filter(f => f !== flagKey)
        : [...current, flagKey];
      return { ...prev, [userId]: updated };
    });
  };

  const handleSaveUser = async (userId) => {
    setSavingUserId(userId);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/users/${userId}/feature-flags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_flags: editingFlags[userId] || []
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || t('pages.userManagement.save_error'));
      }
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
      setStatusMsg(t('pages.userManagement.save_success'));
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error('Save user flags error:', err);
      setErrorMsg(err.message);
    } finally {
      setSavingUserId(null);
    }
  };

  if (!hasAccess) {
    return (
      <div style={{ maxWidth: '800px', margin: '40px auto', padding: '24px' }}>
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '12px',
          padding: '32px',
          textAlign: 'center',
          color: '#f8fafc'
        }}>
          <ShieldAlert size={48} style={{ color: '#ef4444', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '8px' }}>
            {t('pages.userManagement.access_denied_title')}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            {t('pages.userManagement.access_denied_desc')}
          </p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (u.email && u.email.toLowerCase().includes(q)) ||
           (u.name && u.name.toLowerCase().includes(q));
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', color: 'var(--text-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
            SYS_ADMIN // PERMISSIONS MATRIX
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.03em' }}>
            <Users style={{ color: 'var(--primary)' }} size={26} />
            {t('pages.userManagement.title')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '0.9rem' }}>
            {t('pages.userManagement.subtitle')}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('pages.userManagement.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xs)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--aspen-mint-border)', color: 'var(--aspen-mint-bright)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <CheckCircle2 size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.35)', color: '#fca5a5', padding: '10px 14px', borderRadius: 'var(--radius-xs)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={28} className="spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-blueprint)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-blueprint)', background: '#090a0d' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('pages.userManagement.col_user')}</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t('pages.userManagement.col_flags')}</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'right' }}>{t('common.save')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                    {t('common.empty') || 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const flags = editingFlags[u.id] || [];
                  const isSaving = savingUserId === u.id;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 16px', verticalAlign: 'top', width: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {u.picture ? (
                            <img src={u.picture} alt="" style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)' }} />
                          ) : (
                            <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-xs)', background: 'rgba(37, 99, 235, 0.2)', border: '1px solid var(--border-blueprint)', color: '#93c5fd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                              {(u.name || u.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{u.name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                          {availableFlags.map(flagObj => {
                            const isChecked = flags.includes(flagObj.key);
                            return (
                              <label
                                key={flagObj.key}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  padding: '6px 10px',
                                  background: isChecked ? 'rgba(37, 99, 235, 0.12)' : 'var(--bg-main)',
                                  border: `1px solid ${isChecked ? 'var(--border-blueprint)' : 'var(--border-subtle)'}`,
                                  borderRadius: 'var(--radius-xs)',
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleFlag(u.id, flagObj.key)}
                                  style={{
                                    width: '14px',
                                    height: '14px',
                                    accentColor: 'var(--primary)',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span style={{
                                  fontSize: '0.8rem',
                                  fontWeight: 500,
                                  fontFamily: 'var(--font-mono)',
                                  color: isChecked ? '#93c5fd' : 'var(--text-secondary)'
                                }}>
                                  {flagObj.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={isSaving}
                          onClick={() => handleSaveUser(u.id)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.75rem',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.04em'
                          }}
                        >
                          {isSaving ? <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                          <span>{t('common.save')}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
