import React from 'react';
import { Sparkles, RefreshCw, Building2 } from 'lucide-react';
import {
  CollapsibleSection,
  Button,
  Icon,
  Text,
  Paragraph,
  Skeleton,
} from '@blueprint/ui-kit';
import { useTranslation } from '../../i18n/I18nContext';

export default function VacancyAISummarySection({
  aiSummary,
  companyDescription,
  onResummarize,
  resummarizing = false,
  isOpen = true,
  onOpenChange,
}) {
  const { t } = useTranslation();

  return (
    <CollapsibleSection
      title={t('vacancyModal.ai_summary_title')}
      icon={<Icon icon={Sparkles} size="sm" tone="accent" />}
      open={isOpen}
      onOpenChange={onOpenChange}
      accessoryAction={
        <Button
          variant="ghost"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            onResummarize();
          }}
          disabled={resummarizing}
          loading={resummarizing}
          title={t('vacancyModal.resummarize_btn')}
          startIcon={<Icon icon={RefreshCw} size="xs" />}
        >
          {t('vacancyModal.resummarize_btn')}
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
        {aiSummary ? (
          <Paragraph variant="body" tone="primary" style={{ lineHeight: 1.6 }}>
            {aiSummary}
          </Paragraph>
        ) : resummarizing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Skeleton width="full" height="xs" />
            <Skeleton width="full" height="xs" />
            <Skeleton width="lg" height="xs" />
          </div>
        ) : (
          <Text variant="caption" tone="muted">
            {t('vacancyModal.no_summary')}
          </Text>
        )}

        {companyDescription && (
          <div style={{
            marginTop: 'var(--ui-space-2)',
            paddingTop: 'var(--ui-space-3)',
            borderTop: '1px solid var(--ui-border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--ui-space-1)',
          }}>
            <Text
              variant="caption"
              weight="bold"
              tone="secondary"
              startIcon={<Icon icon={Building2} size="xs" />}
            >
              {t('vacancyModal.about_company')}
            </Text>
            <Paragraph variant="caption" tone="secondary" style={{ lineHeight: 1.5 }}>
              {companyDescription}
            </Paragraph>
          </div>
        )}
      </div>
    </CollapsibleSection>
  );
}
