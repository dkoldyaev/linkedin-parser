'use client';

import { useRef } from 'react';
import {
  Award,
  Banknote,
  Building2,
  FileText,
  Layers,
  MapPin,
  Shield,
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import type { SalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import type { WorkplaceInfo } from '../utils/workplace';
import {
  LINKEDIN_CORPORATE_BLOAT,
  COMPATIBILITY_DATA,
} from './landingConstants';
import type {
  LandingVacancyPreset,
  BloatItemPreset,
  CompatibilityPreset,
} from './landingPresets';
import SkeletonBar from './SkeletonBar';
import { useLandingModalAnimations } from './useLandingModalAnimations';
import LandingModalDetailsTab from './LandingModalDetailsTab';
import LandingModalCompatTab from './LandingModalCompatTab';

export interface LandingVacancyModalProps {
  vacancy: LandingVacancyPreset;
  subScreenId: string;
  isReverse: boolean;
  isEn: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
  bloatItems?: BloatItemPreset[];
  compatibility?: CompatibilityPreset;
}

function renderModalHeader(args: {
  vacancy: LandingVacancyPreset;
  modalWorkplaceInfo: WorkplaceInfo | null;
  currentSalaryInfo: SalaryDisplay;
  isScreen3: boolean;
  overallScore: number;
}) {
  return (
    <div className="modal-header landing-modal-header">
      <div className="landing-modal-meta-row">
        <div className="landing-modal-meta-left">
          <span className="card-company">
            <Building2 size={13} />
            <span>{args.vacancy.company}</span>
          </span>
          <span className="card-location">
            <MapPin size={12} />
            <span>{args.vacancy.location}</span>
          </span>
          {args.modalWorkplaceInfo && (
            <span className={`card-workplace-badge ${args.modalWorkplaceInfo.className}`}>
              <Layers size={11} />
              <span>{args.modalWorkplaceInfo.label}</span>
            </span>
          )}
        </div>

        <div className="landing-modal-meta-right">
          {args.currentSalaryInfo.hasSalary ? (
            <span className="card-salary-badge landing-salary-badge-pop">
              <Banknote size={13} />
              <span>{args.currentSalaryInfo.formatted}</span>
            </span>
          ) : (
            <SkeletonBar width={104} height={18} className="is-pill" />
          )}
          {args.isScreen3 ? (
            <span className="card-match-badge match-high">
              <Award size={11} />
              <span>Match {args.overallScore}%</span>
            </span>
          ) : (
            <SkeletonBar width={68} height={18} className="is-pill" />
          )}
        </div>
      </div>

      <h2 className="landing-modal-title-static">{args.vacancy.title}</h2>
    </div>
  );
}

function renderModalTabs(
  activeTab: 'details' | 'compatibility',
  isScreen3: boolean,
  isEn: boolean,
  overallScore: number
) {
  return (
    <div className="settings-tabs vacancy-tabs">
      <span className={`settings-tab-btn ${activeTab === 'details' ? 'active' : ''}`}>
        <FileText size={14} />
        <span>{isEn ? 'Description & Details' : 'Описание и детали'}</span>
      </span>
      <span
        className={`settings-tab-btn ${activeTab === 'compatibility' ? 'active' : ''} ${
          isScreen3 ? 'is-tab-highlighted' : ''
        }`}
      >
        <Shield size={14} color="#34d399" />
        <span>{isEn ? 'CV Compatibility' : 'Совместимость с CV'}</span>
        {isScreen3 ? (
          <span className="landing-tab-score-pill">{overallScore}%</span>
        ) : (
          <SkeletonBar width={34} height={16} className="is-pill" />
        )}
      </span>
    </div>
  );
}

function resolveVacancySalaryBounds(vacancy: LandingVacancyPreset) {
  return {
    vMin: vacancy.salary_min ? String(vacancy.salary_min) : '144000',
    vMax: vacancy.salary_max ? String(vacancy.salary_max) : '168000',
  };
}

function deriveLandingModalViewFlags(
  subScreenId: string,
  vacancy: LandingVacancyPreset,
  isEn: boolean
) {
  const isScreen3 = subScreenId === '3.1' || subScreenId === '3.2';
  const isSummaryOrCollapsed = subScreenId === '2.3' || isScreen3;
  const bounds = resolveVacancySalaryBounds(vacancy);
  return {
    isScreen3,
    activeTab: (isScreen3 ? 'compatibility' : 'details') as 'details' | 'compatibility',
    isDescriptionPresented: subScreenId === '2.2' || isSummaryOrCollapsed,
    isSummaryPresented: isSummaryOrCollapsed,
    isBloatCollapsed: isSummaryOrCollapsed,
    isCriticalPresented: subScreenId === '3.2',
    summaryText: isEn && vacancy.ai_summary_en ? vacancy.ai_summary_en : vacancy.ai_summary,
    ...bounds,
  };
}

function buildModalSalaryInfo(
  salaryMin: string,
  salaryMax: string,
  vacancy: LandingVacancyPreset,
  t: LandingVacancyModalProps['t']
): SalaryDisplay {
  return getSalaryDisplay(
    {
      salary_min: salaryMin !== '' ? salaryMin : null,
      salary_max: salaryMax !== '' ? salaryMax : null,
      salary_currency: vacancy.salary_currency || '$',
      salary_period: vacancy.salary_period || 'year',
    },
    t,
    'month'
  );
}

export default function LandingVacancyModal({
  vacancy,
  subScreenId,
  isReverse,
  isEn,
  t,
  bloatItems = LINKEDIN_CORPORATE_BLOAT,
  compatibility = COMPATIBILITY_DATA,
}: LandingVacancyModalProps) {
  const flags = deriveLandingModalViewFlags(subScreenId, vacancy, isEn);
  const modalBodyRef = useRef<HTMLDivElement | null>(null);
  const bloatSectionRef = useRef<HTMLDivElement | null>(null);

  const anim = useLandingModalAnimations({
    subScreenId,
    isReverse,
    vMin: flags.vMin,
    vMax: flags.vMax,
    summaryText: flags.summaryText,
    modalBodyRef,
    bloatSectionRef,
  });

  const currentSalaryInfo = buildModalSalaryInfo(anim.salaryMin, anim.salaryMax, vacancy, t);
  const modalWorkplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);

  return (
    <div className="landing-modal-backdrop" aria-hidden="true">
      <div className="modal-content vacancy-modal landing-vacancy-modal">
        {renderModalHeader({
          vacancy,
          modalWorkplaceInfo,
          currentSalaryInfo,
          isScreen3: flags.isScreen3,
          overallScore: compatibility.overall_score,
        })}
        {renderModalTabs(flags.activeTab, flags.isScreen3, isEn, compatibility.overall_score)}

        <div ref={modalBodyRef} className="modal-body landing-modal-body">
          {flags.activeTab === 'details' ? (
            <LandingModalDetailsTab
              ref={bloatSectionRef}
              vacancy={vacancy}
              subScreenId={subScreenId}
              isEn={isEn}
              currentSalaryInfo={currentSalaryInfo}
              salaryMin={anim.salaryMin}
              salaryMax={anim.salaryMax}
              salaryTypingStep={anim.salaryTypingStep}
              isDescriptionPresented={flags.isDescriptionPresented}
              isSummaryPresented={flags.isSummaryPresented}
              isBloatCollapsed={flags.isBloatCollapsed}
              bloatItems={bloatItems}
              summaryText={flags.summaryText}
              summaryTypedChars={anim.summaryTypedChars}
            />
          ) : (
            <LandingModalCompatTab
              subScreenId={subScreenId}
              isEn={isEn}
              isCriticalPresented={flags.isCriticalPresented}
              compatibility={compatibility}
              visibleMatchCount={anim.visibleMatchCount}
              visibleMissingCount={anim.visibleMissingCount}
              visibleCriticalCount={anim.visibleCriticalCount}
              visibleRecsCount={anim.visibleRecsCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
