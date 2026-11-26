import {
  AlertBanner,
  Badge,
  Blockquote,
  Button,
  CollapsibleSection,
  EmptyState,
  Icon,
  Paragraph,
  Skeleton,
  Text,
} from '@blueprint/ui-kit';
import { AlertTriangle, CheckCircle, Info, Layers, Shield, Sparkles } from 'lucide-react';
import {
  buildCompatibilitySections,
  buildRecommendationsList,
  resolveSeniorityInfo,
} from './vacancyModalHelpers';
import type { CompatibilityAnalysis, Vacancy } from '../../types/models';
import React from 'react';
import { useTranslation } from '../../i18n/I18nContext';
import { VacancySection } from './VacancySection';
import { VacancyTabContent } from './VacancyTabContent';

export interface VacancyCompatibilityTabProps {
  vacancy: Vacancy;
  compatibility?: CompatibilityAnalysis | null;
  matchScore?: number;
  analyzingCompatibility?: boolean;
  loadingCompatibility?: boolean;
  loadingDetails?: boolean;
  compatError?: string | null;
  onRunCompatibility?: (hasExistingSections: boolean) => void;
}

const SKELETON_STACK_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-3)',
};

export function VacancyCompatibilityTab({
  vacancy,
  compatibility,
  analyzingCompatibility,
  loadingCompatibility,
  loadingDetails,
  compatError,
  onRunCompatibility,
}: VacancyCompatibilityTabProps): React.ReactElement {
  const { t } = useTranslation();
  const seniority = compatibility?.summary ? resolveSeniorityInfo(compatibility, t) : null;

  if (!compatibility && (loadingCompatibility || loadingDetails)) {
    return (
      <VacancyTabContent>
        <div style={SKELETON_STACK_STYLE} data-testid="vacancy-compatibility-skeleton">
          <Skeleton variant="rect" width="100" height="md" />
          <Skeleton variant="rect" width="100" height="lg" />
        </div>
      </VacancyTabContent>
    );
  }

  const isLoading = Boolean(analyzingCompatibility || loadingCompatibility);
  const isCvOutdated = Boolean(compatibility?.is_outdated);
  const revisionStr = compatibility?.cv_revision ? String(compatibility.cv_revision) : '';
  const sections = buildCompatibilitySections(compatibility, t);
  const recommendations = buildRecommendationsList(compatibility);

  return (
    <VacancyTabContent>
      {isCvOutdated && (
        <AlertBanner tone="warning">
          {t('vacancyModal.compat_outdated', { revision: revisionStr })}
        </AlertBanner>
      )}
      {compatError && <AlertBanner tone="danger">{compatError}</AlertBanner>}

      {seniority && (
        <VacancySection title={t('vacancyModal.compat_seniority')} icon={Sparkles}>
          <Blockquote tone={seniority.statusTone}>{seniority.comment}</Blockquote>
        </VacancySection>
      )}

      {sections.length === 0 && (
        <EmptyState
          title={t('vacancyModal.compat_title')}
          description={
            vacancy.description
              ? t('vacancyModal.empty_compat_prompt')
              : t('vacancyModal.compat_no_description')
          }
          action={
            onRunCompatibility ? (
              <Button
                variant="primary"
                onClick={() => onRunCompatibility(false)}
                loading={isLoading}
                startIcon={<Icon icon={Shield} size="xs" />}
              >
                {t('vacancyModal.compat_compare')}
              </Button>
            ) : undefined
          }
        />
      )}

      {compatibility?.matched_requirements && (
        <VacancySection
          title={t('vacancyModal.compat_matched', {
            count: compatibility.matched_requirements.length,
          })}
          icon={CheckCircle}
          tone="mint"
        >
          {compatibility.matched_requirements.map((item, i) => (
            <CollapsibleSection title={item.requirement} key={i}>
              <Text>{item.evidence}</Text>
            </CollapsibleSection>
          ))}
        </VacancySection>
      )}

      {compatibility?.missing_requirements && (
        <VacancySection
          title={t('vacancyModal.compat_missing', {
            count: compatibility.missing_requirements.length,
          })}
          icon={Info}
          tone="warning"
        >
          {compatibility.missing_requirements.map((item, i) => (
            <CollapsibleSection
              title={item.requirement}
              key={i}
              accessory={
                <Badge size="xs">{t(`vacancyModal.compat_severity.${item.severity}`)}</Badge>
              }
            >
              <Text>{item.reason}</Text>
            </CollapsibleSection>
          ))}
        </VacancySection>
      )}

      {compatibility?.critical_gaps && (
        <VacancySection
          title={t('vacancyModal.compat_gaps', { count: compatibility.critical_gaps.length })}
          icon={AlertTriangle}
          tone="danger"
        >
          {compatibility.critical_gaps.map((item, i) =>
            typeof item === 'string' ? (
              <Text key={i}>{item}</Text>
            ) : (
              <CollapsibleSection
                title={item.requirement}
                key={i}
                accessory={item.impact && <Badge size="xs">{item.impact}</Badge>}
              >
                <Text>{item.reason}</Text>
              </CollapsibleSection>
            ),
          )}
        </VacancySection>
      )}

      {recommendations.length > 0 && (
        <VacancySection
          title={t('vacancyModal.compat_recommendations')}
          icon={Layers}
          paddingBody="md"
        >
          {recommendations.map((rec, i) => (
            <Paragraph spacing="sm" key={i}>
              {rec}
            </Paragraph>
          ))}
        </VacancySection>
      )}
    </VacancyTabContent>
  );
}
