
import React from 'react';
import {
  Banknote,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
} from 'lucide-react';
import type { SalaryDisplay } from '../utils/salary';
import type { LandingVacancyPreset, BloatItemPreset } from './landingPresets';
import SkeletonBar from './SkeletonBar';

export interface LandingModalDetailsTabProps {
  vacancy: LandingVacancyPreset;
  subScreenId: string;
  isEn: boolean;
  currentSalaryInfo: SalaryDisplay;
  salaryMin: string;
  salaryMax: string;
  salaryTypingStep: number;
  isDescriptionPresented: boolean;
  isSummaryPresented: boolean;
  isBloatCollapsed: boolean;
  bloatItems: BloatItemPreset[];
  summaryText: string;
  summaryTypedChars: number;
}

const CURRENCY_LABEL_MAP: Record<string, string> = {
  '€': '€ (EUR)',
  '₽': '₽ (RUB)',
  '£': '£ (GBP)',
};

function resolveCurrencyLabel(currency: string | null | undefined): string {
  if (!currency) return '$ (USD)';
  return CURRENCY_LABEL_MAP[currency] || '$ (USD)';
}

function resolvePeriodLabel(period: string | null | undefined, isEn: boolean): string {
  if (period === 'month') {
    return isEn ? 'per month' : 'в месяц';
  }
  return isEn ? 'per year (/ 12)' : 'в год (/ 12)';
}

function resolveCompressionBadgeText(isBloatCollapsed: boolean, isEn: boolean): string {
  if (isBloatCollapsed) {
    return isEn ? 'FLUFF COLLAPSED (−94%)' : 'ВОДА СХЛОПНУТА (−94%)';
  }
  return isEn ? '90% CORPORATE FLUFF' : '90% КОРПОРАТИВНОЙ ВОДЫ';
}

function renderSalaryTotalStatus(currentSalaryInfo: SalaryDisplay, isEn: boolean) {
  if (currentSalaryInfo.hasSalary) {
    return <span>= {currentSalaryInfo.formatted}</span>;
  }
  return (
    <span style={{ color: 'var(--text-muted)' }}>
      {isEn ? 'Extracting range from text...' : 'Ввод вилки из текста...'}
    </span>
  );
}

function renderSalaryBoundField(
  label: string,
  typedValue: string,
  fallbackValue: number | string | undefined,
  isTyping: boolean
) {
  return (
    <div className="salary-field-item">
      <span className="salary-field-label">{label}</span>
      <div
        className={`form-input salary-field-input landing-static-input ${
          isTyping ? 'is-typing-input' : ''
        }`}
      >
        {typedValue || <span className="landing-input-placeholder">{fallbackValue}</span>}
      </div>
    </div>
  );
}

function renderStaticSalaryField(label: string, value: string) {
  return (
    <div className="salary-field-item">
      <span className="salary-field-label">{label}</span>
      <div className="form-input salary-field-input landing-static-input">
        {value}
      </div>
    </div>
  );
}

function isStepInRange(step: number, min: number, max: number): boolean {
  return step >= min && step <= max;
}

function resolveSalarySectionLabels(isEn: boolean) {
  if (isEn) {
    return {
      salary: 'Salary',
      min: 'Minimum',
      max: 'Maximum',
      currency: 'Currency',
      period: 'Period',
    };
  }
  return {
    salary: 'Зарплата',
    min: 'Минимум',
    max: 'Максимум',
    currency: 'Валюта',
    period: 'Период',
  };
}

function renderSalarySection(props: LandingModalDetailsTabProps) {
  const { vacancy, subScreenId, isEn, currentSalaryInfo, salaryMin, salaryMax, salaryTypingStep } =
    props;
  const isFocused = subScreenId === '2.1';
  const labels = resolveSalarySectionLabels(isEn);

  return (
    <div className={`form-group vacancy-salary ${isFocused ? 'is-section-focused' : ''}`}>
      <div className="vacancy-salary-header">
        <div className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
          <Banknote size={15} color="var(--aspen-mint)" />
          <span style={{ fontWeight: 600 }}>{labels.salary}</span>
        </div>
        <div className="vacancy-salary-total">
          {renderSalaryTotalStatus(currentSalaryInfo, isEn)}
        </div>
      </div>

      <div className="salary-fields-grid">
        {renderSalaryBoundField(
          labels.min,
          salaryMin,
          vacancy.salary_min || 100000,
          isStepInRange(salaryTypingStep, 1, 3)
        )}
        {renderSalaryBoundField(
          labels.max,
          salaryMax,
          vacancy.salary_max || 140000,
          isStepInRange(salaryTypingStep, 4, 6)
        )}
        {renderStaticSalaryField(
          labels.currency,
          resolveCurrencyLabel(vacancy.salary_currency)
        )}
        {renderStaticSalaryField(
          labels.period,
          resolvePeriodLabel(vacancy.salary_period, isEn)
        )}
      </div>
    </div>
  );
}

function renderDescriptionSkeleton() {
  return (
    <div className="landing-modal-skeleton-section">
      <div className="landing-modal-skeleton-group">
        <div className="landing-modal-skeleton-header">
          <SkeletonBar width={190} height={12} />
          <SkeletonBar width={90} height={16} className="is-pill" />
        </div>
        <SkeletonBar width="96%" height={11} />
        <SkeletonBar width="88%" height={11} />
        <SkeletonBar width="74%" height={11} />
      </div>

      <div className="landing-modal-skeleton-group">
        <div className="landing-modal-skeleton-header">
          <SkeletonBar width={140} height={12} />
        </div>
        <div className="landing-skeleton-chips-row">
          <SkeletonBar width={52} height={20} />
          <SkeletonBar width={78} height={20} />
          <SkeletonBar width={64} height={20} />
          <SkeletonBar width={58} height={20} />
        </div>
      </div>
    </div>
  );
}

function renderSummaryAndTokens(args: {
  isSummaryPresented: boolean;
  isEn: boolean;
  summaryText: string;
  summaryTypedChars: number;
  techStack: string[];
}) {
  if (!args.isSummaryPresented) {
    return (
      <div className="landing-modal-skeleton-section is-compact">
        <div className="landing-modal-skeleton-group">
          <SkeletonBar width={210} height={11} />
          <SkeletonBar width="92%" height={10} />
          <SkeletonBar width="76%" height={10} />
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="vacancy-ai-summary is-section-focused">
        <div className="vacancy-ai-summary-header">
          <div className="vacancy-ai-summary-title">
            <Sparkles size={15} />
            <span>
              {args.isEn ? 'AI Summary (2 sentences)' : 'Краткое содержание (AI · 2 предложения)'}
            </span>
          </div>
        </div>

        <p className="vacancy-ai-summary-text">
          <span>{args.summaryText.slice(0, args.summaryTypedChars)}</span>
          {args.summaryTypedChars < args.summaryText.length && (
            <span className="tw-cursor" aria-hidden="true">▋</span>
          )}
          <span className="tw-ghost" aria-hidden="true">
            {args.summaryText.slice(args.summaryTypedChars)}
          </span>
        </p>
      </div>

      <div className="form-group vacancy-tokens-section">
        <div className="form-label">{args.isEn ? 'Tech Stack' : 'Стек технологий'}</div>
        <div className="editable-token-list">
          {args.techStack.map((tech) => (
            <span key={tech} className="editable-token">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

const LandingModalDetailsTab = React.forwardRef<
  HTMLDivElement,
  LandingModalDetailsTabProps
>(function LandingModalDetailsTab(props, bloatRef) {
  const { isDescriptionPresented, isBloatCollapsed, isEn, bloatItems } = props;

  return (
    <>
      {renderSalarySection(props)}

      {!isDescriptionPresented ? (
        renderDescriptionSkeleton()
      ) : (
        <>
          <div
            ref={bloatRef}
            className={`form-group orig-desc-section landing-bloat-section ${
              isBloatCollapsed ? 'is-collapsed' : 'is-expanded'
            }`}
          >
            <div className="orig-desc-header">
              <div className="orig-desc-header-title">
                <FileText size={14} />
                <span>
                  {isEn
                    ? 'Original LinkedIn Description (4,180 chars)'
                    : 'Оригинальное описание из LinkedIn (4 180 симв.)'}
                </span>
              </div>
              <div className="orig-desc-header-action">
                <span
                  className={`landing-compression-badge ${
                    isBloatCollapsed ? 'is-done' : 'is-raw'
                  }`}
                >
                  {resolveCompressionBadgeText(isBloatCollapsed, isEn)}
                </span>
                {isBloatCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>

            <div className="landing-bloat-collapsible">
              {bloatItems.map((block) => (
                <div
                  key={block.id}
                  className={`landing-bloat-paragraph ${
                    block.isBloat ? 'is-corporate-water' : 'is-real-signal'
                  }`}
                >
                  <span className="landing-bloat-tag">
                    {isEn ? block.labelEn : block.label}
                  </span>
                  <p>{isEn ? block.textEn : block.text}</p>
                </div>
              ))}
            </div>
          </div>

          {renderSummaryAndTokens({
            isSummaryPresented: props.isSummaryPresented,
            isEn,
            summaryText: props.summaryText,
            summaryTypedChars: props.summaryTypedChars,
            techStack: props.vacancy.tech_stack,
          })}
        </>
      )}
    </>
  );
});

export default LandingModalDetailsTab;
