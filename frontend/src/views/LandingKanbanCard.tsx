'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import {
  Award,
  Banknote,
  Building,
  ExternalLink,
  History,
  Laptop,
  Layers,
} from 'lucide-react';
import { getSalaryDisplay } from '../utils/salary';
import type { SalaryDisplay } from '../utils/salary';
import { getWorkplaceInfo } from '../utils/workplace';
import type { WorkplaceInfo } from '../utils/workplace';
import { BOARD_COLUMNS } from './landingConstants';
import type { ComputedLandingBoardVacancy } from './landingConstants';
import SkeletonBar from './SkeletonBar';

export interface LandingKanbanCardProps {
  vacancy: ComputedLandingBoardVacancy;
  status: string;
  lane: number | null;
  justArrived: boolean;
  justMoved: boolean;
  justMovedBack: boolean;
  isSelected: boolean;
  showSalary: boolean;
  showSummary: boolean;
  showMatch: boolean;
  isEn: boolean;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function resolveMatchTier(matchScore: number | null): string {
  if (matchScore === null) return '';
  if (matchScore >= 75) return 'match-high';
  if (matchScore >= 50) return 'match-medium';
  return 'match-low';
}

function buildLandingCardClassName(
  props: LandingKanbanCardProps,
  matchTier: string
): string {
  return [
    'kanban-card',
    'landing-kanban-card',
    props.isSelected ? 'is-selected' : '',
    props.justArrived ? 'is-just-arrived' : '',
    props.justMoved ? 'is-just-moved' : '',
    props.justMovedBack ? 'is-just-moved-back' : '',
    props.showMatch && matchTier ? `card-${matchTier}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function renderCardTopSection(
  vacancy: ComputedLandingBoardVacancy,
  status: string,
  lane: number | null,
  isEn: boolean
) {
  const showLaneBadge = status === 'Собеседование' && lane != null;
  return (
    <div className="card-top">
      <div className="card-heading">
        <div className="card-title-container">
          <div className="card-header-meta">
            <span className="card-source-link">
              <span>{vacancy.source}</span>
              <ExternalLink size={9} />
            </span>
            <span className="landing-card-company-inline">· {vacancy.company}</span>
          </div>
          <h3 className="card-title">{vacancy.title}</h3>
        </div>
      </div>

      <div className="card-status-indicators">
        {showLaneBadge && (
          <span className="card-lane-badge">
            {isEn ? `stage ${lane + 1}` : `этап ${lane + 1}`}
          </span>
        )}
      </div>
    </div>
  );
}

function renderWorkplaceIcon(key: string) {
  if (key === 'remote') return <Laptop size={10} />;
  if (key === 'hybrid') return <Layers size={10} />;
  if (key === 'on-site') return <Building size={10} />;
  return null;
}

function renderCardMetaRow(args: {
  showMatch: boolean;
  matchScore: number | null;
  matchTier: string;
  showSalary: boolean;
  workplaceInfo: WorkplaceInfo | null;
  salaryInfo: SalaryDisplay;
}) {
  return (
    <div className="card-meta">
      {args.showMatch && args.matchScore !== null ? (
        <div className={`card-match-badge ${args.matchTier}`}>
          <Award size={10} />
          <span>{args.matchScore}%</span>
        </div>
      ) : (
        <SkeletonBar width={42} height={16} className="is-pill" />
      )}

      {args.showSalary && args.workplaceInfo ? (
        <div className={`card-workplace-badge ${args.workplaceInfo.className}`}>
          {renderWorkplaceIcon(args.workplaceInfo.key)}
          <span>{args.workplaceInfo.label}</span>
        </div>
      ) : (
        <SkeletonBar width={58} height={16} className="is-pill" />
      )}

      {args.showSalary && args.salaryInfo.hasSalary ? (
        <div className="card-salary-badge">
          <Banknote size={11} />
          <span>{args.salaryInfo.formatted}</span>
        </div>
      ) : (
        <SkeletonBar width={76} height={16} className="is-pill" />
      )}
    </div>
  );
}

function renderCardSummaryAndTech(
  showSummary: boolean,
  summaryText: string,
  techStack: string[]
) {
  if (!showSummary) {
    return (
      <>
        <div className="landing-card-skeleton-lines" aria-hidden="true">
          <SkeletonBar width="94%" height={9} />
          <SkeletonBar width="72%" height={9} />
        </div>
        <div className="card-tech-stack" aria-hidden="true">
          <SkeletonBar width={34} height={15} />
          <SkeletonBar width={52} height={15} />
          <SkeletonBar width={42} height={15} />
        </div>
      </>
    );
  }
  return (
    <>
      <div className="card-summary">{summaryText}</div>
      <div className="card-tech-stack">
        {techStack.slice(0, 3).map((tech) => (
          <span key={tech} className="tech-chip">
            {tech}
          </span>
        ))}
      </div>
    </>
  );
}

function renderHistoryIndicator(
  vacancy: ComputedLandingBoardVacancy,
  justMoved: boolean
) {
  if (vacancy.history_count <= 0) return null;
  return (
    <span className={`card-history-indicator ${justMoved ? 'is-history-pop' : ''}`}>
      <History size={10} />
      <span>{vacancy.history_count}</span>
      {vacancy.has_comment && <span className="card-history-comment-dot" />}
    </span>
  );
}

function renderCardFooter(
  vacancy: ComputedLandingBoardVacancy,
  createdText: string,
  colIndex: number,
  flags: { justMoved: boolean; justMovedBack: boolean }
) {
  const dimLeft = colIndex <= 0 && !flags.justMovedBack;
  const dimRight = colIndex >= BOARD_COLUMNS.length - 1 && !flags.justMoved;

  return (
    <div className="card-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="card-date">{createdText}</span>
        {renderHistoryIndicator(vacancy, flags.justMoved)}
      </div>

      <div className="card-quick-actions">
        <span
          className={`quick-move-btn ${flags.justMovedBack ? 'is-stepping-arrow' : ''}`}
          aria-hidden="true"
          style={{ opacity: dimLeft ? 0.3 : 1 }}
        >
          &lt;
        </span>
        <span className="quick-move-btn quick-reject-btn" aria-hidden="true">
          ×
        </span>
        <span
          className={`quick-move-btn ${flags.justMoved ? 'is-stepping-arrow' : ''}`}
          aria-hidden="true"
          style={{ opacity: dimRight ? 0.3 : 1 }}
        >
          &gt;
        </span>
      </div>
    </div>
  );
}

export default function LandingKanbanCard(props: LandingKanbanCardProps) {
  const { vacancy, status, lane, showSalary, showSummary, showMatch, isEn, t } = props;
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [gridHeight, setGridHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;
    const updateHeight = () => {
      const grid =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--grid')) || 32;
      const height = Math.ceil(content.offsetHeight / grid) * grid;
      setGridHeight((prev) => (prev === height ? prev : height));
    };
    const observer = new ResizeObserver(updateHeight);
    observer.observe(content);
    updateHeight();
    return () => observer.disconnect();
  }, [status, lane, showSalary, showSummary, showMatch, isEn]);

  const colIndex = BOARD_COLUMNS.findIndex((c) => c.id === status);
  const salaryInfo = getSalaryDisplay(vacancy, t, 'month');
  const workplaceInfo = getWorkplaceInfo(vacancy.workplace_type, t);
  const matchScore = vacancy.match_score != null ? Math.round(vacancy.match_score) : null;
  const matchTier = resolveMatchTier(matchScore);

  const summaryText = isEn && vacancy.ai_summary_en ? vacancy.ai_summary_en : vacancy.ai_summary;
  const createdText = isEn && vacancy.created_at_en ? vacancy.created_at_en : vacancy.created_at;

  return (
    <div className={buildLandingCardClassName(props, matchTier)}>
      <div className="card-grid-content">
        <div
          className="card-grid-body"
          style={gridHeight ? { minHeight: gridHeight } : undefined}
        >
          <div className="card-grid-body-content" ref={contentRef}>
            {renderCardTopSection(vacancy, status, lane, isEn)}
            {renderCardMetaRow({
              showMatch,
              matchScore,
              matchTier,
              showSalary,
              workplaceInfo,
              salaryInfo,
            })}
            {renderCardSummaryAndTech(showSummary, summaryText, vacancy.tech_stack)}
          </div>
        </div>

        {renderCardFooter(vacancy, createdText, colIndex, {
          justMoved: props.justMoved,
          justMovedBack: props.justMovedBack,
        })}
      </div>
    </div>
  );
}
