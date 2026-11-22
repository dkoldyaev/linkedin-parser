import React from 'react';
import { Paragraph, Text, Icon } from '@blueprint/ui-kit';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface KanbanCardSummaryProps {
  summary?: string | null;
}

const SPARKLES_ICON = <Icon icon={Sparkles} size="xs" />;

export default function KanbanCardSummary({
  summary,
}: KanbanCardSummaryProps): React.ReactElement {
  const { t } = useTranslation();

  if (summary) {
    return (
      <Paragraph size="sm" tone="secondary">
        {summary}
      </Paragraph>
    );
  }

  return (
    <Text variant="caption" tone="muted" startIcon={SPARKLES_ICON}>
      {t('kanban.ai_pending')}
    </Text>
  );
}
