import type { User } from '../types/models';
import type { CVSyncStatus, ServerCVData } from './useCVManagement';

export type { CVSyncStatus, ServerCVData };

export interface CVPageProps {
  user?: User | null;
  initialServerCV?: ServerCVData | null;
}
