'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Flame, Trophy, CalendarCheck, PlusCircle } from 'lucide-react';
import {
  PageLayout,
  TableHeader,
  Badge,
  Text,
  Spinner,
  AlertBanner,
  Icon,
  StatusDot,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
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
  const snapScroll = useGridScroll();

  useEffect(() => {
    let active = true;
    fetch('/api/v2/stats')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d) => { if (active) setData(d); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);

  const view = useMemo(() => {
    if (!data) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activity = {};
    const marked = { ...(data.marked_by_day || {}) };
    const added = { ...(data.added_by_day || {}) };
    if (Array.isArray(data.daily)) {
      for (const item of data.daily) {
        if (item.date) {
          marked[item.date] = (marked[item.date] || 0) + (item.marked || 0);
          added[item.date] = (added[item.date] || 0) + (item.added || 0);
        }
      }
    }
    for (const [k, v] of Object.entries(marked)) activity[k] = (activity[k] || 0) + v;
    for (const [k, v] of Object.entries(added)) activity[k] = (activity[k] || 0) + v;

    const streaks = computeStreaks(activity, today);

    // Heatmap calendar: HEATMAP_WEEKS columns of 7 days (Mon-Sun)
    const todayDayOfWeek = (today.getDay() + 6) % 7; // 0 = Mon
    const endOfWeek = addDays(today, 6 - todayDayOfWeek);
    const start = addDays(endOfWeek, -(HEATMAP_WEEKS * 7 - 1));

    const weeks = [];
    let cur = new Date(start);
    let max = 0;
    for (let w = 0; w < HEATMAP_WEEKS; w += 1) {
      const col = [];
      for (let d = 0; d < 7; d += 1) {
        const key = iso(cur);
        const count = activity[key] || 0;
        const isFuture = cur > today;
        if (!isFuture && count > max) max = count;
        col.push({ key, date: new Date(cur), count, future: isFuture });
        cur = addDays(cur, 1);
      }
      weeks.push(col);
    }

    // Bar chart: last BAR_DAYS days
    const bars = [];
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
    barMax = Math.max(barMax, 1);

    const sumLast = (n) => {
      let s = 0;
      for (let i = 0; i < n; i += 1) {
        const key = iso(addDays(today, -i));
        s += activity[key] || 0;
      }
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
      <PageLayout gridDeps={[locale]} className="stats-page">
        <div style={{ padding: 'var(--ui-space-4)' }}>
          <AlertBanner tone="danger" title={t('pages.stats.error')} />
        </div>
      </PageLayout>
    );
  }

  if (!view) {
    return (
      <PageLayout gridDeps={[locale]} className="stats-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(8 * var(--ui-grid-cell))' }}>
          <Spinner size="lg" />
        </div>
      </PageLayout>
    );
  }

  const doneToday = view.markedToday + view.addedToday > 0;

  return (
    <PageLayout
      gridDeps={[locale]}
      className="stats-page"
      header={
        <div
          className="bp-subbar bp-snap"
          data-min-grids="1"
          style={{
            height: 'var(--ui-grid-cell)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--ui-space-4)',
            backgroundColor: 'var(--ui-bg-surface)',
            borderBottom: '1px solid var(--ui-pixel-line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-success)' }} />
            <Text variant="mono" weight="bold" tone="primary">
              {t('pages.stats.title')}
            </Text>
            <Text variant="mono" tone="muted">
              /
            </Text>
            <Text variant="caption" tone="secondary">
              {t('pages.stats.subtitle')}
            </Text>
          </div>
          <div>
            <Badge
              variant={doneToday ? 'solid' : 'outline'}
              tone={doneToday ? 'success' : 'warning'}
              size="sm"
              icon={<Icon icon={Flame} size="xs" />}
            >
              {doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}
            </Badge>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-6)', padding: 'var(--ui-space-4)' }}>
        {/* 4-Column KPI Grid Strip */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--ui-space-4)',
          }}
        >
          <div
            id="stat-current-streak"
            style={{
              padding: 'var(--ui-space-4)',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ui-space-3)',
            }}
          >
            <div style={{ color: 'var(--ui-warning)' }}>
              <Icon icon={Flame} size="md" />
            </div>
            <div>
              <Text variant="caption" tone="secondary">
                {t('pages.stats.current_streak')}
              </Text>
              <Text variant="title" weight="bold" tone="primary">
                {view.streaks.current}
              </Text>
              <Text variant="caption" tone="muted">
                {doneToday ? t('pages.stats.streak_done') : t('pages.stats.streak_todo')}
              </Text>
            </div>
          </div>

          <div
            id="stat-best-streak"
            style={{
              padding: 'var(--ui-space-4)',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ui-space-3)',
            }}
          >
            <div style={{ color: 'var(--ui-warning)' }}>
              <Icon icon={Trophy} size="md" />
            </div>
            <div>
              <Text variant="caption" tone="secondary">
                {t('pages.stats.best_streak')}
              </Text>
              <Text variant="title" weight="bold" tone="primary">
                {view.streaks.best}
              </Text>
              <Text variant="caption" tone="muted">
                {t('pages.stats.active_days')}: {view.activeDays}
              </Text>
            </div>
          </div>

          <div
            id="stat-marked-today"
            style={{
              padding: 'var(--ui-space-4)',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ui-space-3)',
            }}
          >
            <div style={{ color: 'var(--ui-success)' }}>
              <Icon icon={CalendarCheck} size="md" />
            </div>
            <div>
              <Text variant="caption" tone="secondary">
                {t('pages.stats.marked_today')}
              </Text>
              <Text variant="title" weight="bold" tone="primary">
                {view.markedToday}
              </Text>
              <Text variant="caption" tone="muted">
                {t('pages.stats.last7')}: {view.last7}
              </Text>
            </div>
          </div>

          <div
            id="stat-added-today"
            style={{
              padding: 'var(--ui-space-4)',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--ui-space-3)',
            }}
          >
            <div style={{ color: 'var(--ui-primary)' }}>
              <Icon icon={PlusCircle} size="md" />
            </div>
            <div>
              <Text variant="caption" tone="secondary">
                {t('pages.stats.added_today')}
              </Text>
              <Text variant="title" weight="bold" tone="primary">
                {view.addedToday}
              </Text>
              <Text variant="caption" tone="muted">
                {t('pages.stats.last30')}: {view.last30}
              </Text>
            </div>
          </div>
        </section>

        {/* 3-Column Board Layout: [01 Activity + Summary] | [02 Last 14 Days] | [03 By Status] */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 'var(--ui-space-4)',
          }}
        >
          {/* Column 1: Heatmap + Summary */}
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
            }}
          >
            <TableHeader
              size="sm"
              actions={
                <div className="heatmap-legend" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                  <Text variant="caption" tone="muted">{t('pages.stats.less')}</Text>
                  {[0, 1, 2, 3, 4].map((l) => (
                    <span key={l} className={`heatmap-cell lvl-${l}`} aria-hidden="true" />
                  ))}
                  <Text variant="caption" tone="muted">{t('pages.stats.more')}</Text>
                </div>
              }
            >
              <Text as="span" variant="mono" weight="semibold" tone="accent">
                [ 01 ]
              </Text>
              <StatusDot tone="success" size="md" />
              <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                {t('pages.stats.activity')}
              </Text>
              <Badge variant="counter" size="xs" tone="neutral">
                {`${HEATMAP_WEEKS}w`}
              </Badge>
            </TableHeader>

            <div className="bp-heatmap-box bp-snap" data-min-grids="4" style={{ padding: 'var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
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

            <TableHeader size="sm">
              <Text as="span" variant="mono" weight="semibold" tone="accent">
                [ 02 ]
              </Text>
              <StatusDot tone="accent" size="md" />
              <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                {t('pages.stats.summary')}
              </Text>
            </TableHeader>

            <ul className="summary-list" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--ui-space-2) var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
                <Text variant="body-sm" tone="secondary">{t('pages.stats.total_vacancies')}</Text>
                <Text variant="mono" weight="bold" tone="primary">{data.total}</Text>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--ui-space-2) var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
                <Text variant="body-sm" tone="secondary">{t('pages.stats.last7')}</Text>
                <Text variant="mono" weight="bold" tone="primary">{view.last7}</Text>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--ui-space-2) var(--ui-space-4)', borderBottom: '1px solid var(--ui-border-subtle)' }}>
                <Text variant="body-sm" tone="secondary">{t('pages.stats.last30')}</Text>
                <Text variant="mono" weight="bold" tone="primary">{view.last30}</Text>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--ui-space-2) var(--ui-space-4)' }}>
                <Text variant="body-sm" tone="secondary">{t('pages.stats.active_days')}</Text>
                <Text variant="mono" weight="bold" tone="primary">{view.activeDays}</Text>
              </li>
            </ul>
          </section>

          {/* Column 2: Last 14 Days */}
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
            }}
          >
            <TableHeader
              size="sm"
              actions={
                <div className="bars-legend" style={{ display: 'flex', gap: '8px', fontSize: '11px' }}>
                  <Text variant="caption" tone="secondary"><b className="chart-key chart-marked" /> {t('pages.stats.marked')}</Text>
                  <Text variant="caption" tone="secondary"><b className="chart-key chart-added" /> {t('pages.stats.added')}</Text>
                </div>
              }
            >
              <Text as="span" variant="mono" weight="semibold" tone="accent">
                [ 03 ]
              </Text>
              <StatusDot tone="accent" size="md" />
              <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                {t('pages.stats.last_days', { n: BAR_DAYS })}
              </Text>
            </TableHeader>

            <div className="ascii-day-chart" id="stat-bars" onScroll={(event) => snapScroll(event, 'x')} style={{ padding: 'var(--ui-space-4)' }}>
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
          <section
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--ui-bg-card-fill)',
              border: '1px solid var(--ui-border-subtle)',
            }}
          >
            <TableHeader size="sm">
              <Text as="span" variant="mono" weight="semibold" tone="accent">
                [ 04 ]
              </Text>
              <StatusDot tone="accent" size="md" />
              <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
                {t('pages.stats.by_status')}
              </Text>
              <Badge variant="counter" size="xs" tone="neutral">
                {data.total}
              </Badge>
            </TableHeader>

            <div className="status-rows" onScroll={(event) => snapScroll(event, 'x')} style={{ padding: 'var(--ui-space-4)' }}>
              {view.statuses.map(([status, count]) => (
                <div className="status-row" key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                  <Text variant="body-sm" tone="primary" style={{ width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {t(`kanban.columns.${status}`)}
                  </Text>
                  <span className="chart-track" aria-label={`${count} / ${data.total}`} style={{ flex: 1 }}>
                    <span className="chart-marked" style={{ width: `${(count / Math.max(data.total, 1)) * 100}%` }} />
                  </span>
                  <Text variant="mono" weight="bold" tone="primary" style={{ width: '40px', textAlign: 'right' }}>
                    {count}
                  </Text>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
