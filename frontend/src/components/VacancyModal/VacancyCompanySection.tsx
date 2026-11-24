import React from 'react';
import { Paragraph } from '@blueprint/ui-kit';
import { Building2 } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { VacancySection } from './VacancySection';

export interface VacancyCompanySectionProps {
  companyDescription?: string;
}

export function VacancyCompanySection({
  companyDescription,
}: VacancyCompanySectionProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!companyDescription) {
    return null;
  }

  return (
    <VacancySection
      title={t('vacancyModal.about_company')}
      icon={Building2}
    >
      <Paragraph size="sm">{companyDescription}</Paragraph>
    </VacancySection>
  );
}
