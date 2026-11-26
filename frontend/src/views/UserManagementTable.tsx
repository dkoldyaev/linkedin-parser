import { Table, Text } from '@blueprint/ui-kit';
import React from 'react';
import UserManagementRow from './UserManagementRow';
import type { UserManagementTableProps } from './userManagement.types';
import { useTranslation } from '../i18n/I18nContext';

export type { UserManagementTableProps };

const TH_STYLE: React.CSSProperties = {
  padding: 'var(--ui-space-3) var(--ui-space-4)',
  fontFamily: 'var(--ui-font-mono)',
  fontSize: 'var(--ui-font-size-xs)',
  textTransform: 'uppercase',
  color: 'var(--ui-text-secondary)',
};

export default function UserManagementTable(props: UserManagementTableProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div
      style={{
        overflowX: 'auto',
        border: '1px solid var(--ui-border-subtle)',
        background: 'var(--ui-bg-surface)',
      }}
    >
      <Table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr
            style={{
              borderBottom: '1px solid var(--ui-border-subtle)',
              background: 'var(--ui-bg-subtle)',
            }}
          >
            <th style={TH_STYLE}>{t('pages.userManagement.th_user')}</th>
            <th style={TH_STYLE}>{t('pages.userManagement.th_email')}</th>
            <th style={TH_STYLE}>{t('pages.userManagement.th_flags')}</th>
            <th style={{ ...TH_STYLE, textAlign: 'right' }}>
              {t('pages.userManagement.th_actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {props.users.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ padding: 'var(--ui-space-8)', textAlign: 'center' }}>
                <Text variant="body" tone="secondary">
                  {t('pages.userManagement.no_users_found')}
                </Text>
              </td>
            </tr>
          ) : (
            props.users.map((u) => (
              <UserManagementRow
                key={u.id}
                user={u}
                availableFlags={props.availableFlags}
                currentFlags={props.editingFlags[u.id] || []}
                isSaving={props.savingUserId === u.id}
                onToggleFlag={props.onToggleFlag}
                onSaveFlags={props.onSaveFlags}
              />
            ))
          )}
        </tbody>
      </Table>
    </div>
  );
}
