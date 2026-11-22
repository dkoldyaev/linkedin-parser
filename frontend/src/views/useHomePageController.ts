import { useAuth } from '../components/AppShell';
import { useHomeVacanciesData } from './useHomeVacanciesData';
import { useHomeModalController } from './useHomeModalController';
import { useVacancyBoardActions } from './useVacancyBoardActions';
import { useMercureRealtime } from './useMercureRealtime';
import { hasAnyActiveFilter } from './homeFilterHelpers';
import type { TranslateFn } from '../i18n/I18nContext';
import type { User, Vacancy, BoardColumn, VacancyHistoryItem, CompatibilityAnalysis } from '../types/models';

export interface HomePageControllerProps {
  user?: User | null;
  initialVacancies?: Vacancy[];
  initialColumns?: BoardColumn[];
  fetchBoardInBackground?: boolean;
  initialSelectedVacancy?: Vacancy | null;
  initialVacancyHistory?: VacancyHistoryItem[];
  initialVacancyCompatibility?: CompatibilityAnalysis | null;
  onLogout?: () => void;
  onUserUpdated?: (user: User | null) => void;
}

export function useHomePageController(props: HomePageControllerProps, t: TranslateFn, locale: string) {
  const auth = useAuth();
  const user = props.user !== undefined ? props.user : auth.user;
  const onLogout = props.onLogout !== undefined ? props.onLogout : auth.handleLogout;
  const onUserUpdated = props.onUserUpdated !== undefined ? props.onUserUpdated : auth.setUser;

  const data = useHomeVacanciesData({
    user,
    initialVacancies: props.initialVacancies,
    initialColumns: props.initialColumns,
    fetchBoardInBackground: Boolean(props.fetchBoardInBackground),
  });

  const modals = useHomeModalController({
    user,
    locale,
    vacancies: data.vacancies,
    setVacancies: data.setVacancies,
    initialSelectedVacancy: props.initialSelectedVacancy,
    initialVacancyHistory: props.initialVacancyHistory,
    initialVacancyCompatibility: props.initialVacancyCompatibility,
  });

  const actions = useVacancyBoardActions({
    vacancies: data.vacancies,
    setVacancies: data.setVacancies,
    columns: data.columns,
    selectedVacancy: modals.selectedVacancy,
    setSelectedVacancy: modals.setSelectedVacancy,
    closeVacancyModal: modals.handleCloseVacancyModal,
    selectedCountry: data.selectedCountry,
    selectedClosed: data.selectedClosed,
    fetchVacancies: data.fetchVacancies,
    fetchTags: data.fetchTags,
    fetchCountries: data.fetchCountries,
    fetchCities: data.fetchCities,
    fetchSources: data.fetchSources,
    showToast: modals.showToast,
    t,
  });

  useMercureRealtime(user, {
    fetchTags: data.fetchTags,
    fetchVacancies: data.fetchVacancies,
    fetchColumns: data.fetchColumns,
    fetchCountries: data.fetchCountries,
    fetchCities: data.fetchCities,
    fetchSources: data.fetchSources,
    selectedCountry: data.selectedCountry,
    selectedClosed: data.selectedClosed,
    hasFilters: hasAnyActiveFilter(data.filters),
    fetchQueueStatus: data.fetchQueueStatus,
    showToast: modals.showToast,
    t,
    setVacancies: data.setVacancies,
    setSelectedVacancy: modals.setSelectedVacancy,
    setSelectedIds: actions.setSelectedIds,
    setQueueRemaining: data.setQueueRemaining,
  });

  return { user, onLogout, onUserUpdated, data, modals, actions };
}
