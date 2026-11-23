import React, { useState, useEffect } from 'react';
import {
  Button,
  Icon,
  Input,
  Label,
  Section,
  Select,
  type SelectOption,
} from '@blueprint/ui-kit';
import { Banknote, Check, CheckCircle2, Edit3, X } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { SalaryBadge } from '../SalaryBadge';
import type { Vacancy } from '../../types/models';

export interface VacancySalarySectionProps {
  salaryMin?: Vacancy['salary_min'];
  salaryMax?: Vacancy['salary_max'];
  salaryCurrency?: Vacancy['salary_currency'];
  salaryPeriod?: Vacancy['salary_period'];
  onSaveSalary?: (salary: {
    min: string;
    max: string;
    currency: string;
    period: string;
  }) => void | Promise<void>;
  savingSalary?: boolean;
  savedSalarySuccess?: boolean;
}

export function VacancySalarySection({
  salaryMin,
  salaryMax,
  salaryCurrency = 'USD',
  salaryPeriod = 'month',
  onSaveSalary,
  savingSalary,
  savedSalarySuccess,
}: VacancySalarySectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [minDraft, setMinDraft] = useState(salaryMin != null ? String(salaryMin) : '');
  const [maxDraft, setMaxDraft] = useState(salaryMax != null ? String(salaryMax) : '');
  const [currencyDraft, setCurrencyDraft] = useState(salaryCurrency || 'USD');
  const [periodDraft, setPeriodDraft] = useState(salaryPeriod || 'month');

  useEffect(() => {
    setMinDraft(salaryMin != null ? String(salaryMin) : '');
    setMaxDraft(salaryMax != null ? String(salaryMax) : '');
    setCurrencyDraft(salaryCurrency || 'USD');
    setPeriodDraft(salaryPeriod || 'month');
  }, [salaryMin, salaryMax, salaryCurrency, salaryPeriod]);

  useEffect(() => {
    if (savedSalarySuccess) {
      setIsEditing(false);
    }
  }, [savedSalarySuccess]);

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
    onSaveSalary?.({
      min: minDraft,
      max: maxDraft,
      currency: currencyDraft,
      period: periodDraft,
    });
  };

  return (
    <Section>
      <Section.Header
        title={t('vacancyModal.salary_title')}
        icon={<Icon icon={Banknote} size="xs" />}
        badge={
          !isEditing && (
            <SalaryBadge
              min={salaryMin}
              max={salaryMax}
              currency={salaryCurrency}
              period={salaryPeriod}
            />
          )
        }
        accessory={
          onSaveSalary && (
            isEditing ? (
              <div style={{ display: 'flex', gap: 6 }}>
                <Button
                  variant="primary"
                  size="sm"
                  loading={savingSalary}
                  startIcon={<Icon icon={savedSalarySuccess ? Check : CheckCircle2} size="xs" />}
                  onClick={handleSave}
                >
                  {savedSalarySuccess ? t('common.saved') : t('common.save')}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  startIcon={<Icon icon={X} size="xs" />}
                  onClick={() => setIsEditing(false)}
                >
                  {t('common.cancel')}
                </Button>
              </div>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={Edit3} size="xs" />}
                onClick={() => setIsEditing(true)}
              >
                {t('common.edit')}
              </Button>
            )
          )
        }
      />
      {isEditing && (
        <Section.Body padding="md">
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
        </Section.Body>
      )}
    </Section>
  );
}
