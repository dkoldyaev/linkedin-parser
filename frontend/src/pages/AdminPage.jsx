import React, { useState, useEffect, useCallback } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  Save, 
  Loader2, 
  AlertTriangle 
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function AdminPage({ user }) {
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
  const isAdmin = userFlags.includes('admin');

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/users');
      if (res.status === 403) {
        setErrorMsg(t('pages.admin.access_denied_desc'));
        setUsers([]);
        return;
      }
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await res.json();
      setUsers(data);
      // Initialize editing states
      const initialFlags = {};
      data.forEach(u => {
        initialFlags[u.id] = Array.isArray(u.feature_flags) ? [...u.feature_flags] : [];
      });
      setEditingFlags(initialFlags);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('pages.admin.save_error'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [isAdmin, fetchUsers]);

  if (!isAdmin) {
    return (
      <div className="info-page">
        <div className="info-container" style={{ maxWidth: '600px', textAlign: 'center' }}>
          <header className="info-hero">
            <div style={{ display: 'inline-flex', padding: 16, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: 16 }}>
              <ShieldAlert size={48} />
            </div>
            <h1 className="info-title">{t('pages.admin.access_denied_title')}</h1>
            <p className="info-subtitle">{t('pages.admin.access_denied_desc')}</p>
          </header>
        </div>
      </div>
    );
  }

  const handleToggleAdmin = async (targetUser) => {
    const currentFlags = editingFlags[targetUser.id] ?? (targetUser.feature_flags || []);
    const isCurrentlyAdmin = currentFlags.includes('admin');
    const nextFlags = isCurrentlyAdmin
      ? currentFlags.filter(f => f !== 'admin')
      : [...currentFlags, 'admin'];

    setSavingUserId(targetUser.id);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: nextFlags })
      });
      if (!res.ok) throw new Error('Failed to update admin role');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingFlags(prev => ({
        ...prev,
        [updated.id]: Array.isArray(updated.feature_flags) ? [...updated.feature_flags] : []
      }));
      setStatusMsg(t('pages.admin.save_success'));
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('pages.admin.save_error'));
    } finally {
      setSavingUserId(null);
    }
  };

  const handleToggleFlag = (userId, flagKey) => {
    setEditingFlags(prev => {
      const current = prev[userId] || [];
      const updated = current.includes(flagKey)
        ? current.filter(f => f !== flagKey)
        : [...current, flagKey];
      return { ...prev, [userId]: updated };
    });
  };

  const handleSaveUserFlags = async (userId) => {
    setSavingUserId(userId);
    setStatusMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: editingFlags[userId] || [] })
      });
      if (!res.ok) throw new Error('Failed to update user flags');
      const updated = await res.json();
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditingFlags(prev => ({
        ...prev,
        [updated.id]: Array.isArray(updated.feature_flags) ? [...updated.feature_flags] : []
      }));
      setStatusMsg(t('pages.admin.save_success'));
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg(t('pages.admin.save_error'));
    } finally {
      setSavingUserId(null);
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (u.email && u.email.toLowerCase().includes(q)) || 
           (u.name && u.name.toLowerCase().includes(q));
  });

  return (
    <div className="info-page admin-page">
      <div className="info-container" style={{ maxWidth: '1100px' }}>
        <header className="info-hero" style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="stat-icon" style={{ background: 'var(--col-applied-bg)', color: 'var(--col-applied)' }}>
                <Shield size={24} />
              </div>
              <h1 className="info-title" style={{ margin: 0 }}>{t('pages.admin.title')}</h1>
            </div>
            <p className="info-subtitle" style={{ margin: '8px 0 0 0' }}>{t('pages.admin.subtitle')}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="badge" style={{ padding: '6px 12px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20 }}>
              <Users size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: '-2px' }} />
              {t('pages.admin.user_count', { count: users.length })}
            </span>
          </div>
        </header>

        {statusMsg && (
          <div className="alert-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={18} />
            <span>{statusMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="alert-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', color: '#ef4444', padding: '12px 16px', borderRadius: 8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="info-card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 42, width: '100%' }}
              placeholder={t('pages.admin.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div className="admin-user-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredUsers.length === 0 ? (
              <div className="info-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                Пользователи не найдены
              </div>
            ) : (
              filteredUsers.map((u) => {
                const uFlags = editingFlags[u.id] || [];
                const isUserAdmin = uFlags.includes('admin');
                const isSaving = savingUserId === u.id;

                return (
                  <div key={u.id} className="info-card admin-user-card" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        {u.picture ? (
                          <img src={u.picture} alt={u.name} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--col-applied-bg)', color: 'var(--col-applied)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                            {(u.name || u.email || 'U')[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: 16, color: 'var(--text-main)' }}>{u.name || '—'}</strong>
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              fontSize: 12, 
                              fontWeight: 600,
                              background: isUserAdmin ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-item)', 
                              color: isUserAdmin ? '#6366f1' : 'var(--text-muted)',
                              border: `1px solid ${isUserAdmin ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`
                            }}>
                              {isUserAdmin ? t('pages.admin.admin_badge') : t('pages.admin.user_badge')}
                            </span>
                            {user.id === u.id && (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: 4 }}>
                                (Вы)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                          {u.created_at && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {t('pages.admin.col_created')}: {new Date(u.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                          type="button"
                          className={`btn ${isUserAdmin ? 'btn-secondary' : 'btn-primary'}`}
                          style={{ fontSize: 13, padding: '6px 14px' }}
                          disabled={isSaving || (user.id === u.id && isUserAdmin)}
                          onClick={() => handleToggleAdmin(u)}
                          title={user.id === u.id && isUserAdmin ? "Нельзя снять права администратора с себя" : ""}
                        >
                          {isUserAdmin ? t('pages.admin.toggle_admin_revoke') : t('pages.admin.toggle_admin_grant')}
                        </button>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                          {t('pages.admin.col_flags')}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ fontSize: 12, padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          disabled={isSaving}
                          onClick={() => handleSaveUserFlags(u.id)}
                        >
                          {isSaving ? <Loader2 size={13} className="spin" /> : <Save size={13} />}
                          <span>{t('pages.admin.save_flags')}</span>
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {availableFlags.map(flagObj => {
                          const isChecked = uFlags.includes(flagObj.key);
                          return (
                            <label
                              key={flagObj.key}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                background: isChecked ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-app)',
                                border: `1px solid ${isChecked ? '#6366f1' : 'var(--border-color)'}`,
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
                                  accentColor: '#6366f1',
                                  cursor: 'pointer'
                                }}
                              />
                              <span style={{
                                fontSize: '0.85rem',
                                fontWeight: 500,
                                color: isChecked ? 'var(--text-main)' : 'var(--text-muted)'
                              }}>
                                {flagObj.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
