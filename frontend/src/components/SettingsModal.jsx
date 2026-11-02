import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Check, Globe, Columns3, 
  Layers, Plus, Trash2, ArrowUp, ArrowDown, Edit2, Key, Flag,
  Copy, ExternalLink, Code2, ShieldAlert
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import ColumnCreateModal from './ColumnCreateModal';
import ColumnEditModal from './ColumnEditModal';
import ColumnDeleteModal from './ColumnDeleteModal';

export default function SettingsModal({ isOpen, onClose, vacancies = [], onColumnsUpdated, onUserUpdated }) {
  const { t, locale, setLocale, salaryDisplayFormat, setSalaryDisplayFormat } = useTranslation();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'columns' | 'apikeys' | 'features'
  const [selectedLocale, setSelectedLocale] = useState(locale || 'ru');
  const [selectedSalaryFormat, setSelectedSalaryFormat] = useState(salaryDisplayFormat || 'month');
  const [cvServiceToken, setCvServiceToken] = useState('');
  const [columnsList, setColumnsList] = useState([]);
  const [featureFlags, setFeatureFlags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [flagsSavedSuccess, setFlagsSavedSuccess] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [createdKeyToken, setCreatedKeyToken] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Modals inside Settings for Column CRUD
  const [isCreateColOpen, setIsCreateColOpen] = useState(false);
  const [editingCol, setEditingCol] = useState(null);
  const [deletingCol, setDeletingCol] = useState(null);

  const fetchUser = () => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(u => {
        if (u && Array.isArray(u.feature_flags)) {
          setFeatureFlags(u.feature_flags);
        }
      })
      .catch(err => console.error('Failed to load user info', err));
  };

  const fetchApiKeys = () => {
    fetch('/api/api-keys')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setApiKeys(data);
        }
      })
      .catch(err => console.error('Failed to load api keys', err));
  };
  };

  const fetchSettings = () => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.locale) {
          setSelectedLocale(data.locale);
          setLocale(data.locale);
        }
        if (data.salary_display_format) {
          setSelectedSalaryFormat(data.salary_display_format);
          setSalaryDisplayFormat(data.salary_display_format);
        }
        if (data.cv_service_token !== undefined) {
          setCvServiceToken(data.cv_service_token || '');
        }
        if (data.columns && Array.isArray(data.columns)) {
          setColumnsList(data.columns);
        }
      })
      .catch(err => console.error('Failed to load settings', err));
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchUser();
      fetchApiKeys();
    }
  }, [isOpen, setLocale]);

  if (!isOpen) return null;

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        locale: selectedLocale,
        salary_display_format: selectedSalaryFormat,
        cv_service_token: cvServiceToken.trim(),
      };

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        trackEvent(EVENTS.LANGUAGE_CHANGE, {
          locale: selectedLocale
        });
        setLocale(selectedLocale);
        setSalaryDisplayFormat(selectedSalaryFormat);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 2500);
      }
    } catch (err) {
      console.error('Failed to save settings', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateColumn = async (newColData) => {
    const res = await fetch('/api/columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newColData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to create column');
    }
    const updated = await res.json();
    setColumnsList(updated);
    if (onColumnsUpdated) onColumnsUpdated(updated);
  };

  const handleSaveColumn = async (colId, updateData) => {
    const res = await fetch(`/api/columns/${encodeURIComponent(colId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to update column');
    }
    const updated = await res.json();
    setColumnsList(updated);
    if (onColumnsUpdated) onColumnsUpdated(updated);
  };

  const handleDeleteColumn = async (colId, migrateTo) => {
    const res = await fetch(`/api/columns/${encodeURIComponent(colId)}?migrate_to=${encodeURIComponent(migrateTo)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to delete column');
    }
    const updated = await res.json();
    setColumnsList(updated);
    if (onColumnsUpdated) onColumnsUpdated(updated);
  };

  const handleMoveColumn = async (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= columnsList.length) return;

    // Keep "Отказ" at bottom if present
    const newCols = [...columnsList];
    const [moved] = newCols.splice(index, 1);
    newCols.splice(targetIdx, 0, moved);

    setColumnsList(newCols);

    try {
      const res = await fetch('/api/columns/order', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: newCols })
      });
      if (res.ok) {
        const updated = await res.json();
        setColumnsList(updated);
        if (onColumnsUpdated) onColumnsUpdated(updated);
      }
    } catch (err) {
      console.error('Failed to reorder columns', err);
      fetchSettings();
    }
  };

  const handleToggleLanes = async (col) => {
    await handleSaveColumn(col.id, { has_lanes: !col.has_lanes });
  };

  const handleToggleFeature = async (flagName) => {
    const nextFlags = featureFlags.includes(flagName)
      ? featureFlags.filter(f => f !== flagName)
      : [...featureFlags, flagName];
    setFeatureFlags(nextFlags);
    try {
      const res = await fetch('/api/auth/me/feature-flags', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feature_flags: nextFlags }),
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setFlagsSavedSuccess(true);
        setTimeout(() => setFlagsSavedSuccess(false), 2000);
        if (onUserUpdated) onUserUpdated(updatedUser);
      }
    } catch (err) {
      console.error('Failed to update feature flags', err);
    }
  };

  const handleGenerateApiKey = async (e) => {
    e.preventDefault();
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || 'Default API Key' })
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKeyToken(data.token);
        setNewKeyName('');
        fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to generate api key', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyItem) => {
    const confirmMsg = t('settingsModal.revoke_key_confirm').replace('{name}', keyItem.name);
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/api-keys/${keyItem.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to revoke api key', err);
    }
  };

  const handleCopyToken = () => {
    if (!createdKeyToken) return;
    navigator.clipboard.writeText(createdKeyToken);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };
  const funnelColumns = columnsList.filter(c => c.id !== 'Отказ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: activeTab === 'columns' ? '560px' : activeTab === 'apikeys' ? '580px' : '460px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <Settings size={20} color="#6366f1" />
            <span>{t('settingsModal.title')}</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Globe size={15} />
            <span>{t('settingsModal.tab_general')}</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'columns' ? 'active' : ''}`}
            onClick={() => setActiveTab('columns')}
          >
            <Columns3 size={15} />
            <span>{t('settingsModal.tab_columns')}</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'apikeys' ? 'active' : ''}`}
            onClick={() => setActiveTab('apikeys')}
          >
            <Key size={15} />
            <span>{t('settingsModal.tab_api_keys')}</span>
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === 'features' ? 'active' : ''}`}
            onClick={() => setActiveTab('features')}
          >
            <Flag size={15} />
            <span>{t('settingsModal.tab_features')}</span>
          </button>
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <form onSubmit={handleSaveGeneral}>
            <div className="modal-body">
              {/* Language Selector */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} />
                  <span>{t('settingsModal.language_section_title')}</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '8px' }}>
                  <div
                    onClick={() => setSelectedLocale('ru')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: selectedLocale === 'ru' ? 'var(--primary)' : 'var(--border-subtle)',
                      background: selectedLocale === 'ru' ? 'var(--primary-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <strong style={{ color: selectedLocale === 'ru' ? '#a5b4fc' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                      🇷🇺 {t('settingsModal.language_ru')}
                    </strong>
                    {selectedLocale === 'ru' && <Check size={16} color="#6366f1" />}
                  </div>

                  <div
                    onClick={() => setSelectedLocale('en')}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid',
                      borderColor: selectedLocale === 'en' ? 'var(--primary)' : 'var(--border-subtle)',
                      background: selectedLocale === 'en' ? 'var(--primary-light)' : 'var(--bg-card)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <strong style={{ color: selectedLocale === 'en' ? '#a5b4fc' : 'var(--text-primary)', fontSize: '0.875rem' }}>
                      🇬🇧 {t('settingsModal.language_en')}
                    </strong>
                    {selectedLocale === 'en' && <Check size={16} color="#6366f1" />}
                  </div>
                </div>
              </div>

              {/* Salary Format Selector */}
              <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Globe size={15} />
                  <span>{t('settingsModal.salary_format_title')}</span>
                </label>
                <select
                  className="form-input"
                  value={selectedSalaryFormat}
                  onChange={e => setSelectedSalaryFormat(e.target.value)}
                  style={{ marginTop: '8px' }}
                >
                  <option value="month">{t('settingsModal.salary_format_month')}</option>
                  <option value="hour">{t('settingsModal.salary_format_hour')}</option>
                  <option value="year">{t('settingsModal.salary_format_year')}</option>
                  <option value="day">{t('settingsModal.salary_format_day')}</option>
                  <option value="original">{t('settingsModal.salary_format_original')}</option>
                </select>
              </div>

              {/* CV Service Token */}
              <div className="form-group" style={{ marginTop: '16px', marginBottom: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Key size={15} />
                  <span>{t('settingsModal.cv_token_label')}</span>
                </label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="cvt_..."
                  value={cvServiceToken}
                  onChange={e => setCvServiceToken(e.target.value)}
                  style={{ marginTop: '8px' }}
                />
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: 0 }}>
                  {t('settingsModal.cv_token_hint')}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              {savedSuccess && (
                <span style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={16} /> {t('settingsModal.settings_saved')}
                </span>
              )}
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                {t('settingsModal.cancel_btn')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {t('settingsModal.save_btn')}
              </button>
            </div>
          </form>
        )}

        {/* Columns Tab */}
        {activeTab === 'columns' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {t('settingsModal.columns_desc')}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '6px 12px', gap: '6px' }}
                onClick={() => setIsCreateColOpen(true)}
              >
                <Plus size={14} color="#6366f1" />
                <span>{t('kanban.add_column')}</span>
              </button>
            </div>

            <div className="columns-settings-list">
              {columnsList.map((col, index) => {
                const isBase = col.id === 'Еще не написан' || col.id === 'Отказ';
                const colName = t(`kanban.columns.${col.id}`);
                const isFirst = index === 0;
                const isLast = index === columnsList.length - 1;

                return (
                  <div key={col.id} className="column-setting-row">
                    <div className="column-setting-left">
                      <span className="column-dot" style={{ background: col.color }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {colName}
                          </span>
                          {isBase && (
                            <span style={{
                              fontSize: '0.6875rem',
                              color: 'var(--text-muted)',
                              background: 'rgba(255, 255, 255, 0.05)',
                              padding: '1px 6px',
                              borderRadius: '4px'
                            }}>
                              {t('settingsModal.col_is_base_badge')}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '0.75rem', color: col.has_lanes ? '#d97706' : 'var(--text-muted)' }}>
                            <input
                              type="checkbox"
                              checked={Boolean(col.has_lanes)}
                              onChange={() => handleToggleLanes(col)}
                              style={{ width: '12px', height: '12px' }}
                            />
                            <Layers size={11} />
                            <span>{col.has_lanes ? t('settingsModal.col_stages_enabled') : t('settingsModal.col_no_stages')}</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="column-setting-right">
                      {/* Move Up / Down */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        disabled={isFirst}
                        onClick={() => handleMoveColumn(index, -1)}
                        title={t('settingsModal.col_move_up')}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        disabled={isLast}
                        onClick={() => handleMoveColumn(index, 1)}
                        title={t('settingsModal.col_move_down')}
                      >
                        <ArrowDown size={12} />
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        onClick={() => setEditingCol(col)}
                        title={t('kanban.edit_column')}
                      >
                        <Edit2 size={12} />
                      </button>

                      {/* Delete */}
                      {!isBase && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-icon"
                          style={{ width: '26px', height: '26px', color: '#f87171' }}
                          onClick={() => setDeletingCol(col)}
                          title={t('kanban.delete_column')}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="modal-footer" style={{ marginTop: '10px', padding: '12px 0 0 0' }}>
              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t('vacancyModal.close_btn')}
              </button>
            </div>
          </div>
        )}

        {/* Feature Flags Tab */}
        {activeTab === 'features' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
              {t('settingsModal.features_desc')}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: 'var(--radius-md, 8px)',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {t('settingsModal.feature_cv_edit_title')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                    {t('settingsModal.feature_cv_edit_desc')}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={featureFlags.includes('cv_edit') || featureFlags.includes('cv_editing')}
                    onChange={() => handleToggleFeature('cv_edit')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: 'var(--radius-md, 8px)',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {t('settingsModal.feature_user_mgmt_title')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                    {t('settingsModal.feature_user_mgmt_desc')}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={featureFlags.includes('user_management') || featureFlags.includes('admin')}
                    onChange={() => handleToggleFeature('user_management')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: 'var(--radius-md, 8px)',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {t('settingsModal.feature_api_access_title')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                    {t('settingsModal.feature_api_access_desc')}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={featureFlags.includes('api_access')}
                    onChange={() => handleToggleFeature('api_access')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </label>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-card, #1e293b)',
                  border: '1px solid var(--border-subtle, #334155)',
                  borderRadius: 'var(--radius-md, 8px)',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary, #f8fafc)' }}>
                    {t('settingsModal.feature_admin_title')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginTop: '2px' }}>
                    {t('settingsModal.feature_admin_desc')}
                  </div>
                </div>

                <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                  <input
                    type="checkbox"
                    checked={featureFlags.includes('admin')}
                    onChange={() => handleToggleFeature('admin')}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#6366f1' }}
                  />
                </label>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '10px', padding: '12px 0 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                {flagsSavedSuccess && (
                  <span style={{ color: '#10b981', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} /> {t('settingsModal.settings_saved')}
                  </span>
                )}
              </div>
        {/* API Keys & OpenAPI Tab */}
        {activeTab === 'apikeys' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              {t('settingsModal.api_keys_desc')}
            </p>

            {/* OpenAPI Documentation Links Banner */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '0.875rem', fontWeight: 600 }}>
                <Code2 size={16} />
                <span>{t('settingsModal.openapi_docs_title')}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>
                {t('settingsModal.openapi_docs_desc')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                <a
                  href="/api/v1/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} />
                  <span>{t('settingsModal.openapi_swagger_btn')}</span>
                </a>
                <a
                  href="/api/v1/redoc"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} />
                  <span>{t('settingsModal.openapi_redoc_btn')}</span>
                </a>
                <a
                  href="/api/v1/openapi.json"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '5px 10px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  <ExternalLink size={12} />
                  <span>{t('settingsModal.openapi_json_btn')}</span>
                </a>
              </div>
            </div>

            {/* Newly Created Key Alert Box */}
            {createdKeyToken && (
              <div style={{
                background: 'rgba(234, 179, 8, 0.1)',
                border: '1px solid rgba(234, 179, 8, 0.4)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '0.8125rem', fontWeight: 600 }}>
                  <ShieldAlert size={16} />
                  <span>{t('settingsModal.new_key_warning')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={createdKeyToken}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem', padding: '6px 10px', background: 'rgba(0, 0, 0, 0.3)' }}
                    onClick={e => e.target.select()}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleCopyToken}
                    style={{ whiteSpace: 'nowrap', fontSize: '0.8125rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copiedKey ? t('settingsModal.key_copied') : t('settingsModal.copy_key_btn')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Create New Key Form */}
            <form onSubmit={handleGenerateApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="form-label" style={{ fontSize: '0.8125rem', fontWeight: 600 }}>
                {t('settingsModal.api_key_name_label')}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('settingsModal.api_key_name_placeholder')}
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={generatingKey}
                  style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Key size={14} />
                  <span>{t('settingsModal.generate_key_btn')}</span>
                </button>
              </div>
            </form>

            {/* Existing Keys List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {t('settingsModal.my_keys_title')}
              </span>

              {apiKeys.length === 0 ? (
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                  {t('settingsModal.no_keys_yet')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {apiKeys.map(k => (
                    <div
                      key={k.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-md)',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
                        <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                          {k.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          <span style={{ fontFamily: 'monospace', color: '#a5b4fc' }}>
                            {k.key_prefix}••••••••
                          </span>
                          <span>
                            {t('settingsModal.key_created_at').replace('{date}', new Date(k.created_at).toLocaleDateString())}
                          </span>
                          <span>
                            {k.last_used_at 
                              ? t('settingsModal.key_last_used').replace('{date}', new Date(k.last_used_at).toLocaleDateString())
                              : t('settingsModal.key_never_used')
                            }
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ width: '28px', height: '28px', color: '#f87171', flexShrink: 0 }}
                        onClick={() => handleRevokeApiKey(k)}
                        title={t('settingsModal.revoke_key_btn')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ marginTop: '10px', padding: '12px 0 0 0' }}>

              <button type="button" className="btn btn-primary" onClick={onClose}>
                {t('vacancyModal.close_btn')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Internal Modals */}
      <ColumnCreateModal
        isOpen={isCreateColOpen}
        onClose={() => setIsCreateColOpen(false)}
        onCreate={handleCreateColumn}
      />

      <ColumnEditModal
        isOpen={Boolean(editingCol)}
        column={editingCol}
        onClose={() => setEditingCol(null)}
        onSave={handleSaveColumn}
      />

      <ColumnDeleteModal
        isOpen={Boolean(deletingCol)}
        column={deletingCol}
        availableColumns={funnelColumns}
        vacanciesCount={deletingCol ? vacancies.filter(v => v.status === deletingCol.id).length : 0}
        onClose={() => setDeletingCol(null)}
        onConfirm={handleDeleteColumn}
      />
    </div>
  );
}
