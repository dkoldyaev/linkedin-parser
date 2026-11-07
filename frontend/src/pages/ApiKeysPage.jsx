import React, { useState, useEffect, useCallback } from 'react';
import {
  Key,
  Code2,
  ExternalLink,
  ShieldAlert,
  Copy,
  Check,
  Trash2,
  Lock,
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useBlueprintGrid } from '../utils/useBlueprintGrid';

export default function ApiKeysPage({ user }) {
  const { t, locale } = useTranslation();
  const userFlags = user?.feature_flags || [];
  const hasApiAccess = userFlags.includes('api_access') || userFlags.includes('admin');

  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [createdKeyToken, setCreatedKeyToken] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  const pageRef = useBlueprintGrid([hasApiAccess, apiKeys, createdKeyToken, loading, locale]);

  const fetchApiKeys = useCallback(async () => {
    if (!hasApiAccess) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/api-keys');
      if (res.status === 403) {
        setError('403');
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApiKeys(data);
        }
      }
    } catch (err) {
      console.error('Failed to load api keys', err);
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [hasApiAccess]);

  useEffect(() => {
    fetchApiKeys();
  }, [fetchApiKeys]);

  const handleGenerateApiKey = async (e) => {
    e.preventDefault();
    if (!hasApiAccess) return;
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() || 'Default API Key' }),
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedKeyToken(data.token);
        setNewKeyName('');
        fetchApiKeys();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || 'Failed to create API key');
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

  const handleRevokeApiKey = async (keyItem) => {
    const confirmMsg = t('settingsModal.revoke_key_confirm').replace('{name}', keyItem.name);
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/api-keys/${keyItem.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to revoke api key', err);
    }
  };

  return (
    <div ref={pageRef} className="info-page bp-page api-keys-page">
      <div className="info-container bp-container">
        {/* Top Blueprint Rail */}
        <header className="info-hero bp-subbar bp-snap" data-min-grids="1">
          <div className="bp-subbar-left">
            <span className="column-dot" style={{ background: 'var(--primary)' }} />
            <h1 className="info-title bp-subbar-title">{t('pages.nav.apikeys')}</h1>
            <span className="bp-subbar-sep">/</span>
            <p className="info-subtitle bp-subbar-subtitle">{t('settingsModal.api_keys_desc')}</p>
          </div>
          {hasApiAccess && (
            <div className="bp-subbar-right">
              <a href="/api/v1/docs" target="_blank" rel="noreferrer" className="btn btn-secondary bp-subbar-btn">
                <ExternalLink size={13} />
                <span>Swagger UI</span>
              </a>
              <a href="/api/v1/redoc" target="_blank" rel="noreferrer" className="btn btn-secondary bp-subbar-btn">
                <ExternalLink size={13} />
                <span>ReDoc</span>
              </a>
              <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="btn btn-secondary bp-subbar-btn">
                <Code2 size={13} />
                <span>openapi.json</span>
              </a>
            </div>
          )}
        </header>

        {!hasApiAccess ? (
          <section className="info-card bp-col">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">01</span>
                <span className="column-dot" style={{ background: '#ef4444' }} />
                <span className="column-name">{t('pages.apiKeys.disabled_title')}</span>
              </div>
            </div>
            <div className="api-locked-card bp-snap" data-min-grids="5">
              <div className="stat-icon danger">
                <Lock size={18} />
              </div>
              <h2 className="api-locked-title">{t('pages.apiKeys.disabled_title')}</h2>
              <p className="api-locked-desc">{t('pages.apiKeys.disabled_desc')}</p>
            </div>
          </section>
        ) : (
          <div className="bp-grid-row" data-cols="2">
            {/* Left Column: Create Key + OpenAPI Documentation */}
            <section className="info-card bp-col">
              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-index">01</span>
                  <span className="column-dot" style={{ background: 'var(--primary)' }} />
                  <h2 className="column-name info-card-title">{t('settingsModal.api_key_name_label')}</h2>
                </div>
              </div>

              <form onSubmit={handleGenerateApiKey} className="api-create-form bp-snap" data-min-grids="2">
                <input
                  type="text"
                  className="form-input api-key-input"
                  placeholder={t('settingsModal.api_key_name_placeholder')}
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={generatingKey}>
                  <Key size={14} />
                  <span>{t('settingsModal.generate_key_btn')}</span>
                </button>
              </form>

              {createdKeyToken && (
                <div className="api-created-token-box bp-snap" data-min-grids="3">
                  <div className="api-created-warning">
                    <ShieldAlert size={15} />
                    <span>{t('settingsModal.new_key_warning')}</span>
                  </div>
                  <div className="api-created-row">
                    <input
                      type="text"
                      readOnly
                      value={createdKeyToken}
                      className="form-input api-token-readonly"
                      onClick={(e) => e.target.select()}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleCopyToken}>
                      {copiedKey ? <Check size={14} /> : <Copy size={14} />}
                      <span>{copiedKey ? t('settingsModal.key_copied') : t('settingsModal.copy_key_btn')}</span>
                    </button>
                  </div>
                </div>
              )}

              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-index">02</span>
                  <span className="column-dot" style={{ background: '#0284c7' }} />
                  <h2 className="column-name info-card-title">{t('settingsModal.openapi_docs_title')}</h2>
                </div>
              </div>

              <div className="api-docs-panel bp-snap" data-min-grids="3">
                <p className="info-text">{t('settingsModal.openapi_docs_desc')}</p>
                <div className="api-docs-links">
                  <a href="/api/v1/docs" target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <ExternalLink size={14} />
                    <span>{t('settingsModal.openapi_swagger_btn')}</span>
                  </a>
                  <a href="/api/v1/redoc" target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <ExternalLink size={14} />
                    <span>{t('settingsModal.openapi_redoc_btn')}</span>
                  </a>
                  <a href="/api/v1/openapi.json" target="_blank" rel="noreferrer" className="btn btn-secondary">
                    <ExternalLink size={14} />
                    <span>{t('settingsModal.openapi_json_btn')}</span>
                  </a>
                </div>
              </div>
            </section>

            {/* Right Column: Active API Keys */}
            <section className="info-card bp-col">
              <div className="column-header">
                <div className="column-title-group">
                  <span className="column-index">03</span>
                  <span className="column-dot" style={{ background: 'var(--aspen-mint)' }} />
                  <h2 className="column-name info-card-title">{t('settingsModal.my_keys_title')}</h2>
                  <span className="column-badge">[{apiKeys.length}]</span>
                </div>
              </div>

              {loading ? (
                <div className="api-keys-empty bp-snap" data-min-grids="2">
                  {t('common.loading')}
                </div>
              ) : apiKeys.length === 0 ? (
                <div className="api-keys-empty bp-snap" data-min-grids="2">
                  {t('settingsModal.no_keys_yet')}
                </div>
              ) : (
                <div className="api-keys-list">
                  {apiKeys.map((k) => (
                    <div key={k.id} className="api-key-row bp-snap" data-min-grids="2">
                      <div className="api-key-info">
                        <div className="api-key-top">
                          <span className="api-key-name">{k.name}</span>
                          <span className="api-key-prefix">{k.key_prefix}••••••••</span>
                        </div>
                        <div className="api-key-meta">
                          <span>
                            {t('settingsModal.key_created_at').replace(
                              '{date}',
                              new Date(k.created_at).toLocaleDateString()
                            )}
                          </span>
                          <span>•</span>
                          <span>
                            {k.last_used_at
                              ? t('settingsModal.key_last_used').replace(
                                  '{date}',
                                  new Date(k.last_used_at).toLocaleDateString()
                                )
                              : t('settingsModal.key_never_used')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn btn-secondary btn-icon api-key-revoke"
                        onClick={() => handleRevokeApiKey(k)}
                        title={t('settingsModal.revoke_key_btn')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
