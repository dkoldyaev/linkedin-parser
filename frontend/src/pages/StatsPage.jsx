import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, CalendarCheck, PlusCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useBlueprintGrid } from '../utils/useBlueprintGrid';
import { useGridScroll } from '../utils/useGridScroll';

const HEATMAP_WEEKS = 26;
const BAR_DAYS = 14;

const iso = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseIso = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const addDays = (d, n) => {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
};

function computeStreaks(activity, todayDate) {
  let cursor = activity[iso(todayDate)] ? todayDate : addDays(todayDate, -1);
  let current = 0;
  while (activity[iso(cursor)]) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  const days = Object.keys(activity).filter((k) => activity[k] > 0).sort();
  let best = 0;
  let run = 0;
  let prev = null;
  for (const d of days) {
    const date = parseIso(d);
    run = prev && iso(addDays(prev, 1)) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return { current, best };
}

function level(count, max) {
  if (!count) return 0;
  const r = count / Math.max(max, 1);
  if (r > 0.75) return 4;
  if (r > 0.5) return 3;
  if (r > 0.25) return 2;
  return 1;
}

export default function StatsPage() {
  const { t, formatDate, locale } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  const pageRef = useBlueprintGrid([data, error, locale]);
  const snapScroll = useGridScroll();

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/v2/stats?tz_offset=${new Date().getTimezoneOffset()}`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('stats failed'))))
      .then((json) => !cancelled && setData(json))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const marked = {};
    const added = {};
    const activity = {};
    for (const row of data.daily) {
      marked[row.date] = row.marked;
      added[row.date] = row.added;
      activity[row.date] = row.marked + row.added;
    }
    const today = parseIso(data.today);
    const streaks = computeStreaks(activity, today);

    // Heatmap: columns are weeks (Mon-first), ends with the current week.
    const dow = (today.getDay() + 6) % 7;
    const gridStart = addDays(today, -dow - (HEATMAP_WEEKS - 1) * 7);
    const weeks = [];
    let max = 0;
    for (let w = 0; w < HEATMAP_WEEKS; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(gridStart, w * 7 + d);
        const key = iso(date);
        const count = activity[key] || 0;
        max = Math.max(max, count);
        col.push({ key, date, count, future: date > today });
      }
      weeks.push(col);
    }

    const bars = [];
    for (let i = BAR_DAYS - 1; i >= 0; i--) {
      const date = addDays(today, -i);
      const key = iso(date);
      bars.push({ key, date, marked: marked[key] || 0, added: added[key] || 0 });
    }
    const barMax = Math.max(1, ...bars.map((b) => b.marked + b.added));

    const sumLast = (n) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += activity[iso(addDays(today, -i))] || 0;
      return s;
    };

    const statuses = Object.entries(data.by_status).sort((a, b) => b[1] - a[1]);

    return {
      today,
      todayKey: iso(today),
      streaks,
      weeks,
      max,
      bars,
      barMax,
      markedToday: marked[iso(today)] || 0,
      addedToday: added[iso(today)] || 0,
      last7: sumLast(7),
      last30: sumLast(30),
      activeDays: Object.values(activity).filter((v) => v > 0).length,
      statuses,
    };
  }, [data]);

  if (error) {
    return (
      <div ref={pageRef} className="info-page bp-page">
        <div className="info-card bp-cell bp-snap" data-min-grids="2">
          {t('pages.stats.error')}
        </div>
      </div>
    );
  }
  if (!view) {
    return (
      <div ref={pageRef} className="info-page bp-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} className="spin" style={{ color: 'var(--primary)' }} />
      </div>
    );
  }

  const doneToday = view.markedToday + view.addedToday > 0;

  return (
    <div ref={pageRef} className="info-page bp-page">
      <div className="info-container bp-container">
        {/* Top Blueprint Rail */}
        <header className="info-hero bp-subbar bp-snap" data-min-grids="1">
          <div className="bp-subbar-left">
            <span className="column-dot" style={{ background: 'var(--aspen-mint)' }} />
            <h1 className="info-title bp-subbar-title">{t('pages.stats.title')}</h1>
            <span className="bp-subbar-sep">/</span>
            <p className="info-subtitle bp-subbar-subtitle">{t('pages.stats.subtitle')}</p>
          </div>
          <div className="bp-subbar-right">
            <span className={`bp-streak-pill ${doneToday ? 'done' : ''}`}>
              <Flame size={13} />
              <span>{doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}</span>
            </span>
          </div>
        </header>

        {/* 4-Column KPI Grid Strip */}
        <section className="stat-grid bp-grid-row" data-cols="4">
          <div className={`stat-card stat-streak ${doneToday ? 'done' : ''} bp-snap`} data-min-grids="2" id="stat-current-streak">
            <div className="stat-icon"><Flame size={18} /></div>
            <div className="stat-card-body">
              <div className="stat-card-top">
                <span className="stat-label">{t('pages.stats.current_streak')}</span>
                <span className="stat-value">{view.streaks.current}</span>
              </div>
              <div className="stat-hint">
                {doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}
              </div>
            </div>
          </div>

          <div className="stat-card bp-snap" data-min-grids="2" id="stat-best-streak">
            <div className="stat-icon gold"><Trophy size={18} /></div>
            <div className="stat-card-body">
              <div className="stat-card-top">
                <span className="stat-label">{t('pages.stats.best_streak')}</span>
                <span className="stat-value">{view.streaks.best}</span>
              </div>
              <div className="stat-hint">{t('pages.stats.active_days')}: {view.activeDays}</div>
            </div>
          </div>

          <div className="stat-card bp-snap" data-min-grids="2" id="stat-marked-today">
            <div className="stat-icon green"><CalendarCheck size={18} /></div>
            <div className="stat-card-body">
              <div className="stat-card-top">
                <span className="stat-label">{t('pages.stats.marked_today')}</span>
                <span className="stat-value">{view.markedToday}</span>
              </div>
              <div className="stat-hint">{t('pages.stats.last7')}: {view.last7}</div>
            </div>
          </div>

          <div className="stat-card bp-snap" data-min-grids="2" id="stat-added-today">
            <div className="stat-icon cyan"><PlusCircle size={18} /></div>
            <div className="stat-card-body">
              <div className="stat-card-top">
                <span className="stat-label">{t('pages.stats.added_today')}</span>
                <span className="stat-value">{view.addedToday}</span>
              </div>
              <div className="stat-hint">{t('pages.stats.last30')}: {view.last30}</div>
            </div>
          </div>
        </section>

        {/* 3-Column Board Layout: [01 Activity + Summary] | [02 Last 14 Days] | [03 By Status] */}
        <div className="stat-board-cols bp-grid-row" data-cols="3">
          {/* Column 1: Heatmap + Summary */}
          <section className="info-card bp-col">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">01</span>
                <span className="column-dot" style={{ background: 'var(--aspen-mint)' }} />
                <h2 className="column-name info-card-title">{t('pages.stats.activity')}</h2>
                <span className="column-badge">[{HEATMAP_WEEKS}w]</span>
              </div>
              <div className="heatmap-legend">
                <span>{t('pages.stats.less')}</span>
                {[0, 1, 2, 3, 4].map((l) => (
                  <span key={l} className={`heatmap-cell lvl-${l}`} aria-hidden="true" />
                ))}
                <span>{t('pages.stats.more')}</span>
              </div>
            </div>

            <div className="bp-heatmap-box bp-snap" data-min-grids="4">
              <div className="heatmap" id="stat-heatmap" onScroll={(event) => snapScroll(event, 'x')}>
                {view.weeks.map((col, i) => (
                  <div className="heatmap-col" key={i}>
                    {col.map((c) => (
                      <div
                        key={c.key}
                        className={`heatmap-cell lvl-${c.future ? 'future' : level(c.count, view.max)} ${c.key === view.todayKey ? 'today' : ''}`}
                        title={`${formatDate(c.date, { day: 'numeric', month: 'long', year: 'numeric' })}: ${c.count}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">02</span>
                <span className="column-dot" style={{ background: 'var(--primary)' }} />
                <h2 className="column-name info-card-title">{t('pages.stats.summary')}</h2>
              </div>
            </div>

            <ul className="summary-list">
              <li><span>{t('pages.stats.total_vacancies')}</span><b>{data.total}</b></li>
              <li><span>{t('pages.stats.last7')}</span><b>{view.last7}</b></li>
              <li><span>{t('pages.stats.last30')}</span><b>{view.last30}</b></li>
              <li><span>{t('pages.stats.active_days')}</span><b>{view.activeDays}</b></li>
            </ul>
          </section>

          {/* Column 2: Last 14 Days */}
          <section className="info-card bp-col">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">03</span>
                <span className="column-dot" style={{ background: '#0284c7' }} />
                <h2 className="column-name info-card-title">{t('pages.stats.last_days', { n: BAR_DAYS })}</h2>
              </div>
              <div className="bars-legend">
                <span><b className="chart-key chart-marked" /> {t('pages.stats.marked')}</span>
                <span><b className="chart-key chart-added" /> {t('pages.stats.added')}</span>
              </div>
            </div>

            <div className="ascii-day-chart" id="stat-bars" onScroll={(event) => snapScroll(event, 'x')}>
              {view.bars.map((b) => {
                const total = b.marked + b.added;
                const width = 20;
                const filled = Math.round((total / view.barMax) * width);
                const marked = total ? Math.round((b.marked / total) * filled) : 0;
                return (
                  <div
                    className="ascii-day-row"
                    key={b.key}
                    title={`${formatDate(b.date)}: ${t('pages.stats.marked')} ${b.marked}, ${t('pages.stats.added')} ${b.added}`}
                  >
                    <span className="ascii-day-date">{formatDate(b.date, { day: '2-digit', month: '2-digit' })}</span>
                    <span className="chart-track" aria-hidden="true">
                      <span className="chart-marked" style={{ width: `${(marked / width) * 100}%` }} />
                      <span className="chart-added" style={{ width: `${((filled - marked) / width) * 100}%` }} />
                    </span>
                    <span className="ascii-day-total">{total}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Column 3: By Status */}
          <section className="info-card bp-col">
            <div className="column-header">
              <div className="column-title-group">
                <span className="column-index">04</span>
                <span className="column-dot" style={{ background: '#9333ea' }} />
                <h3 className="column-name info-card-subtitle">{t('pages.stats.by_status')}</h3>
                <span className="column-badge">[{data.total}]</span>
              </div>
            </div>

            <div className="status-rows" onScroll={(event) => snapScroll(event, 'x')}>
              {view.statuses.map(([status, count]) => (
                <div className="status-row" key={status}>
                  <span className="status-name">{t(`kanban.columns.${status}`)}</span>
                  <span className="chart-track" aria-label={`${count} / ${data.total}`}>
                    <span className="chart-marked" style={{ width: `${(count / Math.max(data.total, 1)) * 100}%` }} />
                  </span>
                  <b>{count}</b>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
