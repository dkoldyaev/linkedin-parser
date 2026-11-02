import React, { useState, useEffect } from 'react';
import { 
  Key, 
  Code2, 
  ExternalLink, 
  ShieldAlert, 
  Copy, 
  Check, 
  Trash2, 
  AlertCircle,
  Lock
} from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function ApiKeysPage({ user }) {
  const { t } = useTranslation();
  const userFlags = user?.feature_flags || [];
  const hasApiAccess = userFlags.includes('api_access') || userFlags.includes('admin');

  const [apiKeys, setApiKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatingKey, setGeneratingKey] = useState(false);
  const [createdKeyToken, setCreatedKeyToken] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApiKeys = async () => {
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
  };

  useEffect(() => {
    fetchApiKeys();
  }, [hasApiAccess]);

  const handleGenerateApiKey = async (e) => {
    e.preventDefault();
    if (!hasApiAccess) return;
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
        method: 'DELETE'
      });
      if (res.ok) {
        fetchApiKeys();
      }
    } catch (err) {
      console.error('Failed to revoke api key', err);
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '880px', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Key size={24} style={{ color: '#2563eb' }} />
          <span>{t('pages.nav.apikeys')}</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          {t('settingsModal.api_keys_desc')}
        </p>
      </div>

      {!hasApiAccess ? (
        <div style={{
          background: 'var(--bg-card, #1e293b)',
          border: '1px solid var(--border-subtle, #334155)',
          borderRadius: 'var(--radius-lg, 12px)',
          padding: '40px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <Lock size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '4px 0 0 0' }}>
            {t('pages.apiKeys.disabled_title')}
          </h2>
          <p style={{ color: 'var(--text-muted, #94a3b8)', maxWidth: '440px', margin: 0, fontSize: '0.875rem' }}>
            {t('pages.apiKeys.disabled_desc')}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* OpenAPI Documentation Links Banner */}
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a5b4fc', fontSize: '0.95rem', fontWeight: 600 }}>
              <Code2 size={18} />
              <span>{t('settingsModal.openapi_docs_title')}</span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: 0 }}>
              {t('settingsModal.openapi_docs_desc')}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
              <a
                href="/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                <span>{t('settingsModal.openapi_swagger_btn')}</span>
              </a>
              <a
                href="/api/v1/redoc"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
                <span>{t('settingsModal.openapi_redoc_btn')}</span>
              </a>
              <a
                href="/api/v1/openapi.json"
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.8125rem', padding: '6px 12px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                <ExternalLink size={14} />
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
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontSize: '0.875rem', fontWeight: 600 }}>
                <ShieldAlert size={18} />
                <span>{t('settingsModal.new_key_warning')}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="text"
                  readOnly
                  value={createdKeyToken}
                  className="form-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.875rem', padding: '8px 12px', background: 'rgba(0, 0, 0, 0.3)' }}
                  onClick={e => e.target.select()}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleCopyToken}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.875rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copiedKey ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedKey ? t('settingsModal.key_copied') : t('settingsModal.copy_key_btn')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Create New Key Form */}
          <div style={{
            background: 'var(--bg-card, #1e293b)',
            border: '1px solid var(--border-subtle, #334155)',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '16px'
          }}>
            <form onSubmit={handleGenerateApiKey} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <label className="form-label" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
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
                  <Key size={16} />
                  <span>{t('settingsModal.generate_key_btn')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Keys List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {t('settingsModal.my_keys_title')}
            </span>

            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {t('common.loading')}
              </div>
            ) : apiKeys.length === 0 ? (
              <div style={{ 
                fontSize: '0.875rem', 
                color: 'var(--text-muted)', 
                fontStyle: 'italic', 
                padding: '24px', 
                textAlign: 'center',
                background: 'var(--bg-card, #1e293b)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle, #334155)'
              }}>
                {t('settingsModal.no_keys_yet')}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {apiKeys.map(k => (
                  <div
                    key={k.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {k.name}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ fontFamily: 'monospace', color: '#a5b4fc', fontSize: '0.8125rem' }}>
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
                      style={{ width: '32px', height: '32px', color: '#f87171', flexShrink: 0 }}
                      onClick={() => handleRevokeApiKey(k)}
                      title={t('settingsModal.revoke_key_btn')}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
