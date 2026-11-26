import {
  Icon,
  IconTone,
  Section,
  SectionBody,
  SectionBodyProps,
  SectionHeader,
  SectionHeaderProps,
  useBlueprintGrid,
} from '@blueprint/ui-kit';
import React, { PropsWithChildren } from 'react';
import { LucideIcon } from 'lucide-react';
import { SaveButton } from './SaveButton';
import type { SaveStatus } from './useSave';

export interface VacancySectionProps {
  title: string;
  icon?: LucideIcon;
  accessory?: React.ReactNode;
  badge?: React.ReactNode;
  onSave?: () => void;
  saveStatus?: SaveStatus;
  paddingBody?: SectionBodyProps['padding'];
  tone?: SectionHeaderProps['tone'];
}

export function VacancySection({
  title,
  icon,
  accessory,
  badge,
  onSave,
  saveStatus,
  children,
  paddingBody = 'none',
  tone,
}: PropsWithChildren<VacancySectionProps>) {
  const bodyRef = useBlueprintGrid<HTMLDivElement>({
    deps: [children],
    observeSubtree: true,
  });
  const resolvedAccessory = onSave ? (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {accessory}
      <SaveButton status={saveStatus} onClick={onSave} />
    </div>
  ) : (
    accessory
  );

  return (
    <Section>
      <SectionHeader
        title={title}
        icon={
          icon && (
            <Icon icon={icon} size="xs" tone={tone === 'mint' ? 'success' : (tone as IconTone)} />
          )
        }
        accessory={resolvedAccessory}
        badge={badge}
        tone={tone}
      />
      <SectionBody ref={bodyRef} padding={paddingBody} className="bp-snap">
        {children}
      </SectionBody>
    </Section>
  );
}
