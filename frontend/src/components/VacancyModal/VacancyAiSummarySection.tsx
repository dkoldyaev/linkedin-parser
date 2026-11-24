import React from 'react';
import { Button, Icon, Paragraph, Text } from '@blueprint/ui-kit';
import { Sparkles, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';
import { VacancySection } from './VacancySection';

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
    <VacancySection
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
    </VacancySection>
  );
}
