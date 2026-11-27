import {
  AlertBanner,
  Badge,
  Blockquote,
  Button,
  CollapsibleSection,
  EmptyState,
  Icon,
  List,
  ListItem,
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
import { SectionStack } from '../SectionStack';
import { TitledSection } from '../TitledSection';
import { useTranslation } from '../../i18n/I18nContext';

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
      <SectionStack>
        <div style={SKELETON_STACK_STYLE} data-testid="vacancy-compatibility-skeleton">
          <Skeleton variant="rect" width="100" height="md" />
          <Skeleton variant="rect" width="100" height="lg" />
        </div>
      </SectionStack>
    );
  }

  const isLoading = Boolean(analyzingCompatibility || loadingCompatibility);
  const isCvOutdated = Boolean(compatibility?.is_outdated);
  const revisionStr = compatibility?.cv_revision ? String(compatibility.cv_revision) : '';
  const sections = buildCompatibilitySections(compatibility, t);
  const recommendations = buildRecommendationsList(compatibility);

  return (
    <SectionStack>
      {isCvOutdated && (
        <AlertBanner tone="warning">
          {t('vacancyModal.compat_outdated', { revision: revisionStr })}
        </AlertBanner>
      )}
      {compatError && <AlertBanner tone="danger">{compatError}</AlertBanner>}

      {seniority && (
        <TitledSection title={t('vacancyModal.compat_seniority')} icon={Sparkles}>
          <Blockquote tone={seniority.statusTone}>{seniority.comment}</Blockquote>
        </TitledSection>
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
        <TitledSection
          title={t('vacancyModal.compat_matched', {
            count: compatibility.matched_requirements.length,
          })}
          icon={CheckCircle}
          tone="success"
        >
          {compatibility.matched_requirements.map((item, i) => (
            <CollapsibleSection title={item.requirement} key={i} expandLabel={null} collapseLabel={null}>
              <Text>{item.evidence}</Text>
            </CollapsibleSection>
          ))}
        </TitledSection>
      )}

      {compatibility?.missing_requirements && (
        <TitledSection
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
        </TitledSection>
      )}

      {compatibility?.critical_gaps && (
        <TitledSection
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
        </TitledSection>
      )}

      {recommendations.length > 0 && (
        <TitledSection
          title={t('vacancyModal.compat_recommendations')}
          icon={Layers}
          paddingBody="md"
        >
          <List>
            {recommendations.map((rec, i) => (
              <ListItem key={i}>{rec}</ListItem>
            ))}
          </List>
        </TitledSection>
      )}
    </SectionStack>
  );
}
