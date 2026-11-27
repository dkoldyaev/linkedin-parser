import { Layers, Tag } from 'lucide-react';
import React from 'react';
import { TagsList } from '@blueprint/ui-kit';
import { TitledSection } from '../TitledSection';
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
      <TitledSection title={t('vacancyModal.tech_stack_title')} icon={Layers}>
        <TagsList
          value={techStack}
          onChange={onTechStackChange}
          addable={Boolean(onTechStackChange)}
          deletable={Boolean(onTechStackChange)}
          placeholder={t('vacancyModal.add_token_placeholder')}
          tone="accent"
        />
      </TitledSection>

      <TitledSection title={t('vacancyModal.tags_title')} icon={Tag}>
        <TagsList
          value={tags}
          onChange={onTagsChange}
          addable={Boolean(onTagsChange)}
          deletable={Boolean(onTagsChange)}
          placeholder={t('vacancyModal.add_tag_placeholder')}
          tone="neutral"
        />
      </TitledSection>
    </>
  );
}
