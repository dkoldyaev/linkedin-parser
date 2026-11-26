import { Icon, Text } from '@blueprint/ui-kit';
import { Layers, ShieldAlert, Sparkles } from 'lucide-react';
import type { ExtensionUpdateItem } from '../utils/extension';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface ExtensionUpdatesSectionProps {
  isUpdate: boolean;
  updates: ExtensionUpdateItem[];
}

const BOX_STYLE: React.CSSProperties = {
  background: 'var(--ui-bg-subtle)',
  border: '1px solid var(--ui-border-subtle)',
  padding: 'var(--ui-space-3-5)',
};

const CHANGES_LIST_STYLE: React.CSSProperties = {
  margin: 0,
  paddingLeft: '18px',
  color: 'var(--ui-text-secondary)',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

export default function ExtensionUpdatesSection({
  isUpdate,
  updates,
}: ExtensionUpdatesSectionProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (isUpdate && updates.length > 0) {
    const headerTitle =
      updates.length === 1
        ? t('extensionModal.whats_new', { version: updates[0].version })
        : t('extensionModal.whats_new_general');

    return (
      <div style={BOX_STYLE}>
        <Text
          variant="caption"
          weight="bold"
          tone="warning"
          startIcon={<Icon icon={Sparkles} size="xs" />}
        >
          {headerTitle}
        </Text>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ui-space-2)',
            marginTop: 'var(--ui-space-2)',
          }}
        >
          {updates.map((up) => {
            const dateSuffix = up.date ? ` (${up.date})` : '';
            return (
              <div key={up.version}>
                {updates.length > 1 && (
                  <Text variant="caption" weight="medium" tone="muted">
                    {`v${up.version}${dateSuffix}`}
                  </Text>
                )}
                <ul style={CHANGES_LIST_STYLE}>
                  {up.changes.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (isUpdate) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
      <div style={{ display: 'flex', gap: 'var(--ui-space-3)', alignItems: 'flex-start' }}>
        <Icon icon={Layers} size="sm" tone="accent" style={{ marginTop: '2px' }} />
        <div>
          <Text variant="body" weight="medium">
            {t('extensionModal.feature_tabs_title')}
          </Text>
          <Text variant="caption" tone="muted" style={{ display: 'block', marginTop: '2px' }}>
            {t('extensionModal.feature_tabs_desc')}
          </Text>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--ui-space-3)', alignItems: 'flex-start' }}>
        <Icon icon={ShieldAlert} size="sm" tone="warning" style={{ marginTop: '2px' }} />
        <div>
          <Text variant="body" weight="medium">
            {t('extensionModal.feature_captcha_title')}
          </Text>
          <Text variant="caption" tone="muted" style={{ display: 'block', marginTop: '2px' }}>
            {t('extensionModal.feature_captcha_desc')}
          </Text>
        </div>
      </div>
    </div>
  );
}
