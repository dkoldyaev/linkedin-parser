import { Button, Icon, Paragraph, Text } from '@blueprint/ui-kit';
import { RefreshCw, Sparkles } from 'lucide-react';
import React from 'react';
import { TitledSection } from '../TitledSection';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyAiSummarySectionProps {
  summary?: string;
  onResummarize?: () => void;
  resummarizing?: boolean;
}

export function VacancyAiSummarySection({
  summary,
  onResummarize,
  resummarizing,
}: VacancyAiSummarySectionProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <TitledSection
      title={t('vacancyModal.ai_summary_title')}
      icon={Sparkles}
      accessory={
        onResummarize && (
          <Button
            variant="secondary"
            size="sm"
            loading={resummarizing}
            startIcon={<Icon icon={RefreshCw} size="xs" />}
            onClick={onResummarize}
          >
            {t('vacancyModal.resummarize_btn')}
          </Button>
        )
      }
    >
      {summary ? (
        <Paragraph size="sm">{summary}</Paragraph>
      ) : (
        <Text variant="body-sm" tone="muted">
          {t('vacancyModal.no_summary')}
        </Text>
      )}
    </TitledSection>
  );
}
