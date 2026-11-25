import React, { useState, useEffect } from 'react';
import { Skeleton, Textarea } from '@blueprint/ui-kit';
import { StickyNote } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { VacancySection } from './VacancySection';
import { useSave } from './useSave';

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
    <VacancySection
      title={t('vacancyModal.notes_title')}
      icon={StickyNote}
      onSave={!loading && onSaveNotes ? () => saveNotes(draft) : undefined}
      saveStatus={saveStatus}
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
    </VacancySection>
  );
}
