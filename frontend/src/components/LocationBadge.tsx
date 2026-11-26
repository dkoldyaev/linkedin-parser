import { Icon, Text } from '@blueprint/ui-kit';
import { MapPin } from 'lucide-react';
import React from 'react';

export interface LocationBadgeProps {
  location?: string | null;
}

export function LocationBadge({ location }: LocationBadgeProps): React.ReactElement | null {
  if (!location) return null;

  return (
    <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
      {location}
    </Text>
  );
}
