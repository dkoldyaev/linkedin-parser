import React from 'react';
import { Icon, Paragraph, Section } from '@blueprint/ui-kit';
import { Building2 } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

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
    <Section>
      <Section.Header
        title={t('vacancyModal.about_company')}
        icon={<Icon icon={Building2} size="xs" />}
      />
      <Section.Body padding="md">
        <Paragraph size="sm">{companyDescription}</Paragraph>
      </Section.Body>
    </Section>
  );
}
