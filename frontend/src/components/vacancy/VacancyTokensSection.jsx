import React from 'react';
import { Layers, Tag } from 'lucide-react';
import {
  CollapsibleSection,
  TagsList,
  Icon,
} from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';

export default function VacancyTokensSection({
  techStack = [],
  onTechStackChange,
  tags = [],
  onTagsChange,
  isTechOpen = true,
  onTechOpenChange,
  isTagsOpen = true,
  onTagsOpenChange,
}) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
      {/* Tech Stack */}
      <CollapsibleSection
        title={t('vacancyModal.tech_stack_title')}
        icon={<Icon icon={Layers} size="sm" tone="accent" />}
        badge={techStack.length > 0 ? String(techStack.length) : undefined}
        open={isTechOpen}
        onOpenChange={onTechOpenChange}
      >
        <TagsList
          value={techStack}
          onChange={onTechStackChange}
          deletable
          addable
          tone="neutral"
          placeholder={t('vacancyModal.add_token_placeholder')}
        />
      </CollapsibleSection>

      {/* Custom Tags */}
      <CollapsibleSection
        title={t('vacancyModal.tags_title')}
        icon={<Icon icon={Tag} size="sm" tone="primary" />}
        badge={tags.length > 0 ? String(tags.length) : undefined}
        open={isTagsOpen}
        onOpenChange={onTagsOpenChange}
      >
        <TagsList
          value={tags}
          onChange={onTagsChange}
          deletable
          addable
          tone="primary"
          placeholder={t('vacancyModal.add_tag_placeholder')}
        />
      </CollapsibleSection>
    </div>
  );
}
