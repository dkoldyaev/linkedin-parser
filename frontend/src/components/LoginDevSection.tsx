import React from 'react';
import { Button, Input, Text, Icon } from '@blueprint/ui-kit';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface LoginDevSectionProps {
  devMode: boolean;
  devCaption: string;
  devBtnLabel: string;
  loading: boolean;
  devName: string;
  onDevNameChange: (val: string) => void;
  devEmail: string;
  onDevEmailChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DEV_SECTION_STYLE = {
  borderTop: '1px solid var(--ui-pixel-line)',
  paddingTop: 'var(--ui-space-3)',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--ui-space-2)',
};

const FORM_STYLE = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--ui-space-2)',
};

const SPARKLES_ICON = <Icon icon={Sparkles} size="xs" />;
const ARROW_RIGHT_ICON = <Icon icon={ArrowRight} size="xs" />;

export default function LoginDevSection({
  devMode,
  devCaption,
  devBtnLabel,
  loading,
  devName,
  onDevNameChange,
  devEmail,
  onDevEmailChange,
  onSubmit,
}: LoginDevSectionProps): React.ReactElement | null {
  const { t } = useTranslation();
  if (!devMode) return null;

  return (
    <div style={DEV_SECTION_STYLE}>
      <Text variant="caption" tone="muted" startIcon={SPARKLES_ICON}>
        {devCaption}
      </Text>

      <form onSubmit={onSubmit} style={FORM_STYLE}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text variant="caption">{t('auth.name_label')}</Text>
          <Input
            value={devName}
            onChange={(e) => onDevNameChange(e.target.value)}
            placeholder={t('auth.dev_name_placeholder')}
            required
          />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Text variant="caption">{t('auth.email_label')}</Text>
          <Input
            type="email"
            value={devEmail}
            onChange={(e) => onDevEmailChange(e.target.value)}
            placeholder="Email"
            required
          />
        </label>
        <Button
          type="submit"
          variant="primary"
          size="md"
          fullWidth
          disabled={loading}
          endIcon={ARROW_RIGHT_ICON}
        >
          {devBtnLabel}
        </Button>
      </form>
    </div>
  );
}
