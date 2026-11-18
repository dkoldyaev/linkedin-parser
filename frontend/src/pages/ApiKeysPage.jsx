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
import {
  PageLayout,
  TableHeader,
  Button,
  Icon,
  Input,
  AlertBanner,
  Badge,
  Text,
  EmptyState,
  Spinner,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';

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
    if (!newKeyName.trim()) return;
    try {
      setGeneratingKey(true);
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
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

  const handleCopyToken = () => {
    if (!createdKeyToken) return;
    navigator.clipboard.writeText(createdKeyToken);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRevokeApiKey = async (key) => {
    const confirmMsg = t('settingsModal.confirm_revoke_key').replace('{name}', key.name);
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/api-keys/${key.id}`, {
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
    <PageLayout
      gridDeps={[hasApiAccess, apiKeys, createdKeyToken, loading, locale]}
      className="api-keys-page"
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
              {t('pages.nav.apikeys')}
            </Text>
            <Text variant="mono" tone="muted">
              /
            </Text>
            <Text variant="caption" tone="secondary">
              {t('settingsModal.api_keys_desc')}
            </Text>
          </div>
          {hasApiAccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
              <Button
                as="a"
                href="/api/v1/docs"
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={ExternalLink} size="xs" />}
              >
                Swagger UI
              </Button>
              <Button
                as="a"
                href="/api/v1/redoc"
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={ExternalLink} size="xs" />}
              >
                ReDoc
              </Button>
              <Button
                as="a"
                href="/api/v1/openapi.json"
                target="_blank"
                rel="noreferrer"
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={Code2} size="xs" />}
              >
                openapi.json
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)', padding: 'var(--ui-space-4)' }}>
        {!hasApiAccess ? (
          <section
            style={{
              padding: 'var(--ui-space-6)',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--ui-space-3)',
              textAlign: 'center',
            }}
          >
            <div style={{ color: 'var(--ui-danger)' }}>
              <Icon icon={Lock} size="lg" />
            </div>
            <Text variant="title" weight="bold" tone="primary">
              {t('pages.apiKeys.disabled_title')}
            </Text>
            <Text variant="body" tone="secondary" style={{ maxWidth: '500px' }}>
              {t('pages.apiKeys.disabled_desc')}
            </Text>
          </section>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 'var(--ui-space-4)',
            }}
          >
            {/* Left Column: Create Key + OpenAPI Documentation */}
            <section
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--ui-bg-card-fill)',
                border: '1px solid var(--ui-border-subtle)',
              }}
            >
              <TableHeader
                size="sm"
                index="[ 01 ]"
                indicatorTone="accent"
                title={t('settingsModal.api_key_name_label')}
              />

              <div style={{ padding: 'var(--ui-space-4)' }}>
                <form onSubmit={handleGenerateApiKey} style={{ display: 'flex', gap: 'var(--ui-space-2)' }}>
                  <Input
                    placeholder={t('settingsModal.api_key_name_placeholder')}
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={generatingKey || !newKeyName.trim()}
                    startIcon={<Icon icon={Key} size="xs" />}
                  >
                    {t('settingsModal.generate_key_btn')}
                  </Button>
                </form>

                {createdKeyToken && (
                  <div style={{ marginTop: 'var(--ui-space-4)' }}>
                    <AlertBanner
                      tone="warning"
                      title={t('settingsModal.new_key_warning')}
                      icon={<Icon icon={ShieldAlert} size="sm" />}
                    />
                    <div style={{ display: 'flex', gap: 'var(--ui-space-2)', marginTop: 'var(--ui-space-2)' }}>
                      <Input
                        readOnly
                        value={createdKeyToken}
                        onClick={(e) => e.target.select()}
                        style={{ flex: 1, fontFamily: 'var(--ui-font-mono)' }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleCopyToken}
                        startIcon={<Icon icon={copiedKey ? Check : Copy} size="xs" />}
                      >
                        {copiedKey ? t('settingsModal.key_copied') : t('settingsModal.copy_key_btn')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <TableHeader
                size="sm"
                index="[ 02 ]"
                indicatorTone="accent"
                title={t('settingsModal.openapi_docs_title')}
              />

              <div style={{ padding: 'var(--ui-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
                <Text variant="body-sm" tone="secondary">
                  {t('settingsModal.openapi_docs_desc')}
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-2)' }}>
                  <Button
                    as="a"
                    href="/api/v1/docs"
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    size="sm"
                    startIcon={<Icon icon={ExternalLink} size="xs" />}
                  >
                    {t('settingsModal.openapi_swagger_btn')}
                  </Button>
                  <Button
                    as="a"
                    href="/api/v1/redoc"
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    size="sm"
                    startIcon={<Icon icon={ExternalLink} size="xs" />}
                  >
                    {t('settingsModal.openapi_redoc_btn')}
                  </Button>
                  <Button
                    as="a"
                    href="/api/v1/openapi.json"
                    target="_blank"
                    rel="noreferrer"
                    variant="secondary"
                    size="sm"
                    startIcon={<Icon icon={ExternalLink} size="xs" />}
                  >
                    {t('settingsModal.openapi_json_btn')}
                  </Button>
                </div>
              </div>
            </section>

            {/* Right Column: Active API Keys */}
            <section
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: 'var(--ui-bg-card-fill)',
                border: '1px solid var(--ui-border-subtle)',
              }}
            >
              <TableHeader
                size="sm"
                index="[ 03 ]"
                indicatorTone="success"
                title={t('settingsModal.my_keys_title')}
                badge={apiKeys.length}
              />

              {loading ? (
                <div style={{ padding: 'var(--ui-space-6)', display: 'flex', justifyContent: 'center' }}>
                  <Spinner size="md" />
                </div>
              ) : apiKeys.length === 0 ? (
                <div style={{ padding: 'var(--ui-space-6)' }}>
                  <EmptyState
                    icon={<Icon icon={Key} size="md" />}
                    title={t('settingsModal.no_keys_yet')}
                  />
                </div>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {apiKeys.map((k) => (
                    <li
                      key={k.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 'var(--ui-space-3) var(--ui-space-4)',
                        borderBottom: '1px solid var(--ui-border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
                          <Text variant="body" weight="medium" tone="primary">
                            {k.name}
                          </Text>
                          <Badge variant="chip" size="xs" tone="neutral">
                            {k.key_prefix}••••••••
                          </Badge>
                        </div>
                        <Text variant="caption" tone="muted">
                          {t('settingsModal.key_created_at').replace('{date}', new Date(k.created_at).toLocaleDateString())}
                          {' • '}
                          {k.last_used_at
                            ? t('settingsModal.key_last_used').replace('{date}', new Date(k.last_used_at).toLocaleDateString())
                            : t('settingsModal.key_never_used')}
                        </Text>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        tone="danger"
                        onClick={() => handleRevokeApiKey(k)}
                        title={t('settingsModal.revoke_key_btn')}
                        aria-label={t('settingsModal.revoke_key_btn')}
                      >
                        <Icon icon={Trash2} size="xs" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
