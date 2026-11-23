import { useState, useEffect } from 'react';
import { trackEvent, EVENTS } from '../../utils/analytics';
import { STATUS_NOT_CONTACTED } from '../../constants/columns';
import { vacancyService } from '../../services/vacancyService';
import type {
  CompatibilityAnalysis,
  Vacancy,
  VacancyHistoryItem,
} from '../../types/models';
import type { TranslateFn } from '../../i18n/I18nContext';

export interface SalaryFormPayload {
  min: string | number;
  max: string | number;
  currency: string;
  period: string;
}

export interface UseVacancyModalControllerArgs {
  vacancy: Vacancy | null;
  onUpdate: (updated: Vacancy) => void;
  initialHistory?: VacancyHistoryItem[];
  initialCompatibility?: CompatibilityAnalysis | null;
  locale: string;
  t: TranslateFn;
}

export interface VacancyDraft {
  id: number | null;
  status: string;
  tags: string[];
  techStack: string[];
  notes: string;
  description: string;
  title: string;
  salaryMin: string | number;
  salaryMax: string | number;
  salaryCurrency: string;
  salaryPeriod: string;
  workplaceType: string;
  isClosed: boolean;
}

const EMPTY_VACANCY_DRAFT: VacancyDraft = {
  id: null,
  status: STATUS_NOT_CONTACTED,
  tags: [],
  techStack: [],
  notes: '',
  description: '',
  title: '',
  salaryMin: '',
  salaryMax: '',
  salaryCurrency: '$',
  salaryPeriod: 'month',
  workplaceType: '',
  isClosed: false,
};

function resolveInitialHistoryList(
  vacancy: Vacancy | null,
  initialHistory?: VacancyHistoryItem[]
): VacancyHistoryItem[] {
  if (Array.isArray(initialHistory)) return initialHistory;
  if (Array.isArray(vacancy?.history)) return vacancy.history;
  return [];
}

async function patchVacancyFields(
  vacancyId: number,
  payload: Record<string, unknown>
): Promise<Vacancy | null> {
  try {
    return await vacancyService.patchDetail(vacancyId, payload);
  } catch {
    return null;
  }
}

function buildTextAndArraysDraft(vacancy: Vacancy) {
  return {
    id: vacancy.id,
    status: vacancy.status || STATUS_NOT_CONTACTED,
    tags: vacancy.tags || [],
    techStack: vacancy.tech_stack || [],
    notes: vacancy.notes || '',
    description: vacancy.description || '',
    title: vacancy.title || '',
  };
}

function buildSalaryAndFormatDraft(vacancy: Vacancy) {
  return {
    salaryMin: vacancy.salary_min ?? '',
    salaryMax: vacancy.salary_max ?? '',
    salaryCurrency: vacancy.salary_currency || '$',
    salaryPeriod: vacancy.salary_period || 'month',
    workplaceType: vacancy.workplace_type || '',
    isClosed: Boolean(vacancy.is_closed),
  };
}

function buildVacancyDraft(vacancy: Vacancy | null): VacancyDraft {
  if (!vacancy) return EMPTY_VACANCY_DRAFT;
  return {
    ...buildTextAndArraysDraft(vacancy),
    ...buildSalaryAndFormatDraft(vacancy),
  };
}

function useVacancyDraftState(vacancy: Vacancy | null) {
  const [draft, setDraft] = useState<VacancyDraft>(() => buildVacancyDraft(vacancy));
  const currentId = vacancy ? vacancy.id : null;
  if (currentId !== draft.id) {
    setDraft(buildVacancyDraft(vacancy));
  }
  return [draft, setDraft] as const;
}

function syncHistoryForVacancy(
  vacancy: Vacancy,
  initialHistory: VacancyHistoryItem[] | undefined,
  setHistoryList: (list: VacancyHistoryItem[]) => void
): void {
  if (Array.isArray(initialHistory)) {
    setHistoryList(initialHistory);
  } else if (Array.isArray(vacancy.history)) {
    setHistoryList(vacancy.history);
  } else if (vacancy.id) {
    vacancyService
      .getHistory(vacancy.id)
      .then((data) => {
        if (Array.isArray(data)) setHistoryList(data);
      })
      .catch((err) => console.warn('Failed to load history:', err));
  }
}

function syncCompatibilityForVacancy(
  vacancy: Vacancy,
  initialCompatibility: CompatibilityAnalysis | null | undefined,
  setCompatibility: (c: CompatibilityAnalysis | null) => void,
  setLoadingCompatibility: (loading: boolean) => void
): void {
  if (initialCompatibility !== undefined && initialCompatibility !== null) {
    setCompatibility(initialCompatibility);
  } else if (vacancy.id) {
    setCompatibility(null);
    setLoadingCompatibility(true);
    vacancyService
      .getCompatibility(vacancy.id)
      .then((data) => setCompatibility(data))
      .catch((err) => console.warn('Failed to load compatibility:', err))
      .finally(() => setLoadingCompatibility(false));
  }
}

async function postCompatibilityRequest(
  vacancyId: number,
  force: boolean
): Promise<CompatibilityAnalysis> {
  return vacancyService.triggerCompatibility(vacancyId, force);
}

function useHistoryAndCompatibilitySync(
  vacancy: Vacancy | null,
  initialHistory?: VacancyHistoryItem[],
  initialCompatibility?: CompatibilityAnalysis | null
) {
  const [historyList, setHistoryList] = useState<VacancyHistoryItem[]>(() =>
    resolveInitialHistoryList(vacancy, initialHistory)
  );
  const [compatibility, setCompatibility] = useState<CompatibilityAnalysis | null>(
    initialCompatibility !== undefined ? initialCompatibility : null
  );
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [analyzingCompatibility, setAnalyzingCompatibility] = useState(false);
  const [compatError, setCompatError] = useState<string | null>(null);

  useEffect(() => {
    if (!vacancy) return;
    syncHistoryForVacancy(vacancy, initialHistory, setHistoryList);
    syncCompatibilityForVacancy(
      vacancy,
      initialCompatibility,
      setCompatibility,
      setLoadingCompatibility
    );
  }, [vacancy, initialHistory, initialCompatibility]);

  const patchHistoryComment = async (historyId: string | number, comment: string | null) => {
    if (!vacancy) return;
    try {
      const updatedHistory = await vacancyService.updateHistoryComment(
        vacancy.id,
        historyId,
        comment
      );
      setHistoryList((prev) =>
        prev.map((h) => (String(h.id) === String(historyId) ? updatedHistory : h))
      );
    } catch (err) {
      console.error('Failed to update history comment', err);
    }
  };

  const handleRunCompatibility = async (force?: boolean) => {
    if (!vacancy) return;
    setAnalyzingCompatibility(true);
    setCompatError(null);
    try {
      const data = await postCompatibilityRequest(vacancy.id, Boolean(force));
      if (data && data.status !== 'queued') {
        setCompatibility(data);
      }
    } catch (err) {
      setCompatError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzingCompatibility(false);
    }
  };

  return {
    historyList,
    compatibility,
    loadingCompatibility,
    analyzingCompatibility,
    compatError,
    handleSaveHistoryComment: (id: string | number, text: string) =>
      patchHistoryComment(id, text.trim() || null),
    handleDeleteHistoryComment: (id: string | number) => patchHistoryComment(id, null),
    handleRunCompatibility,
  };
}

function useMetaFieldSaveHandlers(
  vacancy: Vacancy | null,
  draft: VacancyDraft,
  setDraft: React.Dispatch<React.SetStateAction<VacancyDraft>>,
  onUpdate: (updated: Vacancy) => void
) {
  const [savingSalary, setSavingSalary] = useState(false);
  const [savedSalarySuccess, setSavedSalarySuccess] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    if (!vacancy) return;
    setDraft((prev) => ({ ...prev, status: newStatus }));
    trackEvent(EVENTS.VACANCY_STATUS_CHANGE, {
      vacancy_id: vacancy.id,
      from_status: vacancy.status,
      to_status: newStatus,
      method: 'modal_button',
    });
    try {
      const updated = await patchVacancyFields(vacancy.id, { status: newStatus });
      onUpdate(updated || { ...vacancy, status: newStatus });
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleWorkplaceTypeChange = async (newType: string) => {
    if (!vacancy) return;
    const val = newType || undefined;
    setDraft((prev) => ({ ...prev, workplaceType: val || '' }));
    try {
      await patchVacancyFields(vacancy.id, { workplace_type: val ?? null });
      onUpdate({ ...vacancy, workplace_type: val });
    } catch (err) {
      console.error('Failed to update workplace type', err);
    }
  };

  const handleToggleClosed = async () => {
    if (!vacancy) return;
    const nextVal = !draft.isClosed;
    setDraft((prev) => ({ ...prev, isClosed: nextVal }));
    try {
      await patchVacancyFields(vacancy.id, { is_closed: nextVal });
      onUpdate({ ...vacancy, is_closed: nextVal });
    } catch (err) {
      console.error('Failed to update closed status', err);
    }
  };

  const handleSaveSalary = async (salaryData: SalaryFormPayload) => {
    if (!vacancy) return;
    setSavingSalary(true);
    try {
      const sMin = salaryData.min !== '' ? parseFloat(String(salaryData.min)) : undefined;
      const sMax = salaryData.max !== '' ? parseFloat(String(salaryData.max)) : undefined;
      const sCurr = salaryData.currency || undefined;
      const sPeriod = salaryData.period || undefined;

      const patchPayload = {
        salary_min: sMin ?? null,
        salary_max: sMax ?? null,
        salary_currency: sCurr ?? null,
        salary_period: sPeriod ?? null,
      };
      setDraft((prev) => ({
        ...prev,
        salaryMin: salaryData.min,
        salaryMax: salaryData.max,
        salaryCurrency: salaryData.currency,
        salaryPeriod: salaryData.period,
      }));
      await patchVacancyFields(vacancy.id, patchPayload);
      onUpdate({
        ...vacancy,
        salary_min: sMin,
        salary_max: sMax,
        salary_currency: sCurr,
        salary_period: sPeriod,
      });
      setSavedSalarySuccess(true);
      setTimeout(() => setSavedSalarySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save salary', err);
    } finally {
      setSavingSalary(false);
    }
  };

  return { savingSalary, savedSalarySuccess, handleStatusChange, handleWorkplaceTypeChange, handleToggleClosed, handleSaveSalary };
}

function useContentFieldSaveHandlers(
  vacancy: Vacancy | null,
  draft: VacancyDraft,
  setDraft: React.Dispatch<React.SetStateAction<VacancyDraft>>,
  onUpdate: (updated: Vacancy) => void
) {
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotesSuccess, setSavedNotesSuccess] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [savedDescSuccess, setSavedDescSuccess] = useState(false);

  const handleSaveTitle = async () => {
    if (!vacancy) return;
    try {
      const updated = await patchVacancyFields(vacancy.id, { title: draft.title });
      if (updated) onUpdate(updated);
    } catch (err) {
      console.error('Failed to save title', err);
    }
  };

  const handleSaveNotes = async (nextNotes: string) => {
    if (!vacancy) return;
    setSavingNotes(true);
    setDraft((prev) => ({ ...prev, notes: nextNotes }));
    try {
      await patchVacancyFields(vacancy.id, { notes: nextNotes });
      onUpdate({ ...vacancy, notes: nextNotes });
      setSavedNotesSuccess(true);
      setTimeout(() => setSavedNotesSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to save notes', err);
    } finally {
      setSavingNotes(false);
    }
  };

  const handleSaveDescription = async (nextDesc: string) => {
    if (!vacancy) return;
    setSavingDesc(true);
    setDraft((prev) => ({ ...prev, description: nextDesc }));
    try {
      const updated = await patchVacancyFields(vacancy.id, { description: nextDesc });
      if (updated) {
        onUpdate(updated);
        setSavedDescSuccess(true);
        setTimeout(() => setSavedDescSuccess(false), 2000);
      }
    } catch (err) {
      console.error('Failed to save description', err);
    } finally {
      setSavingDesc(false);
    }
  };

  const handleTechStackChange = async (nextTech: string[]) => {
    if (!vacancy) return;
    setDraft((prev) => ({ ...prev, techStack: nextTech }));
    try {
      const updated = await patchVacancyFields(vacancy.id, { tech_stack: nextTech });
      if (updated) onUpdate(updated);
    } catch (err) {
      console.error('Failed to update tech stack', err);
    }
  };

  const handleTagsChange = async (nextTags: string[]) => {
    if (!vacancy) return;
    setDraft((prev) => ({ ...prev, tags: nextTags }));
    try {
      const updated = await patchVacancyFields(vacancy.id, { tags: nextTags });
      if (updated) onUpdate(updated);
    } catch (err) {
      console.error('Failed to update tags', err);
    }
  };

  return { savingNotes, savedNotesSuccess, savingDesc, savedDescSuccess, handleSaveTitle, handleSaveNotes, handleSaveDescription, handleTechStackChange, handleTagsChange };
}

function useAiAndReparseActions(
  vacancy: Vacancy | null,
  locale: string,
  t: TranslateFn,
  onUpdate: (updated: Vacancy) => void
) {
  const [resummarizing, setResummarizing] = useState(false);
  const [reparsing, setReparsing] = useState(false);
  const [reparseError, setReparseError] = useState<string | null>(null);
  const [reparseSuccess, setReparseSuccess] = useState(false);

  const handleResummarize = async () => {
    if (!vacancy) return;
    setResummarizing(true);
    try {
      const updated = await vacancyService.resummarize(vacancy.id, locale);
      onUpdate(updated);
    } catch (err) {
      console.error('Failed to resummarize', err);
    } finally {
      setResummarizing(false);
    }
  };

  const handleReparse = async () => {
    if (!vacancy) return;
    setReparsing(true);
    setReparseError(null);
    setReparseSuccess(false);
    try {
      await vacancyService.reparse(vacancy.id);
      setReparseSuccess(true);
      setTimeout(() => setReparseSuccess(false), 3000);
    } catch (err) {
      setReparseError(err instanceof Error ? err.message : t('common.error'));
      setTimeout(() => setReparseError(null), 6000);
    } finally {
      setReparsing(false);
    }
  };

  return {
    resummarizing,
    reparsing,
    reparseError,
    reparseSuccess,
    handleResummarize,
    handleReparse,
  };
}

export function useVacancyModalController({
  vacancy,
  onUpdate,
  initialHistory,
  initialCompatibility,
  locale,
  t,
}: UseVacancyModalControllerArgs) {
  const [activeTab, setActiveTab] = useState('details');
  const [draft, setDraft] = useVacancyDraftState(vacancy);
  const histCompat = useHistoryAndCompatibilitySync(vacancy, initialHistory, initialCompatibility);
  const metaSaves = useMetaFieldSaveHandlers(vacancy, draft, setDraft, onUpdate);
  const contentSaves = useContentFieldSaveHandlers(vacancy, draft, setDraft, onUpdate);
  const aiReparse = useAiAndReparseActions(vacancy, locale, t, onUpdate);

  return {
    activeTab,
    setActiveTab,
    draft,
    setTitle: (title: string) => setDraft((prev) => ({ ...prev, title })),
    setNotes: (notes: string) => setDraft((prev) => ({ ...prev, notes })),
    setDescription: (description: string) => setDraft((prev) => ({ ...prev, description })),
    ...histCompat,
    ...metaSaves,
    ...contentSaves,
    ...aiReparse,
  };
}
