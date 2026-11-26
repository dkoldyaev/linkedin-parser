import { ArrowRight, Search, UploadCloud } from 'lucide-react';
import type { ExtractedLinkPreset } from './landingPresets';
import { LINKEDIN_EXTRACTED_LINKS } from './landingConstants';
import SkeletonBar from './SkeletonBar';

export interface LandingLinkedInOverlayProps {
  subScreenId: string;
  importStage: number;
  isEn: boolean;
  links?: ExtractedLinkPreset[];
  roleLabel?: string;
}

function resolveRowStatusSymbol(isExtracted: boolean, isFlyingNow: boolean): string {
  if (isExtracted) return '✓';
  if (isFlyingNow) return '→';
  return '';
}

function renderLinkedInJobRow(
  item: ExtractedLinkPreset,
  idx: number,
  filledCount: number,
  flyingIdx: number | null,
) {
  const isExtracted = idx < filledCount;
  const isFlyingNow = idx === flyingIdx;

  return (
    <div
      key={item.id}
      className={`landing-li-job-row ${isFlyingNow ? 'is-flying-source' : ''} ${
        isExtracted ? 'is-extracted-source' : ''
      }`}
    >
      <div className="landing-li-job-avatar">{item.company[0]}</div>
      <div className="landing-li-job-info">
        <div className="landing-li-job-title">{item.title}</div>
        <div className="landing-li-job-meta">
          <span>{item.company}</span>
          <span>·</span>
          <span>{item.location}</span>
        </div>
        <div className="landing-li-job-url">{item.shortUrl}</div>
      </div>
      <span className="landing-li-row-status">
        {resolveRowStatusSymbol(isExtracted, isFlyingNow)}
      </span>
    </div>
  );
}

function renderLinkedInWindow(
  links: ExtractedLinkPreset[],
  roleLabel: string,
  filledCount: number,
  flyingIdx: number | null,
) {
  const activeJob = links[flyingIdx !== null ? flyingIdx : 2] || links[0];

  return (
    <div className="landing-li-window">
      <div className="landing-li-navbar">
        <div className="landing-li-nav-left">
          <span className="landing-li-logo">in</span>
          <div className="landing-li-searchbox">
            <Search size={10} />
            <span>{roleLabel}</span>
          </div>
        </div>
        <div className="landing-li-nav-icons">
          <span className="li-nav-dot" />
          <span className="li-nav-dot" />
          <span className="li-nav-jobs-active">Jobs</span>
          <span className="li-nav-dot" />
        </div>
      </div>

      <div className="landing-li-filters">
        <span className="li-filter-pill is-green">Jobs</span>
        <span className="li-filter-pill">Easy Apply</span>
        <span className="li-filter-pill">Remote</span>
      </div>

      <div className="landing-li-split">
        <div className="landing-li-list">
          {links.map((item, idx) => renderLinkedInJobRow(item, idx, filledCount, flyingIdx))}
        </div>

        <div className="landing-li-detail-pane">
          <div className="li-detail-company-row">
            <span className="li-detail-avatar">{activeJob.company[0]}</span>
            <span className="li-detail-company-name">{activeJob.company}</span>
          </div>
          <div className="li-detail-title">{activeJob.title}</div>
          <div className="li-detail-location">{activeJob.location}</div>

          <div className="li-detail-actions">
            <span className="li-btn-apply">in Apply</span>
            <span className="li-btn-save">Save</span>
          </div>

          <div className="li-detail-skeleton">
            <SkeletonBar width="92%" height={7} />
            <SkeletonBar width="84%" height={7} />
            <SkeletonBar width="88%" height={7} />
            <SkeletonBar width="60%" height={7} />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderFlightBridge(links: ExtractedLinkPreset[], flyingIdx: number | null) {
  return (
    <div className="landing-li-flight-bridge">
      <svg
        className="landing-li-bridge-svg"
        viewBox="0 0 110 180"
        fill="none"
        preserveAspectRatio="none"
      >
        <path
          d="M 4 46 C 48 46, 62 78, 106 82"
          className={`landing-li-path ${flyingIdx === 0 ? 'is-active-path' : ''}`}
        />
        <path
          d="M 4 98 C 48 98, 62 96, 106 96"
          className={`landing-li-path ${flyingIdx === 1 ? 'is-active-path' : ''}`}
        />
        <path
          d="M 4 150 C 48 150, 62 114, 106 110"
          className={`landing-li-path ${flyingIdx === 2 ? 'is-active-path' : ''}`}
        />
      </svg>

      {flyingIdx !== null && (
        <div key={flyingIdx} className={`landing-flying-single-pill from-row-${flyingIdx}`}>
          <span className="flying-pill-url">{links[flyingIdx]?.shortUrl || ''}</span>
          <ArrowRight size={10} />
        </div>
      )}
    </div>
  );
}

function renderBatchImportTextareaContent(
  links: ExtractedLinkPreset[],
  filledCount: number,
  isButtonLit: boolean,
) {
  if (filledCount === 0) {
    return (
      <span className="landing-textarea-placeholder">https://www.linkedin.com/jobs/view/...</span>
    );
  }
  return links.slice(0, filledCount).map((item, idx) => (
    <div
      key={item.id}
      className={`landing-textarea-url-line ${
        idx === filledCount - 1 && !isButtonLit ? 'is-just-landed' : ''
      }`}
    >
      {item.url}
    </div>
  ));
}

function renderBatchImportModalFooter(isEn: boolean, isButtonLit: boolean, filledCount: number) {
  const countSuffix = filledCount > 0 ? ` (${filledCount})` : '';
  return (
    <div className="modal-footer landing-batch-footer">
      <span className="btn btn-secondary landing-batch-cancel-btn">
        {isEn ? 'Cancel' : 'Отмена'}
      </span>
      <span
        className={`btn btn-primary landing-batch-submit-btn ${
          isButtonLit ? 'is-lit' : 'is-waiting'
        }`}
      >
        <UploadCloud size={13} />
        <span>
          {isEn ? 'Import' : 'Импортировать'}
          {countSuffix}
        </span>
      </span>
    </div>
  );
}

function renderBatchImportModal(
  links: ExtractedLinkPreset[],
  filledCount: number,
  isButtonLit: boolean,
  isEn: boolean,
) {
  const headerText = isEn ? 'Batch Import Vacancies' : 'Пакетный импорт вакансий';
  const labelText = isEn
    ? 'Job links (one per line)'
    : 'Ссылки на вакансии (каждая с новой строки)';

  return (
    <div className="modal-content batch-import-modal landing-batch-modal">
      <div className="modal-header landing-batch-header">
        <div className="modal-title landing-batch-title">
          <UploadCloud size={15} color="#2563eb" />
          <span>{headerText}</span>
        </div>
      </div>

      <div className="modal-body landing-batch-body">
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div className="landing-batch-label-row">
            <span className="form-label" style={{ marginBottom: 0 }}>
              {labelText}
            </span>
            <span className="landing-batch-counter">[{filledCount} / 3]</span>
          </div>

          <div
            className={`form-textarea landing-batch-textarea ${filledCount > 0 ? 'has-urls' : ''}`}
          >
            {renderBatchImportTextareaContent(links, filledCount, isButtonLit)}
            {!isButtonLit && (
              <span className="tw-cursor" aria-hidden="true">
                ▋
              </span>
            )}
          </div>
        </div>

        <div className="landing-batch-tags-row">
          <span className="form-label" style={{ marginBottom: 4 }}>
            {isEn ? 'Default tags' : 'Метки по умолчанию'}
          </span>
          <SkeletonBar width="100%" height={24} />
        </div>
      </div>

      {renderBatchImportModalFooter(isEn, isButtonLit, filledCount)}
    </div>
  );
}

function resolveImportOverlayState(subScreenId: string, importStage: number) {
  const isDocked = subScreenId === '1.2';
  const isVisible = subScreenId === '1.1' || isDocked;
  const effectiveStage = isDocked ? 4 : importStage;
  return {
    isVisible,
    isDocked,
    filledCount: Math.min(3, effectiveStage),
    flyingIdx: effectiveStage < 3 ? effectiveStage : null,
    isButtonLit: effectiveStage >= 4,
  };
}

export default function LandingLinkedInOverlay({
  subScreenId,
  importStage,
  isEn,
  links = LINKEDIN_EXTRACTED_LINKS,
  roleLabel = 'Backend Engineer',
}: LandingLinkedInOverlayProps) {
  const state = resolveImportOverlayState(subScreenId, importStage);
  if (!state.isVisible) return null;

  return (
    <div
      className={`landing-li-scene ${state.isDocked ? 'is-docked' : 'is-active'}`}
      aria-hidden="true"
    >
      {renderLinkedInWindow(links, roleLabel, state.filledCount, state.flyingIdx)}
      {renderFlightBridge(links, state.flyingIdx)}
      {renderBatchImportModal(links, state.filledCount, state.isButtonLit, isEn)}
    </div>
  );
}
