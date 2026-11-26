import type { CompatibilityPreset } from './landingPresets';
import SkeletonBar from './SkeletonBar';

export interface LandingModalCompatTabProps {
  subScreenId: string;
  isEn: boolean;
  isCriticalPresented: boolean;
  compatibility: CompatibilityPreset;
  visibleMatchCount: number;
  visibleMissingCount: number;
  visibleCriticalCount: number;
  visibleRecsCount: number;
}

function renderOptionalEvidenceQuote(
  idx: number,
  subScreenId: string,
  isShown: boolean,
  evText: string | undefined,
) {
  if (idx !== 0 || subScreenId !== '3.1' || !isShown || !evText) {
    return null;
  }
  return <div className="compatibility-evidence">{evText}</div>;
}

function renderMatchedRequirementItem(
  m: CompatibilityPreset['matched_requirements'][number],
  idx: number,
  ctx: { visibleMatchCount: number; subScreenId: string; isEn: boolean },
) {
  const isShown = idx < ctx.visibleMatchCount;
  const reqText = ctx.isEn ? m.requirementEn : m.requirement;
  const evText = ctx.isEn ? m.evidenceEn : m.evidence;

  return (
    <div
      key={m.requirement}
      className={`compatibility-row landing-compat-row ${
        isShown ? 'is-printed' : 'is-pending-print'
      }`}
    >
      <div className="landing-compat-row-main">
        <span style={{ color: 'var(--aspen-mint)', fontWeight: 600 }}>&bull; {reqText}</span>
      </div>
      {renderOptionalEvidenceQuote(idx, ctx.subScreenId, isShown, evText)}
    </div>
  );
}

function renderMatchedGroup(
  compatibility: CompatibilityPreset,
  visibleMatchCount: number,
  subScreenId: string,
  isEn: boolean,
) {
  const titleText = isEn
    ? `MATCH / Confirmed Requirements (${compatibility.matched_requirements.length}):`
    : `MATCH / Подтверждённые требования (${compatibility.matched_requirements.length}):`;
  const ctx = { visibleMatchCount, subScreenId, isEn };

  return (
    <div className="compatibility-group">
      <div className="compatibility-group-title is-matched">
        <span>{titleText}</span>
      </div>
      <div className="compatibility-list">
        {compatibility.matched_requirements.map((m, idx) =>
          renderMatchedRequirementItem(m, idx, ctx),
        )}
      </div>
    </div>
  );
}

function renderMissingGroup(
  compatibility: CompatibilityPreset,
  visibleMissingCount: number,
  isEn: boolean,
) {
  const titleText = isEn
    ? `MISSING / Unconfirmed Requirements (${compatibility.missing_requirements.length}):`
    : `MISSING / Неподтверждённые требования (${compatibility.missing_requirements.length}):`;

  return (
    <div className="compatibility-group">
      <div className="compatibility-group-title is-missing">
        <span>{titleText}</span>
      </div>
      <div className="compatibility-list">
        {compatibility.missing_requirements.map((m, idx) => {
          const isShown = idx < visibleMissingCount;
          return (
            <div
              key={m.requirement}
              className={`compatibility-row landing-compat-row ${
                isShown ? 'is-printed' : 'is-pending-print'
              }`}
            >
              &bull; <strong>{isEn ? m.requirementEn : m.requirement}</strong>{' '}
              <span className="landing-severity-tag">[{m.severity}]</span>:{' '}
              {isEn ? m.reasonEn : m.reason}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function renderCriticalAndRecsGroups(
  compatibility: CompatibilityPreset,
  visibleCriticalCount: number,
  visibleRecsCount: number,
  isEn: boolean,
) {
  const recsList = isEn
    ? compatibility.recommendationsEn || compatibility.recommendations || []
    : compatibility.recommendations || [];
  const criticalTitle = isEn
    ? `CRITICAL / Critical Mismatches (${compatibility.critical_gaps.length}):`
    : `CRITICAL / Критические несоответствия (${compatibility.critical_gaps.length}):`;
  const recsTitle = isEn
    ? 'RECOMMENDATIONS / CV Tailoring Tips:'
    : 'RECOMMENDATIONS / Рекомендации для адаптации CV:';

  return (
    <>
      <div className="compatibility-group">
        <div className="compatibility-group-title is-critical">
          <span>{criticalTitle}</span>
        </div>
        <div className="compatibility-list">
          {compatibility.critical_gaps.map((g, idx) => {
            const isShown = idx < visibleCriticalCount;
            return (
              <div
                key={g.requirement}
                className={`compatibility-row landing-compat-row ${
                  isShown ? 'is-printed' : 'is-pending-print'
                }`}
              >
                &bull;{' '}
                <strong style={{ color: '#f87171' }}>
                  {isEn ? g.requirementEn : g.requirement}
                </strong>
                : {isEn ? g.reasonEn : g.reason}
              </div>
            );
          })}
        </div>
      </div>

      <div className="compatibility-recommendations">
        <div className="compatibility-group-title is-recommendations">
          <span>{recsTitle}</span>
        </div>
        <ul className="compatibility-recommendation-list">
          {recsList.map((rec, idx) => {
            const isShown = idx < visibleRecsCount;
            return (
              <li
                key={rec}
                className={`landing-compat-row ${isShown ? 'is-printed' : 'is-pending-print'}`}
              >
                {rec}
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}

export default function LandingModalCompatTab({
  subScreenId,
  isEn,
  isCriticalPresented,
  compatibility,
  visibleMatchCount,
  visibleMissingCount,
  visibleCriticalCount,
  visibleRecsCount,
}: LandingModalCompatTabProps) {
  return (
    <div className="vacancy-compatibility-content">
      <div className="vacancy-compatibility">
        {renderMatchedGroup(compatibility, visibleMatchCount, subScreenId, isEn)}
        {renderMissingGroup(compatibility, visibleMissingCount, isEn)}

        {!isCriticalPresented ? (
          <div className="landing-compat-skeleton-bottom">
            <div className="landing-modal-skeleton-group">
              <SkeletonBar width={220} height={11} />
              <SkeletonBar width="92%" height={10} />
            </div>
            <div className="landing-modal-skeleton-group">
              <SkeletonBar width={250} height={11} />
              <SkeletonBar width="88%" height={10} />
              <SkeletonBar width="78%" height={10} />
            </div>
          </div>
        ) : (
          renderCriticalAndRecsGroups(compatibility, visibleCriticalCount, visibleRecsCount, isEn)
        )}
      </div>
    </div>
  );
}
