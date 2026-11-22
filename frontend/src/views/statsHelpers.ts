export const HEATMAP_WEEKS = 26;
export const BAR_DAYS = 14;

export interface DailyStatsEntry {
  date?: string;
  marked?: number;
  added?: number;
}

export interface StatsApiData {
  total: number;
  marked_by_day?: Record<string, number>;
  added_by_day?: Record<string, number>;
  daily?: DailyStatsEntry[];
  by_status: Record<string, number>;
}

export interface HeatmapCell {
  key: string;
  date: Date;
  count: number;
  future: boolean;
}

export interface DayBarItem {
  key: string;
  date: Date;
  marked: number;
  added: number;
}

export interface StreaksInfo {
  current: number;
  best: number;
}

export interface StatsViewModel {
  today: Date;
  todayKey: string;
  streaks: StreaksInfo;
  weeks: HeatmapCell[][];
  max: number;
  bars: DayBarItem[];
  barMax: number;
  markedToday: number;
  addedToday: number;
  last7: number;
  last30: number;
  activeDays: number;
  statuses: Array<[string, number]>;
}

export function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseIso(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function computeCurrentStreak(activity: Record<string, number>, todayDate: Date): number {
  let cursor = activity[iso(todayDate)] ? todayDate : addDays(todayDate, -1);
  let current = 0;
  while (activity[iso(cursor)]) {
    current += 1;
    cursor = addDays(cursor, -1);
  }
  return current;
}

function computeBestStreak(activity: Record<string, number>): number {
  const days = Object.keys(activity)
    .filter((k) => activity[k] > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of days) {
    const date = parseIso(d);
    const isConsecutive = prev !== null && iso(addDays(prev, 1)) === d;
    run = isConsecutive ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}

export function computeStreaks(activity: Record<string, number>, todayDate: Date): StreaksInfo {
  return {
    current: computeCurrentStreak(activity, todayDate),
    best: computeBestStreak(activity),
  };
}

export function level(count: number, max: number): number {
  if (!count) return 0;
  const r = count / Math.max(max, 1);
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

function accumulateDailyEntry(
  item: DailyStatsEntry,
  marked: Record<string, number>,
  added: Record<string, number>
) {
  if (!item.date) return;
  marked[item.date] = (marked[item.date] || 0) + (item.marked || 0);
  added[item.date] = (added[item.date] || 0) + (item.added || 0);
}

function mergeDailyMapIntoTarget(
  source: Record<string, number>,
  target: Record<string, number>
) {
  for (const [k, v] of Object.entries(source)) {
    target[k] = (target[k] || 0) + v;
  }
}

function buildActivityMaps(data: StatsApiData) {
  const activity: Record<string, number> = {};
  const marked: Record<string, number> = { ...data.marked_by_day };
  const added: Record<string, number> = { ...data.added_by_day };

  if (Array.isArray(data.daily)) {
    for (const item of data.daily) {
      accumulateDailyEntry(item, marked, added);
    }
  }
  mergeDailyMapIntoTarget(marked, activity);
  mergeDailyMapIntoTarget(added, activity);

  return { activity, marked, added };
}

function buildSingleHeatmapWeek(
  weekStart: Date,
  today: Date,
  activity: Record<string, number>
): { col: HeatmapCell[]; nextStart: Date; weekMax: number } {
  const col: HeatmapCell[] = [];
  let cur = new Date(weekStart);
  let weekMax = 0;

  for (let d = 0; d < 7; d += 1) {
    const key = iso(cur);
    const count = activity[key] || 0;
    const isFuture = cur > today;
    if (!isFuture && count > weekMax) weekMax = count;
    col.push({ key, date: new Date(cur), count, future: isFuture });
    cur = addDays(cur, 1);
  }

  return { col, nextStart: cur, weekMax };
}

function buildHeatmapWeeks(today: Date, activity: Record<string, number>) {
  const todayDayOfWeek = (today.getDay() + 6) % 7;
  const endOfWeek = addDays(today, 6 - todayDayOfWeek);
  const start = addDays(endOfWeek, -(HEATMAP_WEEKS * 7 - 1));

  const weeks: HeatmapCell[][] = [];
  let cur = new Date(start);
  let max = 0;

  for (let w = 0; w < HEATMAP_WEEKS; w += 1) {
    const { col, nextStart, weekMax } = buildSingleHeatmapWeek(cur, today, activity);
    if (weekMax > max) max = weekMax;
    weeks.push(col);
    cur = nextStart;
  }

  return { weeks, max };
}

function buildDayBars(
  today: Date,
  marked: Record<string, number>,
  added: Record<string, number>
) {
  const bars: DayBarItem[] = [];
  let barMax = 0;
  for (let i = BAR_DAYS - 1; i >= 0; i -= 1) {
    const d = addDays(today, -i);
    const key = iso(d);
    const m = marked[key] || 0;
    const a = added[key] || 0;
    const total = m + a;
    if (total > barMax) barMax = total;
    bars.push({ key, date: d, marked: m, added: a });
  }
  return { bars, barMax: Math.max(barMax, 1) };
}

function sumLastDays(today: Date, activity: Record<string, number>, n: number): number {
  let s = 0;
  for (let i = 0; i < n; i += 1) {
    const key = iso(addDays(today, -i));
    s += activity[key] || 0;
  }
  return s;
}

export function buildStatsViewModel(data: StatsApiData | null): StatsViewModel | null {
  if (!data) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayKey = iso(today);

  const { activity, marked, added } = buildActivityMaps(data);
  const streaks = computeStreaks(activity, today);
  const { weeks, max } = buildHeatmapWeeks(today, activity);
  const { bars, barMax } = buildDayBars(today, marked, added);
  const statuses = Object.entries(data.by_status).sort((a, b) => b[1] - a[1]);

  return {
    today,
    todayKey,
    streaks,
    weeks,
    max,
    bars,
    barMax,
    markedToday: marked[todayKey] || 0,
    addedToday: added[todayKey] || 0,
    last7: sumLastDays(today, activity, 7),
    last30: sumLastDays(today, activity, 30),
    activeDays: Object.values(activity).filter((v) => v > 0).length,
    statuses,
  };
}
