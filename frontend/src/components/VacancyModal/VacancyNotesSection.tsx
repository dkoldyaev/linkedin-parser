import React, { useState, useEffect } from 'react';
import { Button, Icon, Section, Textarea } from '@blueprint/ui-kit';
import { Check, CheckCircle2, StickyNote } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyNotesSectionProps {
  notes?: string;
  onSaveNotes?: (notes: string) => void;
  savingNotes?: boolean;
  notesSaved?: boolean;
}

export function VacancyNotesSection({
  notes = '',
  onSaveNotes,
  savingNotes,
  notesSaved,
}: VacancyNotesSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(notes);

  useEffect(() => {
    setDraft(notes);
  }, [notes]);

  return (
    <Section>
      <Section.Header
        title={t('vacancyModal.notes_title')}
        icon={<Icon icon={StickyNote} size="xs" />}
        accessory={
          onSaveNotes && (
            <Button
              variant="secondary"
              size="sm"
              loading={savingNotes}
              startIcon={<Icon icon={notesSaved ? Check : CheckCircle2} size="xs" />}
              onClick={() => onSaveNotes(draft)}
            >
              {notesSaved ? t('common.saved') : t('common.save')}
            </Button>
          )
        }
      />
      <Section.Body padding="md">
        <Textarea
          rows={4}
          value={draft}
          placeholder={t('vacancyModal.notes_placeholder')}
          onChange={(e) => setDraft(e.target.value)}
        />
      </Section.Body>
    </Section>
  );
}
