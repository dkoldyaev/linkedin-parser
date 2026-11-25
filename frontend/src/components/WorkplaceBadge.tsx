import React from 'react';
import { Icon, Text } from '@blueprint/ui-kit';
import { getWorkplaceInfo } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { Vacancy } from '../types/models';

export interface WorkplaceBadgeProps {
  workplaceType?: Vacancy['workplace_type'];
}

export function WorkplaceBadge({ workplaceType }: WorkplaceBadgeProps): React.ReactElement | null {
  const { t } = useTranslation();
  const info = getWorkplaceInfo(workplaceType, t);
  if (!info) return null;

  return (
    <Text
      variant="caption"
      tone="accent"
      startIcon={<Icon icon={info.icon} size="xs" />}
    >
      {info.fullLabel}
    </Text>
  );
}
