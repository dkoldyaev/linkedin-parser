import React, { PropsWithChildren } from 'react';
import { Icon, Section } from '@blueprint/ui-kit';
import { LucideIcon } from 'lucide-react';
import { SaveButton } from './SaveButton';
import type { SaveStatus } from './useSave';

export interface VacancySectionProps {
  title: string;
  icon: LucideIcon;
  accessory?: React.ReactNode;
  badge?: React.ReactNode;
  onSave?: () => void;
  saveStatus?: SaveStatus;
}

export function VacancySection({
  title,
  icon,
  accessory,
  badge,
  onSave,
  saveStatus,
  children,
}: PropsWithChildren<VacancySectionProps>) {
  const resolvedAccessory = onSave ? (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {accessory}
      <SaveButton status={saveStatus} onClick={onSave} />
    </div>
  ) : accessory;

  return (
    <Section>
      <Section.Header
        title={title}
        icon={<Icon icon={icon} size="xs" />}
        accessory={resolvedAccessory}
        badge={badge}
      />
      <Section.Body padding="none">
        {children}
      </Section.Body>
    </Section>
  );
}
