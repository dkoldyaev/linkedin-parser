import type { User } from '../types/models';

export interface AvailableFeatureFlag {
  key: string;
  label: string;
}

export interface UserManagementTableProps {
  users: User[];
  availableFlags: AvailableFeatureFlag[];
  editingFlags: Record<number, string[]>;
  savingUserId: number | null;
  onToggleFlag: (userId: number, flagKey: string) => void;
  onSaveFlags: (user: User) => void;
}
