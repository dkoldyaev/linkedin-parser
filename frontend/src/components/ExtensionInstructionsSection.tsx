import { Button, Icon, Text } from '@blueprint/ui-kit';
import { Download, HelpCircle } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface ExtensionInstructionsSectionProps {
  isUpdate: boolean;
  latestVersion?: string | null;
}

const BOX_STYLE: React.CSSProperties = {
  background: 'var(--ui-bg-subtle)',
  border: '1px solid var(--ui-border-subtle)',
  padding: 'var(--ui-space-3-5)',
};

const HEADER_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 'var(--ui-space-2)',
};

const LIST_STYLE: React.CSSProperties = {
  margin: 0,
  paddingLeft: '20px',
  color: 'var(--ui-text-secondary)',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontSize: 'var(--ui-font-size-xs)',
};

export default function ExtensionInstructionsSection({
  isUpdate,
  latestVersion,
}: ExtensionInstructionsSectionProps): React.ReactElement {
  const { t } = useTranslation();

  const title = isUpdate ? t('extensionModal.update_title') : t('extensionModal.install_title');
  const iconTone = isUpdate ? 'warning' : 'accent';
  const zipLabel = isUpdate ? `ZIP (v${latestVersion || ''})` : 'ZIP';
  const steps = isUpdate
    ? [
        t('extensionModal.update_step1'),
        t('extensionModal.update_step2'),
        t('extensionModal.update_step3'),
      ]
    : [
        t('extensionModal.install_step1'),
        t('extensionModal.install_step2'),
        t('extensionModal.install_step3'),
      ];

  return (
    <div style={BOX_STYLE}>
      <div style={HEADER_ROW_STYLE}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Icon icon={HelpCircle} size="xs" tone={iconTone} />
          <Text variant="caption" weight="bold">
            {title}
          </Text>
        </div>
        <Button asChild variant="secondary" size="sm">
          <a
            href="/extension.zip"
            download
            title={t('extensionModal.download_zip_btn')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Icon icon={Download} size="2xs" />
            <span>{zipLabel}</span>
          </a>
        </Button>
      </div>
      <ol style={LIST_STYLE}>
        {steps.map((stepText, idx) => (
          <li key={idx}>{stepText}</li>
        ))}
      </ol>
    </div>
  );
}
