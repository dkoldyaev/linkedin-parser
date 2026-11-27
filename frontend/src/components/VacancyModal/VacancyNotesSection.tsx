import React, { useEffect, useState } from 'react';
import { Skeleton, Textarea } from '@blueprint/ui-kit';
import { SaveButton } from './SaveButton';
import { StickyNote } from 'lucide-react';
import { TitledSection } from '../TitledSection';
import { useSave } from './useSave';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyNotesSectionProps {
  notes?: string;
  loading?: boolean;
  onSaveNotes?: (notes: string) => Promise<void>;
}

export function VacancyNotesSection({
  notes = '',
  loading = false,
  onSaveNotes,
}: VacancyNotesSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(notes);
  const [saveNotes, saveStatus] = useSave(onSaveNotes);

  useEffect(() => {
    setDraft(notes);
  }, [notes]);

  return (
    <TitledSection
      title={t('vacancyModal.notes_title')}
      icon={StickyNote}
      accessory={
        !loading &&
        onSaveNotes && <SaveButton status={saveStatus} onClick={() => saveNotes(draft)} />
      }
    >
      {loading ? (
        <div data-testid="vacancy-notes-skeleton">
          <Skeleton variant="rect" width="100" height="lg" />
        </div>
      ) : (
        <Textarea
          rows={4}
          value={draft}
          placeholder={t('vacancyModal.notes_placeholder')}
          onChange={(e) => setDraft(e.target.value)}
        />
      )}
    </TitledSection>
  );
}
