import type { BoardColumn, QueueTask, User, Vacancy } from '../types/models';
import { type BoardModalRealtimeEvent, useMercureRealtime } from '../views/useMercureRealtime';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { columnService } from '../services/columnService';
import { queueService } from '../services/queueService';
import { useTranslation } from '../i18n/I18nContext';
import { vacancyService } from '../services/vacancyService';

export interface BoardToastState {
  message: string;
  type: 'success' | 'error';
}

export type BoardModalEventListener = (event: BoardModalRealtimeEvent) => void;

export interface BoardStoreValue {
  vacancies: Vacancy[];
  setVacancies: React.Dispatch<React.SetStateAction<Vacancy[]>>;
  vacanciesLoaded: boolean;
  columns: BoardColumn[];
  setColumns: React.Dispatch<React.SetStateAction<BoardColumn[]>>;
  queueRemaining: number;
  setQueueRemaining: React.Dispatch<React.SetStateAction<number>>;
  toast: BoardToastState | null;
  setToast: React.Dispatch<React.SetStateAction<BoardToastState | null>>;
  showToast: (message: string, type: 'success' | 'error') => void;
  fetchVacancies: () => Promise<void>;
  fetchColumns: () => Promise<void>;
  fetchQueueStatus: () => Promise<void>;
  subscribeModalEvents: (listener: BoardModalEventListener) => () => void;
}

export interface BoardStoreProviderProps {
  user: User | null | undefined;
  initialVacancies?: Vacancy[];
  initialColumns?: BoardColumn[];
  children: React.ReactNode;
}

const BoardStoreContext = createContext<BoardStoreValue | null>(null);

export function useOptionalBoardStore(): BoardStoreValue | null {
  return useContext(BoardStoreContext);
}

function extractQueueRemainingCount(data: unknown): number | null {
  if (Array.isArray(data)) {
    return (data as QueueTask[]).filter((i) => i.status === 'pending' || i.status === 'processing')
      .length;
  }
  if (data && typeof data === 'object' && 'total_remaining' in data) {
    const val = (data as { total_remaining?: number }).total_remaining;
    return typeof val === 'number' ? val : null;
  }
  return null;
}

function useBoardToastAndEvents() {
  const [toast, setToast] = useState<BoardToastState | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    clearTimeout(toastTimerRef.current);
    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 3500);
  }, []);

  const listenersRef = useRef<Set<BoardModalEventListener>>(new Set());
  const subscribeModalEvents = useCallback((listener: BoardModalEventListener) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const notifyModalListeners = useCallback((event: BoardModalRealtimeEvent) => {
    listenersRef.current.forEach((fn) => fn(event));
  }, []);

  return { toast, setToast, showToast, subscribeModalEvents, notifyModalListeners };
}

function useBoardDataFetchers(
  user: User | null | undefined,
  initialVacancies: Vacancy[] | undefined,
  initialColumns: BoardColumn[] | undefined,
) {
  const hasSeedVacancies = Array.isArray(initialVacancies);
  const hasSeedColumns = Array.isArray(initialColumns) && initialColumns.length > 0;

  const [vacancies, setVacancies] = useState<Vacancy[]>(hasSeedVacancies ? initialVacancies : []);
  const [vacanciesLoaded, setVacanciesLoaded] = useState<boolean>(hasSeedVacancies);
  const [columns, setColumns] = useState<BoardColumn[]>(hasSeedColumns ? initialColumns : []);
  const [queueRemaining, setQueueRemaining] = useState(0);

  const fetchVacancies = useCallback(async () => {
    if (!user) return;
    try {
      const data = await vacancyService.getVacancies();
      if (Array.isArray(data)) setVacancies(data);
    } catch (err) {
      console.error('Failed to fetch vacancies', err);
    } finally {
      setVacanciesLoaded(true);
    }
  }, [user]);

  const fetchColumns = useCallback(async () => {
    if (!user) return;
    try {
      const data = await columnService.getColumns();
      if (Array.isArray(data) && data.length > 0) setColumns(data);
    } catch (err) {
      console.error('Failed to fetch columns', err);
    }
  }, [user]);

  const fetchQueueStatus = useCallback(async () => {
    if (!user) return;
    try {
      const data = await queueService.getTasks();
      const count = extractQueueRemainingCount(data);
      if (count !== null) setQueueRemaining(count);
    } catch (err) {
      console.debug('Failed to fetch queue status', err);
    }
  }, [user]);

  const loadedUserIdRef = useRef<number | null>(hasSeedVacancies && user ? user.id : null);

  useEffect(() => {
    if (!user) {
      loadedUserIdRef.current = null;
      return;
    }
    if (loadedUserIdRef.current === user.id) {
      return;
    }
    loadedUserIdRef.current = user.id;
    void fetchVacancies();
    if (!hasSeedColumns) {
      void fetchColumns();
    }
    void fetchQueueStatus();
  }, [user, hasSeedColumns, fetchVacancies, fetchColumns, fetchQueueStatus]);

  return {
    vacancies,
    setVacancies,
    vacanciesLoaded,
    columns,
    setColumns,
    queueRemaining,
    setQueueRemaining,
    fetchVacancies,
    fetchColumns,
    fetchQueueStatus,
  };
}

export function useBoardStoreState(
  user: User | null | undefined,
  initialVacancies: Vacancy[] | undefined,
  initialColumns: BoardColumn[] | undefined,
): BoardStoreValue {
  const { t } = useTranslation();
  const data = useBoardDataFetchers(user, initialVacancies, initialColumns);
  const bus = useBoardToastAndEvents();

  useMercureRealtime(user, {
    fetchQueueStatus: data.fetchQueueStatus,
    showToast: bus.showToast,
    t,
    setVacancies: data.setVacancies,
    setQueueRemaining: data.setQueueRemaining,
    onModalRealtimeEvent: bus.notifyModalListeners,
  });

  return useMemo(
    () => ({
      ...data,
      toast: bus.toast,
      setToast: bus.setToast,
      showToast: bus.showToast,
      subscribeModalEvents: bus.subscribeModalEvents,
    }),
    [data, bus.toast, bus.setToast, bus.showToast, bus.subscribeModalEvents],
  );
}

export function BoardStoreProvider({
  user,
  initialVacancies,
  initialColumns,
  children,
}: BoardStoreProviderProps): React.ReactElement {
  const store = useBoardStoreState(user, initialVacancies, initialColumns);
  return <BoardStoreContext.Provider value={store}>{children}</BoardStoreContext.Provider>;
}
