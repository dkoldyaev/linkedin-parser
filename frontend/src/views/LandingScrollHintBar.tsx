import { ChevronDown } from 'lucide-react';
import { SUB_SCREENS } from './landingConstants';

export interface LandingScrollHintBarProps {
  activeSubIdx: number;
  importStage: number;
  funnelStage: number;
  isEn: boolean;
}

function formatImportHint(importStage: number, isEn: boolean): string {
  const count = Math.min(3, importStage);
  return isEn
    ? `Transferring links from LinkedIn (${count} / 3)`
    : `Перенос ссылок с LinkedIn (${count} / 3)`;
}

function formatFunnelHint(funnelStage: number, isEn: boolean): string {
  return isEn
    ? `Moving cards across columns (${funnelStage} / 6)`
    : `Перемещение карточек по колонкам (${funnelStage} / 6)`;
}

function formatNextStepHint(activeSubIdx: number, isEn: boolean): string {
  const nextSub = SUB_SCREENS[activeSubIdx + 1];
  if (!nextSub) return '';
  const nextLabel = isEn ? nextSub.captionLabelEn : nextSub.captionLabel;
  return isEn
    ? `Next step: [${nextSub.indexLabel}] ${nextLabel}`
    : `Следующий шаг: [${nextSub.indexLabel}] ${nextLabel}`;
}

function resolveIntermediateHintSubtitle(
  activeSubIdx: number,
  importStage: number,
  funnelStage: number,
  isEn: boolean,
): string {
  if (activeSubIdx === 0 && importStage < 4) {
    return formatImportHint(importStage, isEn);
  }
  if (activeSubIdx === 2 && funnelStage < 6) {
    return formatFunnelHint(funnelStage, isEn);
  }
  return formatNextStepHint(activeSubIdx, isEn);
}

export default function LandingScrollHintBar({
  activeSubIdx,
  importStage,
  funnelStage,
  isEn,
}: LandingScrollHintBarProps) {
  const isFinalStep = activeSubIdx >= SUB_SCREENS.length - 1;
  const isInitialPulse = activeSubIdx === 0 && importStage === 0;

  if (isFinalStep) {
    return (
      <div className="landing-scroll-hint-bar landing-stage-center-scroll">
        <div className="landing-scroll-hint-btn is-final-step">
          <div className="landing-scroll-hint-left">
            <span className="landing-scroll-mouse" aria-hidden="true">
              <span className="landing-scroll-mouse-wheel" />
            </span>
            <div className="landing-scroll-hint-copy">
              <span className="landing-scroll-hint-title">
                {isEn ? 'SCROLL DOWN · OPEN BOARD' : 'SCROLL DOWN · ПЕРЕХОД К ДОСКЕ'}
              </span>
              <span className="landing-scroll-hint-sub">
                {isEn
                  ? 'Scroll down to enter your Kanban workspace'
                  : 'Крутите вниз для бесшовного перехода к рабочей доске'}
              </span>
            </div>
          </div>
          <div className="landing-scroll-hint-right">
            <span className="landing-scroll-step-badge">
              {SUB_SCREENS.length}/{SUB_SCREENS.length}
            </span>
            <span className="landing-scroll-chevrons" aria-hidden="true">
              <ChevronDown size={13} />
              <ChevronDown size={13} />
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-scroll-hint-bar landing-stage-center-scroll">
      <div className={`landing-scroll-hint-btn ${isInitialPulse ? 'is-initial-pulse' : ''}`}>
        <div className="landing-scroll-hint-left">
          <span className="landing-scroll-mouse" aria-hidden="true">
            <span className="landing-scroll-mouse-wheel" />
          </span>
          <div className="landing-scroll-hint-copy">
            <span className="landing-scroll-hint-title">
              {isEn ? 'SCROLL DOWN · CONTINUE' : 'SCROLL DOWN · КРУТИТЕ ВНИЗ'}
            </span>
            <span className="landing-scroll-hint-sub">
              {resolveIntermediateHintSubtitle(activeSubIdx, importStage, funnelStage, isEn)}
            </span>
          </div>
        </div>

        <div className="landing-scroll-hint-right">
          <span className="landing-scroll-step-badge">
            {activeSubIdx + 1}/{SUB_SCREENS.length}
          </span>
          <span className="landing-scroll-chevrons" aria-hidden="true">
            <ChevronDown size={13} />
            <ChevronDown size={13} />
          </span>
        </div>
      </div>
    </div>
  );
}
