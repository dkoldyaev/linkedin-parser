import { Icon, Text } from '@blueprint/ui-kit';
import { Banknote } from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import { useTranslation } from '../i18n/I18nContext';
import { Vacancy } from '../types/models';

export type SalaryBadgeProps = {
  min: Vacancy['salary_min'];
  max: Vacancy['salary_max'];
  currency: Vacancy['salary_currency'];
  period: Vacancy['salary_period'];
};

export function SalaryBadge({
  min: salary_min,
  max: salary_max,
  currency: salary_currency,
  period: salary_period,
}: SalaryBadgeProps) {
  const { t, salaryDisplayFormat, salaryTargetCurrency, exchangeRates } = useTranslation();
  const salaryInfo = getSalaryDisplay(
    { salary_min, salary_max, salary_currency, salary_period },
    t,
    salaryDisplayFormat,
    salaryTargetCurrency,
    exchangeRates,
  );
  return (
    <Text variant="mono" tone="success" startIcon={<Icon size="xs" icon={Banknote} />}>
      {salaryInfo.formatted}
    </Text>
  );
}
