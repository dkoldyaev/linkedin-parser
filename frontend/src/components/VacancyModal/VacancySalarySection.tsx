import React, { useState, useEffect } from 'react';
import {
  Input,
  Label,
  Select,
  type SelectOption,
} from '@blueprint/ui-kit';
import { Banknote } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import type { Vacancy } from '../../types/models';
import { VacancySection } from './VacancySection';
import { useSave } from './useSave';

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

export function VacancySalarySection({
  salaryMin,
  salaryMax,
  salaryCurrency = 'USD',
  salaryPeriod = 'month',
  onSaveSalary,
}: VacancySalarySectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [minDraft, setMinDraft] = useState(salaryMin != null ? String(salaryMin) : '');
  const [maxDraft, setMaxDraft] = useState(salaryMax != null ? String(salaryMax) : '');
  const [currencyDraft, setCurrencyDraft] = useState(salaryCurrency || 'USD');
  const [periodDraft, setPeriodDraft] = useState(salaryPeriod || 'month');

  const [saveSalary, saveStatus] = useSave(onSaveSalary);

  useEffect(() => {
    setMinDraft(salaryMin != null ? String(salaryMin) : '');
    setMaxDraft(salaryMax != null ? String(salaryMax) : '');
    setCurrencyDraft(salaryCurrency || 'USD');
    setPeriodDraft(salaryPeriod || 'month');
  }, [salaryMin, salaryMax, salaryCurrency, salaryPeriod]);

  const currencyOptions: readonly SelectOption[] = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'RUB', label: 'RUB (₽)' },
    { value: 'GBP', label: 'GBP (£)' },
  ];

  const periodOptions: readonly SelectOption[] = [
    { value: 'month', label: t('vacancyModal.period_month') || 'В месяц' },
    { value: 'year', label: t('vacancyModal.period_year') || 'В год' },
    { value: 'hour', label: t('vacancyModal.period_hour') || 'В час' },
    { value: 'day', label: t('vacancyModal.period_day') || 'В день' },
  ];

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div>
          <Label>{t('vacancyModal.min')}</Label>
          <Input
            type="number"
            value={minDraft}
            onChange={(e) => setMinDraft(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('vacancyModal.max')}</Label>
          <Input
            type="number"
            value={maxDraft}
            onChange={(e) => setMaxDraft(e.target.value)}
          />
        </div>
        <div>
          <Label>{t('vacancyModal.currency')}</Label>
          <Select
            value={currencyDraft}
            onValueChange={setCurrencyDraft}
            options={currencyOptions}
          />
        </div>
        <div>
          <Label>{t('vacancyModal.period')}</Label>
          <Select
            value={periodDraft}
            onValueChange={setPeriodDraft}
            options={periodOptions}
          />
        </div>
      </div>
    </VacancySection>
  );
}
