import {
  STATUS_CONTACTED,
  STATUS_INTERVIEW,
  STATUS_NOT_CONTACTED,
  STATUS_OFFER,
} from '../constants/columns';
import type { LandingVacancyPreset } from './landingPresets';
import { resolveRolePreset } from './landingPresets';

export interface LandingBoardColumn {
  id: string;
  labelEn: string;
  index: string;
  color: string;
}

export const BOARD_COLUMNS: LandingBoardColumn[] = [
  { id: STATUS_NOT_CONTACTED, labelEn: 'Not Contacted', index: '01', color: '#2563eb' },
  { id: STATUS_CONTACTED, labelEn: 'Contacted', index: '02', color: '#0284c7' },
  { id: STATUS_INTERVIEW, labelEn: 'Interview', index: '03', color: '#d97706' },
  { id: STATUS_OFFER, labelEn: 'Offer', index: '04', color: '#059669' },
];

export const DEFAULT_BACKEND_PRESET = resolveRolePreset('backend');
export const LINKEDIN_EXTRACTED_LINKS = DEFAULT_BACKEND_PRESET.extractedLinks;
export const LINKEDIN_CORPORATE_BLOAT = DEFAULT_BACKEND_PRESET.bloatItems;
export const COMPATIBILITY_DATA = DEFAULT_BACKEND_PRESET.compatibility;

export interface FunnelCardStagePosition {
  status: string;
  lane: number | null;
  historyCount: number;
}

export const FUNNEL_STEP_POSITIONS: Array<Record<number, FunnelCardStagePosition>> = [
  {
    101: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
    102: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
    103: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
  },
  {
    101: { status: STATUS_CONTACTED, lane: null, historyCount: 1 },
    102: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
    103: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
  },
  {
    101: { status: STATUS_INTERVIEW, lane: 1, historyCount: 2 },
    102: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
    103: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
  },
  {
    101: { status: STATUS_INTERVIEW, lane: 1, historyCount: 2 },
    102: { status: STATUS_CONTACTED, lane: null, historyCount: 1 },
    103: { status: STATUS_NOT_CONTACTED, lane: null, historyCount: 0 },
  },
  {
    101: { status: STATUS_INTERVIEW, lane: 1, historyCount: 2 },
    102: { status: STATUS_CONTACTED, lane: null, historyCount: 1 },
    103: { status: STATUS_CONTACTED, lane: null, historyCount: 1 },
  },
  {
    101: { status: STATUS_INTERVIEW, lane: 1, historyCount: 2 },
    102: { status: STATUS_CONTACTED, lane: null, historyCount: 1 },
    103: { status: STATUS_INTERVIEW, lane: 0, historyCount: 2 },
  },
  {
    101: { status: STATUS_INTERVIEW, lane: 1, historyCount: 2 },
    102: { status: STATUS_CONTACTED, lane: null, historyCount: 1 },
    103: { status: STATUS_OFFER, lane: null, historyCount: 3 },
  },
];

export interface LandingSubScreen {
  id: string;
  screen: number;
  indexLabel: string;
  dotColor: string;
  captionLabel: string;
  captionLabelEn: string;
  captionText: string;
  captionTextEn: string;
}

export const SUB_SCREENS: LandingSubScreen[] = [
  {
    id: '1.1',
    screen: 1,
    indexLabel: '01.1',
    dotColor: '#2563eb',
    captionLabel: 'ШАГ 01 · ССЫЛКИ УЛЕТАЮТ В ОКНО ИМПОРТА',
    captionLabelEn: 'STEP 01 · LINKS FLY INTO BATCH IMPORT',
    captionText:
      'По мере прокрутки ссылки со страницы поиска LinkedIn по одной перелетают в окно «Пакетный импорт вакансий», заполняют поле ввода, и кнопка «Импортировать» загорается.',
    captionTextEn:
      'As you scroll, job links from LinkedIn fly one by one into the Batch Import window, populate the textarea, and light up the Import button.',
  },
  {
    id: '1.2',
    screen: 1,
    indexLabel: '01.2',
    dotColor: '#0284c7',
    captionLabel: 'ШАГ 02 · КАРТОЧКИ ПОЯВЛЯЮТСЯ НА ДОСКЕ',
    captionLabelEn: 'STEP 02 · CARDS APPEAR ON THE BOARD',
    captionText: `После отправки списка ссылок в первой колонке «${STATUS_NOT_CONTACTED}» появляются готовые карточки с названием роли, компанией и источником.`,
    captionTextEn:
      'Once imported, structured vacancy cards appear in the first column with role title, company, and source link.',
  },
  {
    id: '1.3',
    screen: 1,
    indexLabel: '01.3',
    dotColor: '#059669',
    captionLabel: 'ШАГ 03 · ДВИЖЕНИЕ ПО ВОРОНКЕ ВПРАВО',
    captionLabelEn: 'STEP 03 · MOVING RIGHT ACROSS THE FUNNEL',
    captionText:
      'По мере прохождения отборов карточки двигаются вправо по колонкам: от первого контакта через этапы собеседований к офферу.',
    captionTextEn:
      'As you progress through interviews, cards move right across columns: from initial outreach through interview stages to an offer.',
  },
  {
    id: '2.1',
    screen: 2,
    indexLabel: '02.1',
    dotColor: '#10b981',
    captionLabel: 'ШАГ 01 · ВВОД И ПЕРЕСЧЕТ ЗП В МЕСЯЦ',
    captionLabelEn: 'STEP 01 · SALARY AUTOFILL & MONTHLY CONVERSION',
    captionText:
      'Годовая вилка из описания ($144k–$168k в год) сама вводится в карточку и автоматически приводится к единому формату: $12,000 – $14,000 / мес.',
    captionTextEn:
      'Annual compensation ($144k–$168k/yr) is extracted into the card and automatically normalized to a monthly rate: $12,000 – $14,000/mo.',
  },
  {
    id: '2.2',
    screen: 2,
    indexLabel: '02.2',
    dotColor: '#f59e0b',
    captionLabel: 'ШАГ 02 · БОЛЬШОЕ МУТНОЕ ОПИСАНИЕ ИЗ LINKEDIN',
    captionLabelEn: 'STEP 02 · BLOATED LINKEDIN JOB DESCRIPTION',
    captionText:
      'Исходная вакансия забита четырьмя экранами корпоративных штампов про «единорога», «семейную атмосферу», «10x рок-звезд» и «печеньки», где суть работы спрятана на самом дне.',
    captionTextEn:
      'The raw job post is packed with paragraphs of corporate clichés about "unicorns", "fast-paced family", and "10x rockstar ninjas", burying the actual engineering work at the very bottom.',
  },
  {
    id: '2.3',
    screen: 2,
    indexLabel: '02.3',
    dotColor: '#2563eb',
    captionLabel: 'ШАГ 03 · СХЛОПЫВАНИЕ ВОДЫ ДО 2 ПРЕДЛОЖЕНИЙ',
    captionLabelEn: 'STEP 03 · COLLAPSING FLUFF TO 2 SENTENCES',
    captionText:
      'Вся корпоративная вода схлопывается на 94% — остаются только 2 конкретных предложения о инженерных задачах, нагрузке и чистый стек технологий.',
    captionTextEn:
      'All corporate fluff collapses by 94% — leaving just 2 concise sentences on core engineering scope, system load, and a clean tech stack.',
  },
  {
    id: '3.1',
    screen: 3,
    indexLabel: '03.1',
    dotColor: '#10b981',
    captionLabel: 'ШАГ 01 · MATCH И MISSING ПО РЕЗЮМЕ',
    captionLabelEn: 'STEP 01 · CV MATCH & MISSING SKILLS',
    captionText:
      'На вкладке «Совместимость с CV» печатаются подтвержденные навыки с цитатами из вашего резюме (Match) и технологии, которых в CV не нашлось (Missing).',
    captionTextEn:
      'The CV Compatibility tab prints matched requirements backed by quotes from your resume (Match) and skills not found in your CV (Missing).',
  },
  {
    id: '3.2',
    screen: 3,
    indexLabel: '03.2',
    dotColor: '#ef4444',
    captionLabel: 'ШАГ 02 · CRITICAL И РЕКОМЕНДАЦИИ',
    captionLabelEn: 'STEP 02 · CRITICAL GAPS & RECOMMENDATIONS',
    captionText:
      'Следом печатаются стоп-факторы по локации или формату (Critical) и готовый список правок (Recommendations): что именно добавить в CV перед откликом.',
    captionTextEn:
      'Next, it prints location or work-format dealbreakers (Critical) and actionable edits (Recommendations) to tailor your CV before applying.',
  },
];

export interface LandingScreenBlock {
  screen: number;
  num: string;
  color: string;
  headerTitle: string;
  headerTitleEn: string;
  tag: string;
  tagEn: string;
  kicker: string;
  kickerEn: string;
  title: string;
  titleEn: string;
  lead: string;
  leadEn: string;
  subIds: string[];
}

export const SCREENS_BLOCKS: LandingScreenBlock[] = [
  {
    screen: 1,
    num: '01',
    color: '#2563eb',
    headerTitle: 'ЭКРАН 01 · ДОБАВЛЕНИЕ ССЫЛОК НА ДОСКУ',
    headerTitleEn: 'SCREEN 01 · ADDING LINKS TO THE BOARD',
    tag: 'LINKEDIN → КАНБАН',
    tagEn: 'LINKEDIN → KANBAN',
    kicker: 'ЭКРАН 01 / 03 · ИМПОРТ И ВОРОНКА',
    kickerEn: 'SCREEN 01 / 03 · IMPORT & FUNNEL',
    title: 'Добавляйте ссылки пачкой и ведите вакансии по доске',
    titleEn: 'Batch-import LinkedIn links and track roles across the board',
    lead: 'Забудьте про ручное копирование вакансий в таблицы. Забирайте ссылки прямо со страницы поиска LinkedIn в окно пакетного импорта и двигайте карточки по этапам до оффера.',
    leadEn:
      'Stop copying job posts into spreadsheets by hand. Grab links straight from LinkedIn search into Batch Import and move cards across stages all the way to an offer.',
    subIds: ['1.1', '1.2', '1.3'],
  },
  {
    screen: 2,
    num: '02',
    color: '#10b981',
    headerTitle: 'ЭКРАН 02 · АВТОЗАПОЛНЕНИЕ КАРТОЧКИ',
    headerTitleEn: 'SCREEN 02 · SMART CARD AUTOFILL',
    tag: 'ЗП & AI-САММАРИ',
    tagEn: 'SALARY & AI SUMMARY',
    kicker: 'ЭКРАН 02 / 03 · РАЗБОР ВАКАНСИИ',
    kickerEn: 'SCREEN 02 / 03 · VACANCY BREAKDOWN',
    title: 'Карточка сама считает зарплату и убирает воду из описания',
    titleEn: 'Normalizes salary to monthly and strips fluff from descriptions',
    lead: 'Годовые и почасовые вилки приводятся к сумме за месяц, а четыре экрана корпоративных штампов сжимаются до двух конкретных предложений.',
    leadEn:
      'Annual and hourly ranges are converted into monthly pay, while four screens of corporate buzzwords collapse into two clear sentences.',
    subIds: ['2.1', '2.2', '2.3'],
  },
  {
    screen: 3,
    num: '03',
    color: '#d97706',
    headerTitle: 'ЭКРАН 03 · ОЦЕНКА СОВМЕСТИМОСТИ С CV',
    headerTitleEn: 'SCREEN 03 · CV COMPATIBILITY CHECK',
    tag: 'АНАЛИЗ РЕЗЮМЕ',
    tagEn: 'RESUME MATCH',
    kicker: 'ЭКРАН 03 / 03 · ПРОВЕРКА ПЕРЕД ОТКЛИКОМ',
    kickerEn: 'SCREEN 03 / 03 · PRE-APPLY CHECK',
    title: 'Точная сверка вакансии с вашим резюме по 4 блокам',
    titleEn: 'Instant 4-part compatibility check against your CV',
    lead: 'Перед откликом проверьте реальные шансы: какие требования подтверждены цитатами из вашего CV, чего не хватает и что поправить.',
    leadEn:
      'Check your real odds before applying: see which requirements are backed by quotes from your CV, what is missing, and what to tweak.',
    subIds: ['3.1', '3.2'],
  },
];

export const SUB_SCROLL_TARGETS = [0, 1.5, 2.05, 3.7, 4.5, 5.3, 6.1, 6.85];

const SUB_SCREEN_RATIO_THRESHOLDS = [1.35, 1.95, 3.55, 4.35, 5.15, 5.95, 6.65];

export function getSubScreenIdxFromRatio(r: number): number {
  const idx = SUB_SCREEN_RATIO_THRESHOLDS.findIndex((threshold) => r < threshold);
  return idx === -1 ? 7 : idx;
}

const IMPORT_STAGE_THRESHOLDS = [0.25, 0.52, 0.8, 1.05];

export function getImportStageFromRatio(r: number): number {
  const idx = IMPORT_STAGE_THRESHOLDS.findIndex((threshold) => r < threshold);
  return idx === -1 ? 4 : idx;
}

const FUNNEL_STAGE_THRESHOLDS = [1.95, 2.21, 2.47, 2.73, 2.99, 3.25];

export function getFunnelStageFromRatio(r: number): number {
  const idx = FUNNEL_STAGE_THRESHOLDS.findIndex((threshold) => r < threshold);
  return idx === -1 ? 6 : idx;
}

export interface ComputedLandingBoardVacancy extends LandingVacancyPreset {
  history_count: number;
  currentStatus: string;
  currentLane: number | null;
  justArrived: boolean;
  justMoved: boolean;
  justMovedBack: boolean;
}

function resolveEffectiveFunnelStages(
  currentSub: LandingSubScreen,
  funnelStage: number,
  prevFunnelStage: number,
) {
  if (currentSub.id === '1.2') {
    return { effectiveStage: 0, prevEffectiveStage: prevFunnelStage };
  }
  if (currentSub.screen === 1) {
    return { effectiveStage: funnelStage, prevEffectiveStage: prevFunnelStage };
  }
  return { effectiveStage: 6, prevEffectiveStage: 6 };
}

function resolvePositionEntry(
  map: Record<number, FunnelCardStagePosition>,
  primaryId: number,
  fallbackId: number,
): FunnelCardStagePosition | undefined {
  return map[primaryId] || map[fallbackId];
}

function mapDemoVacancyToBoardState(
  v: LandingVacancyPreset,
  vIdx: number,
  ctx: {
    currentMap: Record<number, FunnelCardStagePosition>;
    prevMap: Record<number, FunnelCardStagePosition>;
    stageChanged: boolean;
    arrivedFromImport: boolean;
  },
): ComputedLandingBoardVacancy | null {
  const fallbackId = 101 + vIdx;
  const demoId = v.id || fallbackId;
  const stagePos = resolvePositionEntry(ctx.currentMap, demoId, fallbackId);
  if (!stagePos) return null;

  const prevPos = resolvePositionEntry(ctx.prevMap, demoId, fallbackId);
  const curColIdx = BOARD_COLUMNS.findIndex((c) => c.id === stagePos.status);
  const prevColIdx = prevPos ? BOARD_COLUMNS.findIndex((c) => c.id === prevPos.status) : curColIdx;

  return {
    ...v,
    history_count: stagePos.historyCount,
    currentStatus: stagePos.status,
    currentLane: stagePos.lane,
    justArrived: ctx.arrivedFromImport,
    justMoved: ctx.stageChanged && curColIdx > prevColIdx,
    justMovedBack: ctx.stageChanged && curColIdx < prevColIdx,
  };
}

export function computeLandingBoardVacancies(args: {
  currentSub: LandingSubScreen;
  funnelStage: number;
  prevFunnelStage: number;
  isReverse: boolean;
  demoVacancies: LandingVacancyPreset[];
}): ComputedLandingBoardVacancy[] {
  if (args.currentSub.id === '1.1') return [];
  const { effectiveStage, prevEffectiveStage } = resolveEffectiveFunnelStages(
    args.currentSub,
    args.funnelStage,
    args.prevFunnelStage,
  );

  const currentMap = FUNNEL_STEP_POSITIONS[effectiveStage] || FUNNEL_STEP_POSITIONS[6];
  const prevMap = FUNNEL_STEP_POSITIONS[prevEffectiveStage] || FUNNEL_STEP_POSITIONS[0];
  const stageChanged = effectiveStage !== prevEffectiveStage;
  const arrivedFromImport =
    args.currentSub.id === '1.2' && !args.isReverse && args.prevFunnelStage === 0;

  return args.demoVacancies
    .map((v, vIdx) =>
      mapDemoVacancyToBoardState(v, vIdx, {
        currentMap,
        prevMap,
        stageChanged,
        arrivedFromImport,
      }),
    )
    .filter((item): item is ComputedLandingBoardVacancy => item !== null);
}
