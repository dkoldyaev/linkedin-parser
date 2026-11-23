import React from 'react';
import { VacancySalarySection } from './VacancySalarySection';
import { VacancyDescriptionSection } from './VacancyDescriptionSection';
import type { Vacancy } from '../../types/models';

export interface VacancyRawDataTabProps {
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
  description?: string;
  onSaveDescription?: (description: string) => void;
  savingDescription?: boolean;
  descriptionSaved?: boolean;
}

export function VacancyRawDataTab({
  salaryMin,
  salaryMax,
  salaryCurrency,
  salaryPeriod,
  onSaveSalary,
  savingSalary,
  savedSalarySuccess,
  description,
  onSaveDescription,
  savingDescription,
  descriptionSaved,
}: VacancyRawDataTabProps): React.ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <VacancySalarySection
        salaryMin={salaryMin}
        salaryMax={salaryMax}
        salaryCurrency={salaryCurrency}
        salaryPeriod={salaryPeriod}
        onSaveSalary={onSaveSalary}
        savingSalary={savingSalary}
        savedSalarySuccess={savedSalarySuccess}
      />
      <VacancyDescriptionSection
        description={description}
        onSaveDescription={onSaveDescription}
        savingDescription={savingDescription}
        descriptionSaved={descriptionSaved}
      />
    </div>
  );
}
