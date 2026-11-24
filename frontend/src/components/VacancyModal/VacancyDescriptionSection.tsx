import React, { useState, useEffect } from 'react';
import { Textarea } from '@blueprint/ui-kit';
import { FileText } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { VacancySection } from './VacancySection';
import { useSave } from './useSave';

export interface VacancyDescriptionSectionProps {
  description?: string;
  onSaveDescription?: (description: string) => Promise<void>;
}

export function VacancyDescriptionSection({
  description = '',
  onSaveDescription,
}: VacancyDescriptionSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(description);
  const [saveDescription, saveStatus] = useSave(onSaveDescription);

  useEffect(() => {
    setDraft(description);
  }, [description]);

  return (
    <VacancySection
      title={t('vacancyModal.raw_desc_title')}
      icon={FileText}
      onSave={onSaveDescription ? () => saveDescription(draft) : undefined}
      saveStatus={saveStatus}
    >
      <Textarea
        rows={12}
        value={draft}
        placeholder={t('vacancyModal.description_placeholder')}
        onChange={(e) => setDraft(e.target.value)}
      />
    </VacancySection>
  );
}
