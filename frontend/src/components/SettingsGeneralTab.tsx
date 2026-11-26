import { AlertBanner, Button, Icon, Select, Text } from '@blueprint/ui-kit';
import { Check, Globe } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface SettingsGeneralTabProps {
  selectedLocale: string;
  onSelectLocale: (loc: string) => void;
  selectedSalaryFormat: string;
  onSelectSalaryFormat: (fmt: string) => void;
  selectedCurrency: string;
  onSelectCurrency: (curr: string) => void;
  savedSuccess: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

function buildSalaryFormatOptions(t: (key: string) => string) {
  return [
    { value: 'month', label: t('settingsModal.salary_format_month') },
    { value: 'hour', label: t('settingsModal.salary_format_hour') },
    { value: 'year', label: t('settingsModal.salary_format_year') },
    { value: 'day', label: t('settingsModal.salary_format_day') },
    { value: 'original', label: t('settingsModal.salary_format_original') },
  ];
}

function buildCurrencyOptions(t: (key: string) => string) {
  return [
    { value: '', label: t('settingsModal.salary_currency_auto') },
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'RUB', label: 'RUB (₽)' },
  ];
}

const CHECK_ICON = <Icon icon={Check} size="xs" />;
const GLOBE_ICON = <Icon icon={Globe} size="xs" />;

export default function SettingsGeneralTab({
  selectedLocale,
  onSelectLocale,
  selectedSalaryFormat,
  onSelectSalaryFormat,
  selectedCurrency,
  onSelectCurrency,
  savedSuccess,
  onSubmit,
}: SettingsGeneralTabProps): React.ReactElement {
  const { t } = useTranslation();
  const isRu = selectedLocale === 'ru';
  const isEn = selectedLocale === 'en';

  return (
    <form
      id="settings-general-form"
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}
    >
      {savedSuccess && <AlertBanner tone="success" title={t('settingsModal.saved_notification')} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
        <Text variant="caption" weight="medium" startIcon={GLOBE_ICON}>
          {t('settingsModal.language_section_title')}
        </Text>
        <div style={{ display: 'flex', gap: 'var(--ui-space-2)' }}>
          <Button
            type="button"
            variant={isRu ? 'primary' : 'secondary'}
            onClick={() => onSelectLocale('ru')}
            endIcon={isRu ? CHECK_ICON : undefined}
          >
            🇷🇺 {t('settingsModal.language_ru')}
          </Button>
          <Button
            type="button"
            variant={isEn ? 'primary' : 'secondary'}
            onClick={() => onSelectLocale('en')}
            endIcon={isEn ? CHECK_ICON : undefined}
          >
            🇬🇧 {t('settingsModal.language_en')}
          </Button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
        <Text variant="caption" weight="medium">
          {t('settingsModal.salary_format_title')}
        </Text>
        <Select
          value={selectedSalaryFormat}
          onValueChange={onSelectSalaryFormat}
          options={buildSalaryFormatOptions(t)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
        <Text variant="caption" weight="medium">
          {t('settingsModal.salary_currency_title')}
        </Text>
        <Select
          value={selectedCurrency}
          onValueChange={onSelectCurrency}
          options={buildCurrencyOptions(t)}
        />
        <Text variant="caption" tone="muted">
          {t('settingsModal.salary_currency_hint')}
        </Text>
      </div>
    </form>
  );
}
