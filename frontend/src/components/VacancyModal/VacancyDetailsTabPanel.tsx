import React from 'react';
import { SectionStack } from '../SectionStack';
import type { Vacancy } from '../../types/models';
import { VacancyAiSummarySection } from './VacancyAiSummarySection';
import { VacancyCompanySection } from './VacancyCompanySection';
import { type UiVacancyHistoryItem, VacancyHistorySection } from './VacancyHistorySection';
import { VacancyNotesSection } from './VacancyNotesSection';
import { VacancySkillsSection } from './VacancySkillsSection';

export interface VacancyDetailsTabPanelProps {
  vacancy: Vacancy;
  loadingDetails: boolean;
  resummarizing: boolean;
  onResummarize: () => void;
  onPatchField: (payload: Record<string, unknown>) => Promise<void>;
  historyItems: readonly UiVacancyHistoryItem[];
  onSaveComment: (id: string, comment: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

function resolveCompanyDesc(vacancy: Vacancy): string | undefined {
  if (vacancy.company_info) return vacancy.company_info;
  if (vacancy.company_description) return vacancy.company_description;
  return undefined;
}

export function VacancyDetailsTabPanel({
  vacancy,
  loadingDetails,
  resummarizing,
  onResummarize,
  onPatchField,
  historyItems,
  onSaveComment,
  onDeleteComment,
}: VacancyDetailsTabPanelProps): React.ReactElement {
  return (
    <SectionStack>
      <VacancyAiSummarySection
        summary={vacancy.ai_summary ? vacancy.ai_summary : undefined}
        onResummarize={onResummarize}
        resummarizing={resummarizing}
      />

      <VacancyCompanySection
        companyDescription={resolveCompanyDesc(vacancy)}
        loading={loadingDetails}
      />

      <VacancySkillsSection
        techStack={vacancy.tech_stack ? vacancy.tech_stack : []}
        onTechStackChange={(tech_stack) => onPatchField({ tech_stack })}
        tags={vacancy.tags ? vacancy.tags : []}
        onTagsChange={(tags) => onPatchField({ tags })}
      />

      <VacancyHistorySection
        items={historyItems}
        loading={loadingDetails}
        onSaveComment={onSaveComment}
        onDeleteComment={onDeleteComment}
      />

      <VacancyNotesSection
        notes={vacancy.notes ? vacancy.notes : ''}
        loading={loadingDetails}
        onSaveNotes={(notes) => onPatchField({ notes })}
      />
    </SectionStack>
  );
}
