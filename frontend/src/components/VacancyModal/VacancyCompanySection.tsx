import { Paragraph, Skeleton } from '@blueprint/ui-kit';
import { Building2 } from 'lucide-react';
import React from 'react';
import { TitledSection } from '../TitledSection';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyCompanySectionProps {
  companyDescription?: string;
  loading?: boolean;
}

const SKELETON_STACK_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-2)',
};

export function VacancyCompanySection({
  companyDescription,
  loading = false,
}: VacancyCompanySectionProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (loading) {
    return (
      <TitledSection title={t('vacancyModal.about_company')} icon={Building2}>
        <div style={SKELETON_STACK_STYLE} data-testid="vacancy-company-skeleton">
          <Skeleton variant="text" width="100" height="xs" />
          <Skeleton variant="text" width="75" height="xs" />
        </div>
      </TitledSection>
    );
  }

  if (!companyDescription) {
    return null;
  }

  return (
    <TitledSection title={t('vacancyModal.about_company')} icon={Building2}>
      <Paragraph size="sm">{companyDescription}</Paragraph>
    </TitledSection>
  );
}
