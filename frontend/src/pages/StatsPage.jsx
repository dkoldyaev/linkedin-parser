import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, CalendarCheck, PlusCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

const HEATMAP_WEEKS = 26;
const BAR_DAYS = 14;

const STATUS_COLORS = {
  'Еще не написан': 'var(--col-backlog)',
  'Написал': 'var(--col-applied)',
  'Собеседование': 'var(--col-interview)',
  'Тестовое': 'var(--col-test)',
  'Оффер': 'var(--col-offer)',
  'Отказ': '#ef4444',
};

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
  // Current streak: counts back from today; if today is still empty, starts from yesterday.
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
  const { t, formatDate } = useTranslation();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/stats?tz_offset=${new Date().getTimezoneOffset()}`)
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
    return <div className="info-page"><div className="info-card">{t('pages.stats.error')}</div></div>;
  }
  if (!view) {
    return (
      <div className="info-page" style={{ alignItems: 'center' }}>
        <Loader2 size={32} className="spin" style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  const doneToday = view.markedToday + view.addedToday > 0;

  return (
    <div className="info-page">
      <div className="info-container">
        <header className="info-hero">
          <h1 className="info-title">{t('pages.stats.title')}</h1>
          <p className="info-subtitle">{t('pages.stats.subtitle')}</p>
        </header>

        <section className="stat-grid">
          <div className={`stat-card stat-streak ${doneToday ? 'done' : ''}`} id="stat-current-streak">
            <div className="stat-icon"><Flame size={22} /></div>
            <div>
              <div className="stat-value">{view.streaks.current}</div>
              <div className="stat-label">{t('pages.stats.current_streak')}</div>
              <div className="stat-hint">
                {doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}
              </div>
            </div>
          </div>
          <div className="stat-card" id="stat-best-streak">
            <div className="stat-icon gold"><Trophy size={22} /></div>
            <div>
              <div className="stat-value">{view.streaks.best}</div>
              <div className="stat-label">{t('pages.stats.best_streak')}</div>
            </div>
          </div>
          <div className="stat-card" id="stat-marked-today">
            <div className="stat-icon green"><CalendarCheck size={22} /></div>
            <div>
              <div className="stat-value">{view.markedToday}</div>
              <div className="stat-label">{t('pages.stats.marked_today')}</div>
            </div>
          </div>
          <div className="stat-card" id="stat-added-today">
            <div className="stat-icon cyan"><PlusCircle size={22} /></div>
            <div>
              <div className="stat-value">{view.addedToday}</div>
              <div className="stat-label">{t('pages.stats.added_today')}</div>
            </div>
          </div>
        </section>

        <section className="info-card">
          <h2 className="info-card-title">{t('pages.stats.activity')}</h2>
          <div className="heatmap" id="stat-heatmap">
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
          <div className="heatmap-legend">
            <span>{t('pages.stats.less')}</span>
            {[0, 1, 2, 3, 4].map((l) => <div key={l} className={`heatmap-cell lvl-${l}`} />)}
            <span>{t('pages.stats.more')}</span>
          </div>
        </section>

        <div className="stat-two-col">
          <section className="info-card">
            <h2 className="info-card-title">{t('pages.stats.last_days', { n: BAR_DAYS })}</h2>
            <div className="bars" id="stat-bars">
              {view.bars.map((b) => {
                const total = b.marked + b.added;
                return (
                  <div className="bar-col" key={b.key} title={`${formatDate(b.date)}: ${t('pages.stats.marked')} ${b.marked}, ${t('pages.stats.added')} ${b.added}`}>
                    <div className="bar-value">{total || ''}</div>
                    <div className="bar-track">
                      <div className="bar-seg added" style={{ height: `${(b.added / view.barMax) * 100}%` }} />
                      <div className="bar-seg marked" style={{ height: `${(b.marked / view.barMax) * 100}%` }} />
                    </div>
                    <div className="bar-label">{b.date.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div className="bars-legend">
              <span><i className="dot marked" />{t('pages.stats.marked')}</span>
              <span><i className="dot added" />{t('pages.stats.added')}</span>
            </div>
          </section>

          <section className="info-card">
            <h2 className="info-card-title">{t('pages.stats.summary')}</h2>
            <ul className="summary-list">
              <li><span>{t('pages.stats.total_vacancies')}</span><b>{data.total}</b></li>
              <li><span>{t('pages.stats.last7')}</span><b>{view.last7}</b></li>
              <li><span>{t('pages.stats.last30')}</span><b>{view.last30}</b></li>
              <li><span>{t('pages.stats.active_days')}</span><b>{view.activeDays}</b></li>
            </ul>
            <h3 className="info-card-subtitle">{t('pages.stats.by_status')}</h3>
            <div className="status-rows">
              {view.statuses.map(([status, count]) => (
                <div className="status-row" key={status}>
                  <span className="status-name">{t(`kanban.columns.${status}`)}</span>
                  <div className="status-bar">
                    <div
                      style={{
                        width: `${(count / Math.max(data.total, 1)) * 100}%`,
                        background: STATUS_COLORS[status] || 'var(--primary)',
                      }}
                    />
                  </div>
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
