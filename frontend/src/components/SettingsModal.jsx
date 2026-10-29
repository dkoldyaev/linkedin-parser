import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Check, Globe, Columns3, 
  Layers, Plus, Trash2, ArrowUp, ArrowDown, Edit2,
  Cpu, Copy, Terminal, Key, AlertCircle
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import ColumnCreateModal from './ColumnCreateModal';
import ColumnEditModal from './ColumnEditModal';
import ColumnDeleteModal from './ColumnDeleteModal';

export default function SettingsModal({ isOpen, onClose, vacancies = [], onColumnsUpdated }) {
  const { t, locale, setLocale, salaryDisplayFormat, setSalaryDisplayFormat } = useTranslation();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'columns' | 'mcp'
  const [selectedLocale, setSelectedLocale] = useState(locale || 'ru');
  const [selectedSalaryFormat, setSelectedSalaryFormat] = useState(salaryDisplayFormat || 'month');
  const [columnsList, setColumnsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // MCP / API Tokens state
  const [tokensList, setTokensList] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [newTokenName, setNewTokenName] = useState('');
  const [createdToken, setCreatedToken] = useState(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [configFormat, setConfigFormat] = useState('claude'); // 'claude' | 'cursor' | 'cli'

  // Modals inside Settings for Column CRUD
  const [isCreateColOpen, setIsCreateColOpen] = useState(false);
  const [editingCol, setEditingCol] = useState(null);
  const [deletingCol, setDeletingCol] = useState(null);

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
        if (data.columns && Array.isArray(data.columns)) {
          setColumnsList(data.columns);
        }
      })
      .catch(err => console.error('Failed to load settings', err));
  };

  const fetchTokens = () => {
    setTokensLoading(true);
    fetch('/api/tokens')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTokensList(data);
        }
      })
      .catch(err => console.error('Failed to load tokens', err))
      .finally(() => setTokensLoading(false));
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchTokens();
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

  const handleCreateToken = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName.trim() || 'Default Token' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedToken(data);
        setNewTokenName('');
        fetchTokens();
      }
    } catch (err) {
      console.error('Failed to create token', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteToken = async (tokenId) => {
    if (!window.confirm(t('settingsModal.mcp_delete_token_confirm'))) return;
    try {
      const res = await fetch(`/api/tokens/${tokenId}`, { method: 'DELETE' });
      if (res.ok) {
        if (createdToken && createdToken.id === tokenId) {
          setCreatedToken(null);
        }
        fetchTokens();
      }
    } catch (err) {
      console.error('Failed to delete token', err);
    }
  };

  const handleCopyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleCopyConfig = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000';
  const activeTokenStr = createdToken ? createdToken.token : (tokensList.length > 0 ? tokensList[0].token_prefix : '<YOUR_API_TOKEN>');

  const configSnippet = configFormat === 'cli'
    ? `JOB_TRACKER_URL="${currentOrigin}" JOB_TRACKER_API_KEY="${activeTokenStr}" python3 mcp_server.py`
    : JSON.stringify({
        mcpServers: {
          "job-tracker": {
            command: "python3",
            args: ["mcp_server.py"],
            env: {
              JOB_TRACKER_URL: currentOrigin,
              JOB_TRACKER_API_KEY: activeTokenStr
            }
          }
        }
      }, null, 2);

  const funnelColumns = columnsList.filter(c => c.id !== 'Отказ');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: activeTab === 'columns' ? '560px' : activeTab === 'mcp' ? '620px' : '460px' }}>
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
            className={`settings-tab-btn ${activeTab === 'mcp' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('mcp');
              fetchTokens();
            }}
          >
            <Cpu size={15} />
            <span>{t('settingsModal.tab_mcp')}</span>
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

        {/* MCP / API Tab */}
        {activeTab === 'mcp' && (
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header info */}
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Cpu size={18} color="#6366f1" />
                <span>{t('settingsModal.mcp_title')}</span>
              </h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                {t('settingsModal.mcp_desc')}
              </p>
            </div>

            {/* Create Token Form */}
            <form onSubmit={handleCreateToken} style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.8rem' }}>
                <Key size={14} color="#a5b4fc" />
                <span>{t('settingsModal.mcp_create_token_title')}</span>
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.825rem' }}
                  placeholder={t('settingsModal.mcp_token_name_placeholder')}
                  value={newTokenName}
                  onChange={e => setNewTokenName(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', padding: '7px 14px', fontSize: '0.825rem' }}
                  disabled={loading}
                >
                  <Plus size={14} />
                  <span>{t('settingsModal.mcp_create_token_btn')}</span>
                </button>
              </div>
            </form>

            {/* Created Token Notification Banner */}
            {createdToken && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.12)',
                border: '1px solid var(--primary)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a5b4fc', fontSize: '0.8rem', fontWeight: 600 }}>
                    <AlertCircle size={15} />
                    <span>{t('settingsModal.mcp_token_created_alert')}</span>
                  </div>
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => setCreatedToken(null)}
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <code style={{
                    flex: 1,
                    background: 'var(--bg-card)',
                    padding: '7px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: '#38bdf8',
                    overflowX: 'auto',
                    whiteSpace: 'nowrap',
                    border: '1px solid var(--border-subtle)'
                  }}>
                    {createdToken.token}
                  </code>
                  <button
                    type="button"
                    className={`btn ${copiedToken ? 'btn-success' : 'btn-secondary'}`}
                    onClick={() => handleCopyToken(createdToken.token)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', fontSize: '0.8rem' }}
                  >
                    {copiedToken ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                    <span>{copiedToken ? t('settingsModal.mcp_token_copied') : t('settingsModal.mcp_copy_token')}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Tokens List */}
            <div>
              <div style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                {t('settingsModal.mcp_tokens_list_title')} ({tokensList.length})
              </div>
              {tokensLoading ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('common.loading')}</div>
              ) : tokensList.length === 0 ? (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-muted)',
                  fontSize: '0.8rem',
                  border: '1px dashed var(--border-subtle)'
                }}>
                  {t('settingsModal.mcp_no_tokens')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
                  {tokensList.map(tok => (
                    <div
                      key={tok.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.825rem', color: 'var(--text-primary)' }}>
                          {tok.name}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                          <code style={{ color: '#a5b4fc' }}>{tok.token_prefix}</code>
                          <span>•</span>
                          <span>{t('settingsModal.mcp_col_created')}: {tok.created_at ? tok.created_at.slice(0, 10) : ''}</span>
                          <span>•</span>
                          <span>{tok.last_used_at ? `${t('settingsModal.mcp_col_last_used')}: ${tok.last_used_at.slice(0, 10)}` : t('settingsModal.mcp_never_used')}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn btn-secondary btn-icon"
                        style={{ color: '#f87171', width: '26px', height: '26px' }}
                        onClick={() => handleDeleteToken(tok.id)}
                        title={t('common.delete')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Config Guide Section */}
            <div style={{ marginTop: '2px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {t('settingsModal.mcp_config_guide_title')}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setConfigFormat('claude')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.725rem',
                      borderRadius: 'var(--radius-sm)',
                      background: configFormat === 'claude' ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: configFormat === 'claude' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Claude Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigFormat('cursor')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.725rem',
                      borderRadius: 'var(--radius-sm)',
                      background: configFormat === 'cursor' ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: configFormat === 'cursor' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Cursor / Antigravity
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfigFormat('cli')}
                    style={{
                      padding: '3px 8px',
                      fontSize: '0.725rem',
                      borderRadius: 'var(--radius-sm)',
                      background: configFormat === 'cli' ? 'var(--primary)' : 'var(--bg-secondary)',
                      color: configFormat === 'cli' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    CLI
                  </button>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <pre style={{
                  margin: 0,
                  padding: '10px 12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  fontFamily: 'monospace',
                  fontSize: '0.725rem',
                  lineHeight: 1.4,
                  color: 'var(--text-secondary)',
                  overflowX: 'auto',
                  border: '1px solid var(--border-subtle)'
                }}>
                  {configSnippet}
                </pre>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCopyConfig(configSnippet)}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '6px',
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  {copiedConfig ? <Check size={11} color="#34d399" /> : <Copy size={11} />}
                  <span>{copiedConfig ? t('settingsModal.mcp_token_copied') : t('settingsModal.mcp_copy_config')}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ marginTop: '4px', padding: '10px 0 0 0' }}>
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
