import React, { useState, useEffect } from 'react';
import { Button, CollapsibleSection, Icon, Section, Textarea } from '@blueprint/ui-kit';
import { Check, CheckCircle2, Copy, FileText } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyDescriptionSectionProps {
  description?: string;
  onSaveDescription?: (description: string) => void;
  savingDescription?: boolean;
  descriptionSaved?: boolean;
}

export function VacancyDescriptionSection({
  description = '',
  onSaveDescription,
  savingDescription,
  descriptionSaved,
}: VacancyDescriptionSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(description);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDraft(description);
  }, [description]);

  const handleCopy = async () => {
    if (draft) {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Section divider={false}>
      <CollapsibleSection
        title={t('vacancyModal.raw_desc_title')}
        icon={<Icon icon={FileText} size="xs" />}
        defaultOpen={true}
        accessory={
          <div style={{ display: 'flex', gap: 6 }}>
            {onSaveDescription && (
              <Button
                variant="secondary"
                size="sm"
                loading={savingDescription}
                startIcon={<Icon icon={descriptionSaved ? Check : CheckCircle2} size="xs" />}
                onClick={() => onSaveDescription(draft)}
              >
                {descriptionSaved ? t('common.saved') : t('common.save')}
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              startIcon={<Icon icon={copied ? Check : Copy} size="xs" />}
              onClick={handleCopy}
            >
              {copied ? t('vacancyModal.desc_copied') : t('vacancyModal.desc_copy')}
            </Button>
          </div>
        }
      >
        <Textarea
          rows={12}
          value={draft}
          placeholder={t('vacancyModal.description_placeholder')}
          onChange={(e) => setDraft(e.target.value)}
        />
      </CollapsibleSection>
    </Section>
  );
}
