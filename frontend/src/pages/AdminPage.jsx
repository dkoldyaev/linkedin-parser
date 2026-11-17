import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  CheckCircle2, 
  ShieldAlert, 
  Save, 
  Loader2, 
  AlertTriangle,
  Briefcase,
  Clock,
  Activity,
  Calendar,
  Cpu,
  Key,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  UserX,
  Filter
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function AdminPage({ user }) {
  const { t, formatDate } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // 'all' | 'registered' | 'guests'
  const [sortField, setSortField] = useState('created_at'); // 'created_at' | 'last_login_at' | 'last_board_interaction_at' | 'llm_tokens' | 'vacancies' | 'name'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
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
      const res = await fetch('/api/v2/admin/users');
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
      const res = await fetch(`/api/v2/admin/users/${targetUser.id}`, {
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
      const res = await fetch(`/api/v2/admin/users/${userId}`, {
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

  const handleHeaderSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    return users
      .filter(u => {
        // Filter by guest / registered
        if (userTypeFilter === 'guests' && !u.is_anonymous) return false;
        if (userTypeFilter === 'registered' && u.is_anonymous) return false;

        // Search
        if (search) {
          const q = search.toLowerCase();
          const matchEmail = u.email && u.email.toLowerCase().includes(q);
          const matchName = u.name && u.name.toLowerCase().includes(q);
          if (!matchEmail && !matchName) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = 0;
        let valB = 0;

        switch (sortField) {
          case 'name':
            valA = (a.name || a.email || '').toLowerCase();
            valB = (b.name || b.email || '').toLowerCase();
            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;

          case 'llm_tokens':
            valA = a.stats?.llm_tokens?.total_tokens || 0;
            valB = b.stats?.llm_tokens?.total_tokens || 0;
            break;

          case 'vacancies':
            valA = a.stats?.total_vacancies || 0;
            valB = b.stats?.total_vacancies || 0;
            break;

          case 'last_login_at':
            valA = a.last_login_at || a.stats?.last_login_at ? new Date(a.last_login_at || a.stats?.last_login_at).getTime() : 0;
            valB = b.last_login_at || b.stats?.last_login_at ? new Date(b.last_login_at || b.stats?.last_login_at).getTime() : 0;
            break;

          case 'last_board_interaction_at':
            valA = a.last_board_interaction_at || a.stats?.last_board_interaction_at ? new Date(a.last_board_interaction_at || a.stats?.last_board_interaction_at).getTime() : 0;
            valB = b.last_board_interaction_at || b.stats?.last_board_interaction_at ? new Date(b.last_board_interaction_at || b.stats?.last_board_interaction_at).getTime() : 0;
            break;

          case 'created_at':
          default:
            valA = a.created_at ? new Date(a.created_at).getTime() : 0;
            valB = b.created_at ? new Date(b.created_at).getTime() : 0;
            break;
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [users, search, userTypeFilter, sortField, sortOrder]);

  const guestCount = useMemo(() => users.filter(u => u.is_anonymous).length, [users]);
  const registeredCount = users.length - guestCount;

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

  const renderSortIndicator = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} style={{ opacity: 0.35, marginLeft: 4, verticalAlign: 'middle' }} />;
    }
    return sortOrder === 'asc' 
      ? <ArrowUp size={12} style={{ color: 'var(--primary)', marginLeft: 4, verticalAlign: 'middle' }} />
      : <ArrowDown size={12} style={{ color: 'var(--primary)', marginLeft: 4, verticalAlign: 'middle' }} />;
  };

  return (
    <div className="info-page admin-page">
      <div className="info-container" style={{ maxWidth: '1280px' }}>
        {/* Header */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="badge" style={{ padding: '6px 12px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20 }}>
              <Users size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: '-2px' }} />
              {t('pages.admin.user_count', { count: users.length })}
            </span>
            <span className="badge" style={{ padding: '6px 12px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, color: 'var(--text-muted)' }}>
              <UserX size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: '-2px', color: '#f59e0b' }} />
              {t('pages.admin.guest_badge')}: {guestCount}
            </span>
            <span className="badge" style={{ padding: '6px 12px', fontSize: 13, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 20, color: 'var(--text-muted)' }}>
              <UserCheck size={14} style={{ marginRight: 6, display: 'inline', verticalAlign: '-2px', color: '#10b981' }} />
              {t('pages.admin.filter_type_registered')}: {registeredCount}
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

        {/* Toolbar: Search, Filters, Sorters and View Switcher */}
        <div className="info-card" style={{ marginBottom: 20, padding: 16 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', flex: '1 1 240px', minWidth: '220px' }}>
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

            {/* Filter Buttons: All / Registered / Guests */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--bg-app)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn ${userTypeFilter === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                onClick={() => setUserTypeFilter('all')}
              >
                {t('pages.admin.filter_type_all')} ({users.length})
              </button>
              <button
                type="button"
                className={`btn ${userTypeFilter === 'registered' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                onClick={() => setUserTypeFilter('registered')}
              >
                <UserCheck size={13} style={{ marginRight: 4 }} />
                {t('pages.admin.filter_type_registered')} ({registeredCount})
              </button>
              <button
                type="button"
                className={`btn ${userTypeFilter === 'guests' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6 }}
                onClick={() => setUserTypeFilter('guests')}
              >
                <UserX size={13} style={{ marginRight: 4 }} />
                {t('pages.admin.filter_type_guests')} ({guestCount})
              </button>
            </div>

            {/* Sort Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <ArrowUpDown size={13} />
                {t('pages.admin.sort_by')}:
              </span>
              <select
                className="form-select"
                style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6 }}
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortField(field);
                  setSortOrder(order);
                }}
              >
                <option value="created_at-desc">{t('pages.admin.sort_created_desc')}</option>
                <option value="created_at-asc">{t('pages.admin.sort_created_asc')}</option>
                <option value="last_login_at-desc">{t('pages.admin.sort_login_desc')}</option>
                <option value="last_board_interaction_at-desc">{t('pages.admin.sort_board_desc')}</option>
                <option value="llm_tokens-desc">{t('pages.admin.sort_tokens_desc')}</option>
                <option value="llm_tokens-asc">{t('pages.admin.sort_tokens_asc')}</option>
                <option value="vacancies-desc">{t('pages.admin.sort_vacancies_desc')}</option>
                <option value="name-asc">{t('pages.admin.sort_name_asc')}</option>
              </select>
            </div>

            {/* View Mode Switcher: Table / Cards */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: 'var(--bg-app)', padding: 3, borderRadius: 8, border: '1px solid var(--border-color)' }}>
              <button
                type="button"
                className={`btn ${viewMode === 'table' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6 }}
                onClick={() => setViewMode('table')}
                title={t('pages.admin.view_table')}
              >
                <TableIcon size={14} />
                <span style={{ marginLeft: 4 }}>{t('pages.admin.view_table')}</span>
              </button>
              <button
                type="button"
                className={`btn ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6 }}
                onClick={() => setViewMode('cards')}
                title={t('pages.admin.view_cards')}
              >
                <LayoutGrid size={14} />
                <span style={{ marginLeft: 4 }}>{t('pages.admin.view_cards')}</span>
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div className="info-card" style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
            <Filter size={32} style={{ opacity: 0.4, margin: '0 auto 12px' }} />
            <div style={{ fontSize: 15, fontWeight: 500 }}>Пользователи не найдены</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Попробуйте изменить поисковый запрос или фильтр по гостям</div>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="info-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-app)' }}>
                    <th 
                      onClick={() => handleHeaderSort('name')}
                      style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {t('pages.admin.col_user')} {renderSortIndicator('name')}
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {t('pages.admin.col_role')}
                    </th>
                    <th 
                      onClick={() => handleHeaderSort('created_at')}
                      style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {t('pages.admin.col_created')} {renderSortIndicator('created_at')}
                    </th>
                    <th 
                      onClick={() => handleHeaderSort('last_login_at')}
                      style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {t('pages.admin.col_last_login')} {renderSortIndicator('last_login_at')}
                    </th>
                    <th 
                      onClick={() => handleHeaderSort('last_board_interaction_at')}
                      style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    >
                      {t('pages.admin.col_last_board_interaction')} {renderSortIndicator('last_board_interaction_at')}
                    </th>
                    <th 
                      onClick={() => handleHeaderSort('vacancies')}
                      style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: 'right' }}
                    >
                      {t('pages.admin.col_vacancies')} {renderSortIndicator('vacancies')}
                    </th>
                    <th 
                      onClick={() => handleHeaderSort('llm_tokens')}
                      style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap', textAlign: 'right' }}
                    >
                      {t('pages.admin.col_tokens')} {renderSortIndicator('llm_tokens')}
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {t('pages.admin.col_flags')}
                    </th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {t('pages.admin.col_actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedUsers.map((u) => {
                    const uFlags = editingFlags[u.id] || [];
                    const isUserAdmin = uFlags.includes('admin');
                    const isSaving = savingUserId === u.id;
                    const totalTokens = u.stats?.llm_tokens?.total_tokens || 0;
                    const totalVacancies = u.stats?.total_vacancies || 0;

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.15s ease' }}>
                        {/* User info */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {u.picture ? (
                              <img src={u.picture} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.is_anonymous ? 'rgba(245, 158, 11, 0.15)' : 'var(--col-applied-bg)', color: u.is_anonymous ? '#f59e0b' : 'var(--col-applied)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 13 }}>
                                {(u.name || u.email || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <strong style={{ fontSize: 13, color: 'var(--text-main)' }}>{u.name || '—'}</strong>
                                {user.id === u.id && (
                                  <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '1px 5px', borderRadius: 4 }}>
                                    (Вы)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono, monospace)' }}>
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role / Guest Badge */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                            {u.is_anonymous ? (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600,
                                background: 'rgba(245, 158, 11, 0.12)',
                                color: '#f59e0b',
                                border: '1px solid rgba(245, 158, 11, 0.3)'
                              }}>
                                {t('pages.admin.guest_badge')}
                              </span>
                            ) : (
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 12,
                                fontSize: 11,
                                fontWeight: 600,
                                background: isUserAdmin ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-item)',
                                color: isUserAdmin ? '#2563eb' : 'var(--text-muted)',
                                border: `1px solid ${isUserAdmin ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`
                              }}>
                                {isUserAdmin ? t('pages.admin.admin_badge') : t('pages.admin.user_badge')}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Registration Date */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {u.created_at ? formatDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        {/* Last Login */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {u.last_login_at || u.stats?.last_login_at 
                            ? formatDate(u.last_login_at || u.stats?.last_login_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                            : t('pages.admin.never')}
                        </td>

                        {/* Last Board Activity */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', color: 'var(--text-muted)', fontSize: 12, whiteSpace: 'nowrap' }}>
                          {u.last_board_interaction_at || u.stats?.last_board_interaction_at 
                            ? formatDate(u.last_board_interaction_at || u.stats?.last_board_interaction_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
                            : t('pages.admin.never')}
                        </td>

                        {/* Vacancies count */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: 12,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: totalVacancies > 0 ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-app)',
                            color: totalVacancies > 0 ? 'var(--primary)' : 'var(--text-muted)',
                            border: '1px solid var(--border-color)'
                          }}>
                            {totalVacancies}
                          </span>
                        </td>

                        {/* LLM Tokens spent */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span style={{
                              fontWeight: 700,
                              fontSize: 12,
                              color: totalTokens > 0 ? 'var(--primary)' : 'var(--text-muted)'
                            }}>
                              {totalTokens.toLocaleString()}
                            </span>
                            {totalTokens > 0 && (
                              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                {u.stats?.llm_tokens?.total_requests || 0} req
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Permissions (checkboxes) */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {availableFlags.map(flagObj => {
                              const isChecked = uFlags.includes(flagObj.key);
                              return (
                                <label
                                  key={flagObj.key}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '3px 8px',
                                    background: isChecked ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-app)',
                                    border: `1px solid ${isChecked ? '#2563eb' : 'var(--border-color)'}`,
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    fontSize: 11,
                                    userSelect: 'none'
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => handleToggleFlag(u.id, flagObj.key)}
                                    style={{ width: 13, height: 13, accentColor: '#2563eb', cursor: 'pointer' }}
                                  />
                                  <span style={{ color: isChecked ? 'var(--text-main)' : 'var(--text-muted)', fontWeight: isChecked ? 600 : 400 }}>
                                    {flagObj.key}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </td>

                        {/* Actions: Save button & Admin toggle */}
                        <td style={{ padding: '12px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              disabled={isSaving}
                              onClick={() => handleSaveUserFlags(u.id)}
                              title={t('pages.admin.save_flags')}
                            >
                              {isSaving ? <Loader2 size={12} className="spin" /> : <Save size={12} />}
                              <span>{t('common.save')}</span>
                            </button>
                            <button
                              type="button"
                              className={`btn ${isUserAdmin ? 'btn-ghost' : 'btn-secondary'}`}
                              style={{ padding: '4px 8px', fontSize: 11 }}
                              disabled={isSaving || (user.id === u.id && isUserAdmin)}
                              onClick={() => handleToggleAdmin(u)}
                              title={user.id === u.id && isUserAdmin ? "Нельзя снять права администратора с себя" : ""}
                            >
                              {isUserAdmin ? t('pages.admin.toggle_admin_revoke') : t('pages.admin.toggle_admin_grant')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARDS VIEW */
          <div className="admin-user-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filteredAndSortedUsers.map((u) => {
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
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.is_anonymous ? 'rgba(245, 158, 11, 0.15)' : 'var(--col-applied-bg)', color: u.is_anonymous ? '#f59e0b' : 'var(--col-applied)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16 }}>
                          {(u.name || u.email || 'U')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 16, color: 'var(--text-main)' }}>{u.name || '—'}</strong>
                          {u.is_anonymous ? (
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              fontSize: 12, 
                              fontWeight: 600,
                              background: 'rgba(245, 158, 11, 0.15)', 
                              color: '#f59e0b',
                              border: '1px solid rgba(245, 158, 11, 0.3)'
                            }}>
                              {t('pages.admin.guest_badge')}
                            </span>
                          ) : (
                            <span style={{ 
                              padding: '2px 8px', 
                              borderRadius: 12, 
                              fontSize: 12, 
                              fontWeight: 600,
                              background: isUserAdmin ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-item)', 
                              color: isUserAdmin ? '#2563eb' : 'var(--text-muted)',
                              border: `1px solid ${isUserAdmin ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`
                            }}>
                              {isUserAdmin ? t('pages.admin.admin_badge') : t('pages.admin.user_badge')}
                            </span>
                          )}
                          {user.id === u.id && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-app)', padding: '2px 6px', borderRadius: 4 }}>
                              (Вы)
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{u.email}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                          {u.created_at && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <Calendar size={13} style={{ opacity: 0.7 }} />
                              {t('pages.admin.col_created')}: {formatDate(u.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={13} style={{ opacity: 0.7 }} />
                            {t('pages.admin.col_last_login')}: {u.last_login_at || u.stats?.last_login_at ? formatDate(u.last_login_at || u.stats?.last_login_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('pages.admin.never')}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Activity size={13} style={{ opacity: 0.7 }} />
                            {t('pages.admin.col_last_board_interaction')}: {u.last_board_interaction_at || u.stats?.last_board_interaction_at ? formatDate(u.last_board_interaction_at || u.stats?.last_board_interaction_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('pages.admin.never')}
                          </span>
                        </div>
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

                  {/* Vacancy Statistics Section */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Briefcase size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                        {t('pages.admin.vacancies_stat')}
                      </span>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        background: 'var(--bg-app)', 
                        color: 'var(--text-muted)', 
                        padding: '1px 8px', 
                        borderRadius: 10,
                        border: '1px solid var(--border-color)'
                      }}>
                        {t('pages.admin.vacancies_total', { count: u.stats?.total_vacancies ?? 0 })}
                      </span>
                    </div>

                    {u.stats && Object.keys(u.stats.by_status || {}).length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                        {Object.entries(u.stats.by_status).map(([statusKey, count]) => {
                          return (
                            <div
                              key={statusKey}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 8,
                                background: 'var(--bg-app)',
                                border: '1px solid var(--border-color)',
                                fontSize: 12
                              }}
                            >
                              <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                                {statusKey}:
                              </span>
                              <span style={{ 
                                fontWeight: 700, 
                                color: 'var(--primary)',
                                background: 'rgba(99, 102, 241, 0.1)',
                                padding: '1px 6px',
                                borderRadius: 6
                              }}>
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                        {t('pages.admin.vacancies_total', { count: 0 })}
                      </div>
                    )}
                  </div>

                  {/* LLM Token Statistics Section */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Cpu size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                        {t('pages.admin.tokens_stat')}
                      </span>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        background: 'var(--bg-app)', 
                        color: (u.stats?.llm_tokens?.total_tokens ?? 0) > 0 ? 'var(--primary)' : 'var(--text-muted)', 
                        padding: '1px 8px', 
                        borderRadius: 10,
                        border: '1px solid var(--border-color)'
                      }}>
                        {t('pages.admin.tokens_total', { count: (u.stats?.llm_tokens?.total_tokens ?? 0).toLocaleString() })}
                      </span>
                    </div>

                    {u.stats?.llm_tokens && u.stats.llm_tokens.total_tokens > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            fontSize: 12
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('pages.admin.tokens_prompt', { count: (u.stats.llm_tokens.prompt_tokens ?? 0).toLocaleString() })}</span>
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            fontSize: 12
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('pages.admin.tokens_completion', { count: (u.stats.llm_tokens.completion_tokens ?? 0).toLocaleString() })}</span>
                          </div>
                          <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background: 'var(--bg-app)',
                            border: '1px solid var(--border-color)',
                            fontSize: 12
                          }}>
                            <span style={{ color: 'var(--text-muted)' }}>{t('pages.admin.tokens_requests', { count: (u.stats.llm_tokens.total_requests ?? 0).toLocaleString() })}</span>
                          </div>
                        </div>

                        {u.stats.llm_tokens.by_provider && Object.keys(u.stats.llm_tokens.by_provider).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {Object.entries(u.stats.llm_tokens.by_provider).map(([prov, pData]) => (
                              <div
                                key={prov}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '3px 8px',
                                  borderRadius: 6,
                                  background: 'rgba(99, 102, 241, 0.08)',
                                  border: '1px solid rgba(99, 102, 241, 0.2)',
                                  fontSize: 11
                                }}
                              >
                                <strong style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{prov}:</strong>
                                <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{pData.total_tokens.toLocaleString()} tok</span>
                                <span style={{ color: 'var(--text-muted)' }}>({pData.requests} req)</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                        {t('pages.admin.tokens_no_usage')}
                      </div>
                    )}
                  </div>

                  {/* API Keys and Usage Section */}
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                      <Key size={15} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>
                        {t('pages.admin.apikeys_stat')}
                      </span>
                      <span style={{ 
                        fontSize: 12, 
                        fontWeight: 600, 
                        background: 'var(--bg-app)', 
                        color: (u.api_keys?.length || u.stats?.api_keys_count || 0) > 0 ? 'var(--primary)' : 'var(--text-muted)', 
                        padding: '1px 8px', 
                        borderRadius: 10,
                        border: '1px solid var(--border-color)'
                      }}>
                        {t('pages.admin.apikeys_total', { count: u.api_keys?.length ?? (u.stats?.api_keys_count ?? 0) })}
                      </span>
                      {(u.stats?.api_requests_count ?? 0) > 0 && (
                        <span style={{ 
                          fontSize: 12, 
                          fontWeight: 600, 
                          background: 'rgba(99, 102, 241, 0.1)', 
                          color: 'var(--primary)', 
                          padding: '1px 8px', 
                          borderRadius: 10,
                          border: '1px solid rgba(99, 102, 241, 0.2)'
                        }}>
                          {t('pages.admin.apikeys_requests', { count: (u.stats.api_requests_count).toLocaleString() })}
                        </span>
                      )}
                    </div>

                    {u.api_keys && u.api_keys.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                        <div style={{ 
                          overflowX: 'auto',
                          background: 'var(--bg-app)',
                          borderRadius: 8,
                          border: '1px solid var(--border-color)'
                        }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
                            <thead>
                              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>{t('pages.admin.apikeys_key_name')}</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>{t('pages.admin.apikeys_key_prefix')}</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>{t('pages.admin.apikeys_key_created')}</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600 }}>{t('pages.admin.apikeys_key_last_used')}</th>
                                <th style={{ padding: '8px 12px', fontWeight: 600, textAlign: 'right' }}>{t('pages.admin.apikeys_key_requests')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {u.api_keys.map((k) => (
                                <tr key={k.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-main)', fontWeight: 500 }}>
                                    {k.name}
                                  </td>
                                  <td style={{ padding: '8px 12px' }}>
                                    <code style={{ 
                                      fontFamily: 'var(--font-mono, monospace)', 
                                      fontSize: 11,
                                      padding: '2px 6px',
                                      borderRadius: 4,
                                      background: 'var(--bg-card)',
                                      border: '1px solid var(--border-color)',
                                      color: 'var(--primary)'
                                    }}>
                                      {k.key_prefix}...
                                    </code>
                                  </td>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                    {k.created_at ? formatDate(k.created_at, { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                                  </td>
                                  <td style={{ padding: '8px 12px', color: 'var(--text-muted)' }}>
                                    {k.last_used_at ? formatDate(k.last_used_at, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : t('pages.admin.never')}
                                  </td>
                                  <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600, color: (k.request_count || 0) > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                                    {(k.request_count || 0).toLocaleString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                        {t('pages.admin.apikeys_no_keys')}
                      </div>
                    )}
                  </div>

                  {/* Feature Flags Section */}
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
                              border: `1px solid ${isChecked ? '#2563eb' : 'var(--border-color)'}`,
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
            })}
          </div>
        )}
      </div>
    </div>
  );
}
