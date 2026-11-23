import React from 'react';
import { Icon, Text } from '@blueprint/ui-kit';
import { WORKPLACE_CONFIG } from '../utils/workplace';
import { useTranslation } from '../i18n/I18nContext';
import { Vacancy } from '../types/models';

export interface WorkplaceBadgeProps {
  workplaceType?: Vacancy['workplace_type'];
}

export function WorkplaceBadge({ workplaceType }: WorkplaceBadgeProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!workplaceType) return null;

  const config = WORKPLACE_CONFIG[workplaceType];
  const label = config?.fullLabel || config?.label || workplaceType;
  const icon = config?.icon;

  return (
    <Text
      variant="caption"
      tone="accent"
      startIcon={icon ? <Icon icon={icon} size="xs" /> : undefined}
    >
      {label || t('vacancyModal.not_specified')}
    </Text>
  );
}
