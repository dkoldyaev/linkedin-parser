import type { QueueTask, User, Vacancy } from '../types/models';
import React, { useEffect, useRef, useState } from 'react';
import { type TranslateFn, upsertVacancyInList } from './homeFilterHelpers';
import { queueService } from '../services/queueService';
import { realtimeService } from '../services/realtimeService';

export type BoardModalRealtimeEvent =
  | { type: 'vacancy_updated'; vacancy: Vacancy }
  | { type: 'compatibility_analyzed'; vacancyId: number; score: number }
  | { type: 'vacancy_deleted'; vacancyId: number };

export interface MercureRealtimeCallbacks {
  fetchQueueStatus: () => void;
  showToast: (msg: string, type: 'success' | 'error') => void;
  t: TranslateFn;
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  setQueueRemaining: React.Dispatch<React.SetStateAction<number>>;
  onModalRealtimeEvent?: (event: BoardModalRealtimeEvent) => void;
}

interface ParsedMercurePayload {
  type: string;
  error_code?: string;
  error?: string;
  vacancy?: Vacancy;
  vacancy_id?: number;
  id?: number;
  title?: string;
  company?: string;
  total_remaining?: number;
  url?: string;
  items?: QueueTask[];
  calculated_score?: number;
  match_score?: number;
  overall_score?: number;
  is_closed?: boolean;
}

function parseMercureEventData(rawText: string): ParsedMercurePayload {
  const raw = JSON.parse(rawText);
  const type: string = raw.type || raw.event_type || '';
  const payload = raw.data && typeof raw.data === 'object' ? { ...raw.data, ...raw } : raw;
  return { ...payload, type };
}

function extractIncomingVacancy(payload: ParsedMercurePayload): Vacancy | null {
  if (payload.vacancy) return payload.vacancy;
  if (payload.id && payload.title) return payload as unknown as Vacancy;
  return null;
}

function updateQueueCountFromPayload(payload: ParsedMercurePayload, cb: MercureRealtimeCallbacks) {
  if (payload.total_remaining !== undefined) {
    cb.setQueueRemaining(payload.total_remaining);
  }
  if (payload.type === 'queue_state' && Array.isArray(payload.items)) {
    const activeCount = payload.items.filter(
      (i) => i.status === 'pending' || i.status === 'processing',
    ).length;
    cb.setQueueRemaining(activeCount);
  }
}

function handleVacancyCreatedEvent(
  incoming: Vacancy | null,
  cb: MercureRealtimeCallbacks,
  scheduleRefresh: () => void,
) {
  if (!incoming) return;
  cb.setVacancies((prev) => upsertVacancyInList(prev, incoming));
  cb.showToast(
    cb.t('mercure.vacancy_created', {
      title: incoming.title,
      company: incoming.company ? incoming.company : '',
    }),
    'success',
  );
  scheduleRefresh();
}

function handleVacancyUpdatedEvent(
  incoming: Vacancy | null,
  cb: MercureRealtimeCallbacks,
  scheduleRefresh: () => void,
) {
  if (!incoming) return;
  cb.setVacancies((prev) => upsertVacancyInList(prev, incoming));
  cb.onModalRealtimeEvent?.({ type: 'vacancy_updated', vacancy: incoming });
  cb.showToast(cb.t('mercure.vacancy_updated', { title: incoming.title }), 'success');
  scheduleRefresh();
}

function resolvePayloadScore(payload: ParsedMercurePayload): number | undefined {
  if (payload.calculated_score !== undefined) return payload.calculated_score;
  if (payload.match_score !== undefined) return payload.match_score;
  return payload.overall_score;
}

function handleCompatibilityAnalyzedEvent(
  payload: ParsedMercurePayload,
  cb: MercureRealtimeCallbacks,
) {
  const matchedId = payload.vacancy_id;
  const newScore = resolvePayloadScore(payload);
  if (!matchedId || newScore === undefined) return;
  cb.setVacancies((prev) =>
    prev.map((v) =>
      v.id === matchedId ? { ...v, calculated_score: newScore, match_score: newScore } : v,
    ),
  );
  cb.onModalRealtimeEvent?.({
    type: 'compatibility_analyzed',
    vacancyId: matchedId,
    score: newScore,
  });
}

function resolveDeletedVacancyId(
  payload: ParsedMercurePayload,
  incoming: Vacancy | null,
): number | undefined {
  if (payload.vacancy_id) return payload.vacancy_id;
  if (incoming) return incoming.id;
  return payload.id;
}

function handleVacancyDeletedEvent(
  payload: ParsedMercurePayload,
  incoming: Vacancy | null,
  cb: MercureRealtimeCallbacks,
  scheduleRefresh: () => void,
) {
  const delId = resolveDeletedVacancyId(payload, incoming);
  if (!delId) return;
  cb.setVacancies((prev) => prev.filter((v) => v.id !== delId));
  cb.onModalRealtimeEvent?.({ type: 'vacancy_deleted', vacancyId: delId });
  const delTitle = payload.title || incoming?.title;
  if (delTitle) {
    cb.showToast(cb.t('mercure.vacancy_deleted', { title: delTitle }), 'success');
  }
  scheduleRefresh();
}

function handleTaskFailedEvent(payload: ParsedMercurePayload, cb: MercureRealtimeCallbacks) {
  const errText = payload.error_code
    ? cb.t(`mercure.errors.${payload.error_code}`)
    : payload.error || cb.t('mercure.errors.ERR_UNKNOWN');
  cb.showToast(
    cb.t('mercure.task_failed', { error: errText, url: payload.url ? payload.url : '' }),
    'error',
  );
}

function handleQueueIdleEvent(cb: MercureRealtimeCallbacks, scheduleRefresh: () => void) {
  cb.setQueueRemaining(0);
  cb.showToast(cb.t('mercure.queue_idle'), 'success');
  scheduleRefresh();
}

function dispatchMercurePayload(
  payload: ParsedMercurePayload,
  cb: MercureRealtimeCallbacks,
  scheduleRefresh: () => void,
) {
  updateQueueCountFromPayload(payload, cb);
  const incoming = extractIncomingVacancy(payload);
  const normalizedType = payload.type.toLowerCase();

  const handlers: Record<string, () => void> = {
    vacancy_created: () => handleVacancyCreatedEvent(incoming, cb, scheduleRefresh),
    vacancy_updated: () => handleVacancyUpdatedEvent(incoming, cb, scheduleRefresh),
    compatibility_analyzed: () => handleCompatibilityAnalyzedEvent(payload, cb),
    vacancy_deleted: () => handleVacancyDeletedEvent(payload, incoming, cb, scheduleRefresh),
    task_failed: () => handleTaskFailedEvent(payload, cb),
    queue_idle: () => handleQueueIdleEvent(cb, scheduleRefresh),
  };

  const handler = handlers[normalizedType];
  if (handler) handler();
}

async function fetchMercureSseUrl(): Promise<string> {
  const cfg = await realtimeService.getConfig();
  const sseUrl = new URL(cfg.mercure_hub_url, window.location.origin);
  sseUrl.searchParams.append('topic', cfg.mercure_topic);
  return sseUrl.toString();
}

export function useMercureRealtime(
  user: User | null | undefined,
  callbacks: MercureRealtimeCallbacks,
) {
  const [mercureStatus, setMercureStatus] = useState<'connected' | 'connecting'>('connecting');
  const callbacksRef = useRef<MercureRealtimeCallbacks>(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let eventSource: EventSource | null = null;
    let isSubscribed = true;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let reconcileTimer: ReturnType<typeof setTimeout> | undefined;

    const scheduleRefresh = () => {
      clearTimeout(reconcileTimer);
      reconcileTimer = setTimeout(() => {
        if (!isSubscribed) return;
        callbacksRef.current.fetchQueueStatus();
      }, 1000);
    };

    const initMercure = async () => {
      try {
        setMercureStatus('connecting');
        const sseUrlStr = await fetchMercureSseUrl();
        if (!isSubscribed) return;
        if (eventSource) eventSource.close();
        eventSource = new EventSource(sseUrlStr, { withCredentials: true });
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(initMercure, 50 * 60 * 1000);

        eventSource.onopen = () => {
          if (!isSubscribed) return;
          setMercureStatus('connected');
          queueService.sync().catch(() => {});
        };

        eventSource.onerror = () => {
          if (isSubscribed) setMercureStatus('connecting');
        };

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const parsed = parseMercureEventData(event.data);
            dispatchMercurePayload(parsed, callbacksRef.current, scheduleRefresh);
          } catch (err) {
            console.error('Failed to parse Mercure message', err);
          }
        };
      } catch (err) {
        console.error('Failed to initialize Mercure EventSource', err);
        if (isSubscribed) {
          setMercureStatus('connecting');
          refreshTimer = setTimeout(initMercure, 5000);
        }
      }
    };

    initMercure();

    return () => {
      isSubscribed = false;
      clearTimeout(refreshTimer);
      clearTimeout(reconcileTimer);
      if (eventSource) eventSource.close();
    };
  }, [userId]);

  return { mercureStatus };
}
