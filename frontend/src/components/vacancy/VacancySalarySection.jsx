import React, { useState } from 'react';
import { Banknote, Edit3, Check, X } from 'lucide-react';
import {
  Button,
  Icon,
  Text,
  Input,
  Select,
  Badge,
} from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';

export default function VacancySalarySection({
  salaryInfo,
  salaryMin,
  setSalaryMin,
  salaryMax,
  setSalaryMax,
  salaryCurrency,
  setSalaryCurrency,
  salaryPeriod,
  setSalaryPeriod,
  onSaveSalary,
  savingSalary = false,
  savedSalarySuccess = false,
}) {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [initialState, setInitialState] = useState(null);

  const handleStartEdit = () => {
    setInitialState({
      min: salaryMin,
      max: salaryMax,
      curr: salaryCurrency,
      period: salaryPeriod,
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (initialState) {
      setSalaryMin(initialState.min);
      setSalaryMax(initialState.max);
      setSalaryCurrency(initialState.curr);
      setSalaryPeriod(initialState.period);
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    await onSaveSalary();
    setIsEditing(false);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--ui-space-2)',
      padding: 'var(--ui-space-3)',
      background: 'var(--ui-bg-subtle)',
      border: '1px solid var(--ui-border-subtle)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <Icon icon={Banknote} size="sm" tone="accent" />
          <Text variant="caption" weight="bold">
            {t('vacancyModal.salary_title')}:
          </Text>
          <Text
            variant="body"
            weight="medium"
            tone={salaryInfo.hasSalary ? 'accent' : 'muted'}
          >
            {salaryInfo.hasSalary ? salaryInfo.formatted : t('vacancyModal.salary_not_specified')}
          </Text>
        </div>

        {!isEditing ? (
          <Button
            variant="ghost"
            size="xs"
            onClick={handleStartEdit}
            startIcon={<Icon icon={savedSalarySuccess ? Check : Edit3} size="xs" tone={savedSalarySuccess ? 'success' : 'neutral'} />}
          >
            {savedSalarySuccess ? t('vacancyModal.saved_salary') : t('common.edit')}
          </Button>
        ) : (
          <div style={{ display: 'flex', gap: 'var(--ui-space-1)' }}>
            <Button
              variant="primary"
              size="xs"
              onClick={handleSave}
              disabled={savingSalary}
              loading={savingSalary}
              title={t('common.save')}
            >
              <Icon icon={Check} size="xs" />
            </Button>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleCancelEdit}
              disabled={savingSalary}
              title={t('common.cancel')}
            >
              <Icon icon={X} size="xs" />
            </Button>
          </div>
        )}
      </div>

      {isEditing && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 'var(--ui-space-2)',
            marginTop: 'var(--ui-space-2)',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              handleCancelEdit();
            }
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text variant="caption" tone="secondary">{t('vacancyModal.min')}</Text>
            <Input
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
              placeholder={t('vacancyModal.min_placeholder')}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text variant="caption" tone="secondary">{t('vacancyModal.max')}</Text>
            <Input
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
              placeholder={t('vacancyModal.max_placeholder')}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text variant="caption" tone="secondary">{t('vacancyModal.currency')}</Text>
            <Select
              value={salaryCurrency}
              onValueChange={setSalaryCurrency}
              options={[
                { value: '$', label: '$ (USD)' },
                { value: '€', label: '€ (EUR)' },
                { value: '₽', label: '₽ (RUB)' },
                { value: '£', label: '£ (GBP)' },
                { value: 'CHF', label: 'CHF' },
                { value: 'CAD', label: 'CAD' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <Text variant="caption" tone="secondary">{t('vacancyModal.period')}</Text>
            <Select
              value={salaryPeriod}
              onValueChange={setSalaryPeriod}
              options={[
                { value: 'month', label: t('vacancyModal.period_month') },
                { value: 'year', label: t('vacancyModal.period_year') },
                { value: 'hour', label: t('vacancyModal.period_hour') },
                { value: 'day', label: t('vacancyModal.period_day') },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
