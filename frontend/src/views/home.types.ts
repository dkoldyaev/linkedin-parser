import type { User, Vacancy, BoardColumn } from '../types/models';

export interface HomePageProps {
  initialUser?: User | null;
  initialVacancies?: Vacancy[];
  initialColumns?: BoardColumn[];
  onLogout?: () => void;
  onUserUpdated?: (user: User | null) => void;
}

export interface ToastState {
  type: 'error' | 'success';
  message: string;
}
