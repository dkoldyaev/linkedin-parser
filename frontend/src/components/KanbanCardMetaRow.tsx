import React from 'react';
import { Award } from 'lucide-react';
import { Badge, Icon } from '@blueprint/ui-kit';
import { resolveScoreTone } from './kanbanCardHelpers';
import styles from './KanbanCard.module.css';
import { SalaryBadge } from './SalaryBadge';
import { LocationBadge } from './LocationBadge';
import { WorkplaceBadge } from './WorkplaceBadge';
import { Vacancy } from '../types/models';

export type KanbanCardMetaRowProps = {
  matchScore?: number;
  workplaceType?: Vacancy['workplace_type'];
  location?: string;
  salaryMin?: Vacancy['salary_min'];
  salaryMax?: Vacancy['salary_max'];
  salaryCurrency?: Vacancy['salary_currency'];
  salaryPeriod?: Vacancy['salary_period'];
};

const AWARD_ICON = <Icon icon={Award} size="2xs" />;

export default function KanbanCardMetaRow({
  matchScore,
  workplaceType,
  location,
  salaryMax,
  salaryMin,
  salaryPeriod,
  salaryCurrency,
}: KanbanCardMetaRowProps): React.ReactElement {
  const scoreTone = resolveScoreTone(matchScore);

  return (
    <div className={styles.metaRow}>
      {matchScore !== undefined && (
        <Badge variant="solid" size="xs" tone={scoreTone} icon={AWARD_ICON}>
          {matchScore}%
        </Badge>
      )}
      <WorkplaceBadge workplaceType={workplaceType} />
      <LocationBadge location={location} />
      <SalaryBadge min={salaryMin} max={salaryMax} period={salaryPeriod} currency={salaryCurrency} />
    </div>
  );
}
