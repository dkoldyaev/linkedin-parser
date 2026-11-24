import React from 'react';
import { VacancySalarySection, type SalaryData } from './VacancySalarySection';
import { VacancyDescriptionSection } from './VacancyDescriptionSection';
import type { Vacancy } from '../../types/models';
import { VacancyTabContent } from './VacancyTabContent';

export interface VacancyRawDataTabProps {
  salaryMin?: Vacancy['salary_min'];
  salaryMax?: Vacancy['salary_max'];
  salaryCurrency?: Vacancy['salary_currency'];
  salaryPeriod?: Vacancy['salary_period'];
  onSaveSalary?: (salary: SalaryData) => Promise<void>;
  description?: string;
  onSaveDescription?: (description: string) => Promise<void>;
}

export function VacancyRawDataTab({
  salaryMin,
  salaryMax,
  salaryCurrency,
  salaryPeriod,
  onSaveSalary,
  description,
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
        onSaveDescription={onSaveDescription}
      />
    </VacancyTabContent>
  );
}
