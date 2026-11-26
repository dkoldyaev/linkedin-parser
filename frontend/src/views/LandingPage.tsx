import './LandingPage.css';
import {
  BOARD_COLUMNS,
  type ComputedLandingBoardVacancy,
  computeLandingBoardVacancies,
  type LandingBoardColumn,
  SUB_SCREENS,
} from './landingConstants';
import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Inbox } from 'lucide-react';
import LandingKanbanCard from './LandingKanbanCard';
import LandingLeftNarrative from './LandingLeftNarrative';
import LandingLinkedInOverlay from './LandingLinkedInOverlay';
import LandingScrollHintBar from './LandingScrollHintBar';
import LandingVacancyModal from './LandingVacancyModal';
import { resolveRolePreset } from './landingPresets';
import SkeletonBar from './SkeletonBar';
import { useLandingScrollController } from './useLandingScrollController';
import { useTranslation } from '../i18n/I18nContext';

export interface LandingPageProps {
  onFinish?: () => void;
}

function renderFilterSkeletonBar() {
  return (
    <div className="filter-bar landing-filter-bar landing-filter-skeleton">
      <div className="landing-filter-skel-group">
        <SkeletonBar width={96} height={18} />
        <SkeletonBar width={112} height={18} />
        <SkeletonBar width={84} height={18} />
      </div>
      <div className="filter-divider" />
      <div className="landing-filter-skel-group">
        <SkeletonBar width={48} height={16} className="is-pill" />
        <SkeletonBar width={58} height={16} className="is-pill" />
        <SkeletonBar width={52} height={16} className="is-pill" />
      </div>
    </div>
  );
}

function renderLandingBoardColumn(
  col: LandingBoardColumn,
  boardVacancies: ComputedLandingBoardVacancy[],
  flags: {
    isModalVisible: boolean;
    showCardSalary: boolean;
    showCardSummary: boolean;
    showCardMatch: boolean;
    isEn: boolean;
  },
  t: (key: string, params?: Record<string, string | number>) => string,
) {
  const colCards = boardVacancies.filter((v) => v.currentStatus === col.id);

  return (
    <div key={col.id} className="kanban-column landing-kanban-column">
      <div className="column-header">
        <div className="column-title-group">
          <span className="column-index">{col.index}</span>
          <span className="column-dot" style={{ background: col.color }} />
          <span className="column-name">{flags.isEn ? col.labelEn : col.id}</span>
          <span className="column-badge">[{colCards.length}]</span>
        </div>
      </div>

      <div className="column-cards landing-column-cards">
        {colCards.map((vacancy) => (
          <LandingKanbanCard
            key={vacancy.id}
            vacancy={vacancy}
            status={vacancy.currentStatus}
            lane={vacancy.currentLane}
            justArrived={vacancy.justArrived}
            justMoved={vacancy.justMoved}
            justMovedBack={vacancy.justMovedBack}
            isSelected={vacancy.id === 101 && flags.isModalVisible}
            showSalary={flags.showCardSalary}
            showSummary={flags.showCardSummary}
            showMatch={flags.showCardMatch}
            isEn={flags.isEn}
            t={t}
          />
        ))}

        {colCards.length === 0 && (
          <div className="empty-column landing-empty-column">
            <Inbox className="empty-column-icon" size={16} aria-hidden="true" />
            <span className="empty-column-title">
              {flags.isEn ? 'No cards yet' : 'Пока нет карточек'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function renderStageCanvas(args: {
  subScreenId: string;
  activeSubIdx: number;
  importStage: number;
  funnelStage: number;
  isReverse: boolean;
  isEn: boolean;
  isModalVisible: boolean;
  activePreset: ReturnType<typeof resolveRolePreset>;
  boardVacancies: ComputedLandingBoardVacancy[];
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const columnFlags = {
    isModalVisible: args.isModalVisible,
    showCardSalary: args.activeSubIdx >= 3,
    showCardSummary: args.activeSubIdx >= 5,
    showCardMatch: args.activeSubIdx >= 6,
    isEn: args.isEn,
  };

  return (
    <div className="landing-stage-canvas">
      <LandingLinkedInOverlay
        subScreenId={args.subScreenId}
        importStage={args.importStage}
        isEn={args.isEn}
        links={args.activePreset.extractedLinks}
        roleLabel={args.isEn ? args.activePreset.labelEn : args.activePreset.label}
      />

      <div className="kanban-board landing-kanban-board">
        {BOARD_COLUMNS.map((col) =>
          renderLandingBoardColumn(col, args.boardVacancies, columnFlags, args.t),
        )}
      </div>

      {args.isModalVisible && (
        <LandingVacancyModal
          vacancy={args.activePreset.vacancies[0]}
          subScreenId={args.subScreenId}
          isReverse={args.isReverse}
          isEn={args.isEn}
          t={args.t}
          bloatItems={args.activePreset.bloatItems}
          compatibility={args.activePreset.compatibility}
        />
      )}

      <LandingScrollHintBar
        activeSubIdx={args.activeSubIdx}
        importStage={args.importStage}
        funnelStage={args.funnelStage}
        isEn={args.isEn}
      />
    </div>
  );
}

export default function LandingPage({ onFinish }: LandingPageProps) {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEn = locale === 'en';

  const roleParam = searchParams.get('role');
  const activePreset = resolveRolePreset(roleParam);

  const finishToBoard = useCallback(() => {
    try {
      sessionStorage.setItem('highlight_add_vacancy', 'true');
    } catch {
      /* ignore */
    }
    onFinish?.();
    navigate('/', { replace: true });
  }, [navigate, onFinish]);

  const { pageRef, scrollState, scrollToSubScreen } = useLandingScrollController(finishToBoard);

  const activeSubIdx = scrollState.idx;
  const isReverse = scrollState.idx < scrollState.prevIdx;
  const currentSub = SUB_SCREENS[activeSubIdx] || SUB_SCREENS[0];
  const currentScreen = currentSub.screen;

  const boardVacancies = useMemo(
    () =>
      computeLandingBoardVacancies({
        currentSub,
        funnelStage: scrollState.funnelStage,
        prevFunnelStage: scrollState.prevFunnelStage,
        isReverse,
        demoVacancies: activePreset.vacancies,
      }),
    [
      currentSub,
      scrollState.funnelStage,
      scrollState.prevFunnelStage,
      isReverse,
      activePreset.vacancies,
    ],
  );

  return (
    <main ref={pageRef} className="landing-page bp-page">
      <div className="bp-container">
        <div className="landing-split-layout">
          <LandingLeftNarrative
            currentScreen={currentScreen}
            activeSubIdx={activeSubIdx}
            currentSub={currentSub}
            isEn={isEn}
            onScrollToSubScreen={scrollToSubScreen}
          />

          <div className="landing-right-preview-col">
            <div className="landing-sticky-stage">
              <div className="landing-stage-frame">
                {renderFilterSkeletonBar()}
                {renderStageCanvas({
                  subScreenId: currentSub.id,
                  activeSubIdx,
                  importStage: scrollState.importStage,
                  funnelStage: scrollState.funnelStage,
                  isReverse,
                  isEn,
                  isModalVisible: currentScreen === 2 || currentScreen === 3,
                  activePreset,
                  boardVacancies,
                  t,
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
