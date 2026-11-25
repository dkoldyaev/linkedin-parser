
import {
  SUB_SCREENS,
  SCREENS_BLOCKS,
  type LandingSubScreen,
  type LandingScreenBlock,
} from './landingConstants';
import TypewriterText from './TypewriterText';
import SkeletonBar from './SkeletonBar';

export interface LandingLeftNarrativeProps {
  currentScreen: number;
  activeSubIdx: number;
  currentSub: LandingSubScreen;
  isEn: boolean;
  onScrollToSubScreen: (subIdOrIdx: string | number) => void;
}

function resolveProgressStateClass(isActive: boolean, isDone: boolean): string {
  if (isActive) return 'is-active';
  if (isDone) return 'is-done';
  return '';
}

function resolveCaptionStateClass(isActive: boolean, isCompleted: boolean): string {
  if (isActive) return 'is-active';
  if (isCompleted) return 'is-completed';
  return 'is-skeleton';
}

function renderSubBulletButton(
  subId: string,
  activeSubIdx: number,
  isEn: boolean,
  onScrollToSubScreen: (subIdOrIdx: string | number) => void
) {
  const subIdx = SUB_SCREENS.findIndex((s) => s.id === subId);
  const sub = SUB_SCREENS[subIdx];
  const stateClass = resolveProgressStateClass(
    activeSubIdx === subIdx,
    activeSubIdx > subIdx
  );
  const label = `[${sub.indexLabel}] ${isEn ? sub.captionLabelEn : sub.captionLabel}`;

  return (
    <button
      key={subId}
      type="button"
      className={`landing-vnav-sub-bullet ${stateClass}`}
      onClick={() => onScrollToSubScreen(subIdx)}
      title={label}
      aria-label={label}
    >
      <span className="landing-vnav-dot" />
    </button>
  );
}

function renderVnavGroup(
  block: LandingScreenBlock,
  props: LandingLeftNarrativeProps
) {
  const { currentScreen, activeSubIdx, isEn, onScrollToSubScreen } = props;
  const screenStateClass = resolveProgressStateClass(
    currentScreen === block.screen,
    currentScreen > block.screen
  );
  const firstSubId = block.subIds[0];
  const title = isEn ? block.headerTitleEn : block.headerTitle;

  return (
    <div
      key={block.screen}
      className={`landing-vnav-group ${screenStateClass}`}
    >
      <button
        type="button"
        className={`landing-vnav-screen-bullet ${screenStateClass}`}
        onClick={() => onScrollToSubScreen(firstSubId)}
        title={title}
        aria-label={title}
      >
        <span className="landing-vnav-screen-num">{block.num}</span>
      </button>

      <div className="landing-vnav-sub-bullets">
        {block.subIds.map((subId) =>
          renderSubBulletButton(subId, activeSubIdx, isEn, onScrollToSubScreen)
        )}
      </div>
    </div>
  );
}

function renderCaptionItem(args: {
  sub: LandingSubScreen;
  subIdx: number;
  activeSubIdx: number;
  isEn: boolean;
  onScrollToSubScreen: (subIdOrIdx: string | number) => void;
}) {
  const { sub, subIdx, activeSubIdx, isEn, onScrollToSubScreen } = args;
  const isPresented = activeSubIdx >= subIdx;
  const isActive = activeSubIdx === subIdx;
  const isCompleted = activeSubIdx > subIdx;
  const stateClass = resolveCaptionStateClass(isActive, isCompleted);

  return (
    <div
      key={sub.id}
      role="button"
      tabIndex={0}
      onClick={() => onScrollToSubScreen(subIdx)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onScrollToSubScreen(subIdx);
        }
      }}
      className={`landing-caption-item ${stateClass}`}
    >
      <div className="landing-caption-meta">
        <span
          className="column-dot"
          style={{
            background: isPresented ? sub.dotColor : 'var(--border-strong)',
          }}
        />
        {isPresented ? (
          <span className="landing-caption-label">
            {isEn ? sub.captionLabelEn : sub.captionLabel}
          </span>
        ) : (
          <SkeletonBar width={160} height={10} />
        )}
      </div>

      {isPresented ? (
        <p className="landing-caption-text">
          <TypewriterText
            text={isEn ? sub.captionTextEn : sub.captionText}
            active={isActive}
            completed={isCompleted}
            speed={11}
          />
        </p>
      ) : (
        <div className="landing-caption-skeleton-lines" aria-hidden="true">
          <SkeletonBar width="92%" height={10} />
          <SkeletonBar width="68%" height={10} />
        </div>
      )}
    </div>
  );
}

function renderScreenBlockHeader(block: LandingScreenBlock, isEn: boolean) {
  return (
    <header className="column-header landing-block-header">
      <div className="column-title-group">
        <span className="column-index">{block.num}</span>
        <span className="column-dot" style={{ background: block.color }} />
        <span className="column-name">
          {isEn ? block.headerTitleEn : block.headerTitle}
        </span>
      </div>
      <span className="bp-col-tag">{isEn ? block.tagEn : block.tag}</span>
    </header>
  );
}

function renderScreenBlockHero(block: LandingScreenBlock, isEn: boolean) {
  return (
    <div className="landing-full-block-hero">
      <div className="landing-block-kicker">
        {isEn ? block.kickerEn : block.kicker}
      </div>
      <h1 className="landing-block-title">
        {isEn ? block.titleEn : block.title}
      </h1>
      <p className="landing-block-lead">
        {isEn ? block.leadEn : block.lead}
      </p>
    </div>
  );
}

function renderScreenBlockSection(
  block: LandingScreenBlock,
  props: LandingLeftNarrativeProps
) {
  const { activeSubIdx, currentSub, isEn, onScrollToSubScreen } = props;
  const blockSubItems = block.subIds.map((id) => {
    const subIdx = SUB_SCREENS.findIndex((s) => s.id === id);
    return { sub: SUB_SCREENS[subIdx], subIdx };
  });
  const activeStepBadge =
    currentSub.screen === block.screen ? currentSub.indexLabel : `${block.num}.1`;

  return (
    <section key={block.screen} className="landing-left-full-block">
      {renderScreenBlockHeader(block, isEn)}

      <div className="landing-full-block-body">
        {renderScreenBlockHero(block, isEn)}

        <div className="landing-block-captions">
          <div className="landing-block-captions-title">
            <span>
              {isEn
                ? 'WHAT IS HAPPENING ON THE RIGHT'
                : 'ЧТО ПРОИСХОДИТ НА ЭКРАНЕ СПРАВА'}
            </span>
            <span>[{activeStepBadge}]</span>
          </div>

          <div className="landing-captions-list">
            {blockSubItems.map(({ sub, subIdx }) =>
              renderCaptionItem({
                sub,
                subIdx,
                activeSubIdx,
                isEn,
                onScrollToSubScreen,
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function LandingLeftNarrative(props: LandingLeftNarrativeProps) {
  const { currentScreen, isEn } = props;

  return (
    <div className="landing-left-narrative">
      <div className="landing-left-sticky-viewport">
        <nav
          className="landing-vnav"
          aria-label={isEn ? 'Screen navigation' : 'Навигация по экранам'}
        >
          <div className="landing-vnav-track">
            {SCREENS_BLOCKS.map((block) => renderVnavGroup(block, props))}
          </div>
        </nav>

        <div className="landing-left-blocks-viewport">
          <div
            className="landing-left-blocks-reel"
            style={{
              transform: `translateY(-${(currentScreen - 1) * 100}%)`,
            }}
          >
            {SCREENS_BLOCKS.map((block) =>
              renderScreenBlockSection(block, props)
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
