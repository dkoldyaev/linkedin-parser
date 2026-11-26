import type { CVSyncStatus, ServerCVData } from './useCVManagement';
import type { User } from '../types/models';

export type { CVSyncStatus, ServerCVData };

export interface CVPageProps {
  user?: User | null;
  initialServerCV?: ServerCVData | null;
}
