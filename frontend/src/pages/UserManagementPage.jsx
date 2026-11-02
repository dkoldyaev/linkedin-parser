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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users style={{ color: '#3b82f6' }} size={28} />
            {t('pages.userManagement.title')}
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>
            {t('pages.userManagement.subtitle')}
          </p>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            type="text"
            placeholder={t('pages.userManagement.search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '8px',
              color: '#f8fafc',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
        </div>
      </div>

      {statusMsg && (
        <div style={{ background: '#05966922', border: '1px solid #059669', color: '#6ee7b7', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={18} />
          <span>{statusMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader2 size={32} className="spin" style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', background: '#1e293b' }}>
                <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>{t('pages.userManagement.col_user')}</th>
                <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600 }}>{t('pages.userManagement.col_flags')}</th>
                <th style={{ padding: '12px 16px', color: '#cbd5e1', fontWeight: 600, textAlign: 'right' }}>{t('common.save')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                    {t('common.empty') || 'No users found'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => {
                  const flags = editingFlags[u.id] || [];
                  const isSaving = savingUserId === u.id;

                  return (
                    <tr key={u.id} style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '16px', verticalAlign: 'top', width: '280px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {u.picture ? (
                            <img src={u.picture} alt="" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
                          ) : (
                            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                              {(u.name || u.email || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontWeight: 600, color: '#f8fafc' }}>{u.name || 'Anonymous'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '16px', verticalAlign: 'top' }}>
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
                                  padding: '8px 12px',
                                  background: isChecked ? 'rgba(99, 102, 241, 0.12)' : '#1e293b',
                                  border: `1px solid ${isChecked ? '#2563eb' : '#334155'}`,
                                  borderRadius: '8px',
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
                                    width: '16px',
                                    height: '16px',
                                    accentColor: '#2563eb',
                                    cursor: 'pointer'
                                  }}
                                />
                                <span style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 500,
                                  color: isChecked ? '#c7d2fe' : '#94a3b8'
                                }}>
                                  {flagObj.label}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </td>

                      <td style={{ padding: '16px', verticalAlign: 'top', textAlign: 'right' }}>
                        <button
                          type="button"
                          disabled={isSaving}
                          onClick={() => handleSaveUser(u.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 500
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
