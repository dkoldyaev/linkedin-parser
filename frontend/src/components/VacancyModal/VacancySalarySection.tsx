import { Input, Label, Select, type SelectOption } from '@blueprint/ui-kit';
import React, { useEffect, useState } from 'react';
import { Banknote } from 'lucide-react';
import type { TranslateFn } from '../../i18n/I18nContext';
import { useSave } from './useSave';
import { useTranslation } from '../../i18n/I18nContext';
import type { Vacancy } from '../../types/models';
import { VacancySection } from './VacancySection';

export interface SalaryData {
  min: string;
  max: string;
  currency: string;
  period: string;
}

export interface VacancySalarySectionProps {
  salaryMin?: Vacancy['salary_min'];
  salaryMax?: Vacancy['salary_max'];
  salaryCurrency?: Vacancy['salary_currency'];
  salaryPeriod?: Vacancy['salary_period'];
  onSaveSalary?: (salary: SalaryData) => Promise<void>;
}

const CURRENCY_OPTIONS: readonly SelectOption[] = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'RUB', label: 'RUB (₽)' },
  { value: 'GBP', label: 'GBP (£)' },
];

const GRID_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
  gap: 12,
};

function formatDraftBound(val: number | null | undefined): string {
  return val != null ? String(val) : '';
}

function buildPeriodOptions(t: TranslateFn): readonly SelectOption[] {
  return [
    { value: 'month', label: t('vacancyModal.period_month') || 'В месяц' },
    { value: 'year', label: t('vacancyModal.period_year') || 'В год' },
    { value: 'hour', label: t('vacancyModal.period_hour') || 'В час' },
    { value: 'day', label: t('vacancyModal.period_day') || 'В день' },
  ];
}

export function VacancySalarySection({
  salaryMin,
  salaryMax,
  salaryCurrency = 'USD',
  salaryPeriod = 'month',
  onSaveSalary,
}: VacancySalarySectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [minDraft, setMinDraft] = useState(() => formatDraftBound(salaryMin));
  const [maxDraft, setMaxDraft] = useState(() => formatDraftBound(salaryMax));
  const [currencyDraft, setCurrencyDraft] = useState(salaryCurrency || 'USD');
  const [periodDraft, setPeriodDraft] = useState(salaryPeriod || 'month');

  const [saveSalary, saveStatus] = useSave(onSaveSalary);

  useEffect(() => {
    setMinDraft(formatDraftBound(salaryMin));
    setMaxDraft(formatDraftBound(salaryMax));
    setCurrencyDraft(salaryCurrency || 'USD');
    setPeriodDraft(salaryPeriod || 'month');
  }, [salaryMin, salaryMax, salaryCurrency, salaryPeriod]);

  const handleSave = () => {
    saveSalary({
      min: minDraft,
      max: maxDraft,
      currency: currencyDraft,
      period: periodDraft,
    });
  };

  return (
    <VacancySection
      title={t('vacancyModal.salary_title')}
      icon={Banknote}
      onSave={onSaveSalary ? handleSave : undefined}
      saveStatus={saveStatus}
    >
      <div style={GRID_STYLE}>
        <div>
          <Label>{t('vacancyModal.min')}</Label>
          <Input type="number" value={minDraft} onChange={(e) => setMinDraft(e.target.value)} />
        </div>
        <div>
          <Label>{t('vacancyModal.max')}</Label>
          <Input type="number" value={maxDraft} onChange={(e) => setMaxDraft(e.target.value)} />
        </div>
        <div>
          <Label>{t('vacancyModal.currency')}</Label>
          <Select
            value={currencyDraft}
            onValueChange={setCurrencyDraft}
            options={CURRENCY_OPTIONS}
          />
        </div>
        <div>
          <Label>{t('vacancyModal.period')}</Label>
          <Select
            value={periodDraft}
            onValueChange={setPeriodDraft}
            options={buildPeriodOptions(t)}
          />
        </div>
      </div>
    </VacancySection>
  );
}
