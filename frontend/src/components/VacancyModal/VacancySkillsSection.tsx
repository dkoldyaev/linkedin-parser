import React from 'react';
import { Icon, Section, TagsList } from '@blueprint/ui-kit';
import { Layers, Tag } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancySkillsSectionProps {
  techStack?: readonly string[];
  onTechStackChange?: (tags: string[]) => void;
  tags?: readonly string[];
  onTagsChange?: (tags: string[]) => void;
}

export function VacancySkillsSection({
  techStack = [],
  onTechStackChange,
  tags = [],
  onTagsChange,
}: VacancySkillsSectionProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <Section>
        <Section.Header
          title={t('vacancyModal.tech_stack_title')}
          icon={<Icon icon={Layers} size="xs" />}
        />
        <Section.Body padding="md">
          <TagsList
            value={techStack}
            onChange={onTechStackChange}
            addable={Boolean(onTechStackChange)}
            deletable={Boolean(onTechStackChange)}
            placeholder={t('vacancyModal.add_token_placeholder')}
            tone="accent"
          />
        </Section.Body>
      </Section>

      <Section>
        <Section.Header
          title={t('vacancyModal.tags_title')}
          icon={<Icon icon={Tag} size="xs" />}
        />
        <Section.Body padding="md">
          <TagsList
            value={tags}
            onChange={onTagsChange}
            addable={Boolean(onTagsChange)}
            deletable={Boolean(onTagsChange)}
            placeholder={t('vacancyModal.add_tag_placeholder')}
            tone="neutral"
          />
        </Section.Body>
      </Section>
    </>
  );
}
