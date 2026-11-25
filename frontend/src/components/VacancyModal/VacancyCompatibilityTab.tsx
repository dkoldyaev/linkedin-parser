import React from 'react';
import {
  AlertBanner,
  Button,
  EmptyState,
  Icon,
  Paragraph,
  ReportAccordion,
  SectionHeader,
  Skeleton,
  Text,
} from '@blueprint/ui-kit';
import { Shield } from 'lucide-react';
import { useTranslation, type TranslateFn } from '../../i18n/I18nContext';
import {
  buildCompatibilitySections,
  buildRecommendationsList,
  resolveCompatibilityDisplayScore,
  resolveCompatScoreTone,
  resolveSeniorityInfo,
} from './vacancyModalHelpers';
import type { CompatibilityAnalysis, Vacancy } from '../../types/models';
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

function renderCompatSummaryBlock(
  compatibility: CompatibilityAnalysis | null | undefined,
  t: TranslateFn
): React.ReactNode {
  if (!compatibility?.summary) return null;
  const seniority = resolveSeniorityInfo(compatibility, t);
  return (
    <div style={{ padding: 12, backgroundColor: 'var(--surface-subtle, #f8fafc)', borderRadius: 6 }}>
      <Paragraph size="sm">{compatibility.summary}</Paragraph>
      {seniority.comment && (
        <div style={{ marginTop: 8 }}>
          <Paragraph size="sm">
            {t('vacancyModal.compat_seniority')}{' '}
            <Text as="span" weight="bold" tone={seniority.statusTone}>
              {seniority.statusLabel}
            </Text>{' '}
            — {seniority.comment}
          </Paragraph>
        </div>
      )}
    </div>
  );
}

function renderRecommendationsBlock(
  recommendations: string[] | null | undefined,
  t: TranslateFn
): React.ReactNode {
  if (!recommendations || recommendations.length === 0) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <SectionHeader title={t('vacancyModal.compat_recommendations')} tone="accent" />
      <div style={{ paddingTop: 8 }}>
        <ul style={{ paddingLeft: 20, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {recommendations.map((rec, i) => (
            <li key={i}>
              <Text variant="body-sm" tone="secondary">
                {rec}
              </Text>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function renderReportOrEmptyState(args: {
  vacancy: Vacancy;
  compatibility: CompatibilityAnalysis | null | undefined;
  matchScore: number | undefined;
  isLoading: boolean;
  onRunCompatibility: ((hasExistingSections: boolean) => void) | undefined;
  t: TranslateFn;
}): React.ReactElement {
  const sections = buildCompatibilitySections(args.compatibility, args.t);
  const score = resolveCompatibilityDisplayScore(args.compatibility, args.matchScore);
  const scoreLabel = score != null ? `${Math.round(score)}%` : undefined;

  if (sections.length > 0) {
    return (
      <ReportAccordion
        title={args.t('vacancyModal.tab_cv_compatibility')}
        scoreLabel={scoreLabel}
        scoreTone={resolveCompatScoreTone(score)}
        onAction={args.onRunCompatibility ? () => args.onRunCompatibility?.(true) : undefined}
        actionLabel={args.t('vacancyModal.compat_reanalyze')}
        actionLoading={args.isLoading}
        defaultActionLabel={args.t('common.confirm')}
        sections={sections as never}
      />
    );
  }

  const emptyDesc = args.vacancy.description
    ? args.t('vacancyModal.empty_compat_prompt')
    : args.t('vacancyModal.compat_no_description');
  const compareBtn = args.onRunCompatibility ? (
    <Button
      variant="primary"
      onClick={() => args.onRunCompatibility?.(false)}
      loading={args.isLoading}
      startIcon={<Icon icon={Shield} size="xs" />}
    >
      {args.t('vacancyModal.compat_compare')}
    </Button>
  ) : undefined;

  return (
    <EmptyState
      title={args.t('vacancyModal.compat_title')}
      description={emptyDesc}
      action={compareBtn}
    />
  );
}

function isInitialCompatSkeletonState(
  loadingCompatibility: boolean | undefined,
  loadingDetails: boolean | undefined,
  compatibility: CompatibilityAnalysis | null | undefined
): boolean {
  if (compatibility) return false;
  return Boolean(loadingCompatibility || loadingDetails);
}

function renderCompatibilityBanners(
  compatibility: CompatibilityAnalysis | null | undefined,
  compatError: string | null | undefined,
  t: TranslateFn
): React.ReactNode {
  const isCvOutdated = Boolean(compatibility?.is_outdated);
  const revisionStr = compatibility?.cv_revision ? String(compatibility.cv_revision) : '';
  return (
    <>
      {isCvOutdated && (
        <AlertBanner tone="warning">
          {t('vacancyModal.compat_outdated', { revision: revisionStr })}
        </AlertBanner>
      )}
      {compatError && <AlertBanner tone="danger">{compatError}</AlertBanner>}
    </>
  );
}

export function VacancyCompatibilityTab(
  props: VacancyCompatibilityTabProps
): React.ReactElement {
  const { t } = useTranslation();

  if (
    isInitialCompatSkeletonState(
      props.loadingCompatibility,
      props.loadingDetails,
      props.compatibility
    )
  ) {
    return (
      <VacancyTabContent>
        <div style={SKELETON_STACK_STYLE} data-testid="vacancy-compatibility-skeleton">
          <Skeleton variant="rect" width="100" height="md" />
          <Skeleton variant="rect" width="100" height="lg" />
        </div>
      </VacancyTabContent>
    );
  }

  const isLoading = Boolean(props.analyzingCompatibility || props.loadingCompatibility);

  return (
    <VacancyTabContent>
      {renderCompatibilityBanners(props.compatibility, props.compatError, t)}
      {renderCompatSummaryBlock(props.compatibility, t)}
      {renderReportOrEmptyState({
        vacancy: props.vacancy,
        compatibility: props.compatibility,
        matchScore: props.matchScore,
        isLoading,
        onRunCompatibility: props.onRunCompatibility,
        t,
      })}
      {renderRecommendationsBlock(buildRecommendationsList(props.compatibility), t)}
    </VacancyTabContent>
  );
}
