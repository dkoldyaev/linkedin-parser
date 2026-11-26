import { type SalaryData, VacancySalarySection } from './VacancySalarySection';
import React from 'react';
import type { Vacancy } from '../../types/models';
import { VacancyDescriptionSection } from './VacancyDescriptionSection';
import { VacancyTabContent } from './VacancyTabContent';

export interface VacancyRawDataTabProps {
  salaryMin?: Vacancy['salary_min'];
  salaryMax?: Vacancy['salary_max'];
  salaryCurrency?: Vacancy['salary_currency'];
  salaryPeriod?: Vacancy['salary_period'];
  onSaveSalary?: (salary: SalaryData) => Promise<void>;
  description?: string;
  loadingDescription?: boolean;
  onSaveDescription?: (description: string) => Promise<void>;
}

export function VacancyRawDataTab({
  salaryMin,
  salaryMax,
  salaryCurrency,
  salaryPeriod,
  onSaveSalary,
  description,
  loadingDescription = false,
  onSaveDescription,
}: VacancyRawDataTabProps): React.ReactElement {
  return (
    <VacancyTabContent>
      <VacancySalarySection
        salaryMin={salaryMin}
        salaryMax={salaryMax}
        salaryCurrency={salaryCurrency}
        salaryPeriod={salaryPeriod}
        onSaveSalary={onSaveSalary}
      />
      <VacancyDescriptionSection
        description={description}
        loading={loadingDescription}
        onSaveDescription={onSaveDescription}
      />
    </VacancyTabContent>
  );
}
