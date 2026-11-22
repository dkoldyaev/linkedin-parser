import React from 'react';
import { Check } from 'lucide-react';
import { Text, Badge, Checkbox, Button, Icon } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import type { User } from '../types/models';
import type { AvailableFeatureFlag } from './userManagement.types';

export interface UserManagementRowProps {
  user: User;
  availableFlags: AvailableFeatureFlag[];
  currentFlags: string[];
  isSaving: boolean;
  onToggleFlag: (userId: number, flagKey: string) => void;
  onSaveFlags: (user: User) => void;
}

const CHECK_ICON = <Icon icon={Check} size="xs" />;

export default function UserManagementRow({
  user,
  availableFlags,
  currentFlags,
  isSaving,
  onToggleFlag,
  onSaveFlags,
}: UserManagementRowProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <tr style={{ borderBottom: '1px solid var(--ui-border-subtle)' }}>
      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
          <Text variant="body" weight="medium" tone="primary">
            {user.name || '—'}
          </Text>
          {user.is_anonymous && (
            <Badge variant="outline" size="xs" tone="neutral">
              {t('common.guest') || 'guest'}
            </Badge>
          )}
        </div>
      </td>

      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)' }}>
        <Text variant="caption" tone="secondary">
          {user.email || '—'}
        </Text>
      </td>

      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--ui-space-3)' }}>
          {availableFlags.map((flag) => {
            const isChecked = currentFlags.includes(flag.key);
            return (
              <label
                key={flag.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--ui-space-2)',
                  cursor: 'pointer',
                }}
              >
                <Checkbox
                  checked={isChecked}
                  onChange={() => onToggleFlag(user.id, flag.key)}
                />
                <Badge
                  variant={isChecked ? 'solid' : 'outline'}
                  tone={isChecked ? 'accent' : 'neutral'}
                  size="xs"
                >
                  {flag.key}
                </Badge>
              </label>
            );
          })}
        </div>
      </td>

      <td style={{ padding: 'var(--ui-space-3) var(--ui-space-4)', textAlign: 'right' }}>
        <Button
          variant="secondary"
          size="sm"
          disabled={isSaving}
          loading={isSaving}
          onClick={() => onSaveFlags(user)}
          startIcon={CHECK_ICON}
        >
          {t('settingsModal.save_btn')}
        </Button>
      </td>
    </tr>
  );
}
