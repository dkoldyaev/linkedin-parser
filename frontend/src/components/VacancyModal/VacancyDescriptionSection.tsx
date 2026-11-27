import React, { useEffect, useState } from 'react';
import { Skeleton, Textarea } from '@blueprint/ui-kit';
import { FileText } from 'lucide-react';
import { SaveButton } from './SaveButton';
import { TitledSection } from '../TitledSection';
import { useSave } from './useSave';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyDescriptionSectionProps {
  description?: string;
  loading?: boolean;
  onSaveDescription?: (description: string) => Promise<void>;
}

const SKELETON_STACK_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-2)',
};

export function VacancyDescriptionSection({
  description = '',
  loading = false,
  onSaveDescription,
}: VacancyDescriptionSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(description);
  const [saveDescription, saveStatus] = useSave(onSaveDescription);

  useEffect(() => {
    setDraft(description);
  }, [description]);

  return (
    <TitledSection
      title={t('vacancyModal.raw_desc_title')}
      icon={FileText}
      accessory={
        !loading &&
        onSaveDescription && (
          <SaveButton status={saveStatus} onClick={() => saveDescription(draft)} />
        )
      }
    >
      {loading ? (
        <div style={SKELETON_STACK_STYLE} data-testid="vacancy-description-skeleton">
          <Skeleton variant="text" width="100" height="xs" />
          <Skeleton variant="text" width="85" height="xs" />
          <Skeleton variant="text" width="100" height="xs" />
          <Skeleton variant="text" width="60" height="xs" />
        </div>
      ) : (
        <Textarea
          value={draft}
          placeholder={t('vacancyModal.description_placeholder')}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
    </TitledSection>
  );
}
