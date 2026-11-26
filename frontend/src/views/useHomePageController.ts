import type { BoardColumn, User, Vacancy } from '../types/models';
import type { TranslateFn } from '../i18n/I18nContext';
import { useAuth } from '../components/AppShell';
import { useHomeModalController } from './useHomeModalController';
import { useHomeVacanciesData } from './useHomeVacanciesData';
import { useVacancyBoardActions } from './useVacancyBoardActions';

export interface HomePageControllerProps {
  user?: User | null;
  initialVacancies?: Vacancy[];
  initialColumns?: BoardColumn[];
  onLogout?: () => void;
  onUserUpdated?: (user: User | null) => void;
}

export function useHomePageController(props: HomePageControllerProps, t: TranslateFn) {
  const auth = useAuth();
  const user = props.user !== undefined ? props.user : auth.user;
  const onLogout = props.onLogout !== undefined ? props.onLogout : auth.handleLogout;
  const onUserUpdated = props.onUserUpdated !== undefined ? props.onUserUpdated : auth.setUser;

  const data = useHomeVacanciesData({
    user,
    initialVacancies: props.initialVacancies,
    initialColumns: props.initialColumns,
  });

  const modals = useHomeModalController({
    user,
    vacancies: data.vacancies,
    setVacancies: data.setVacancies,
    toast: data.toast,
    setToast: data.setToast,
    showToast: data.showToast,
    subscribeModalEvents: data.subscribeModalEvents,
  });

  const actions = useVacancyBoardActions({
    vacancies: data.vacancies,
    setVacancies: data.setVacancies,
    columns: data.columns,
    hiddenVacancyIds: data.hiddenVacancyIds,
    onOpenVacancyPatched: modals.mergePatchedDetail,
    closeVacancyModal: modals.handleCloseVacancyModal,
    fetchVacancies: data.fetchVacancies,
    showToast: modals.showToast,
    t,
  });

  return { user, onLogout, onUserUpdated, data, modals, actions };
}
