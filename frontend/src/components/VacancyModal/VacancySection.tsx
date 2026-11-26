import {
  Icon,
  Section,
  SectionBody,
  SectionBodyProps,
  SectionHeader,
  SectionHeaderProps,
  useBlueprintGrid,
} from '@blueprint/ui-kit';
import React, { PropsWithChildren } from 'react';
import { LucideIcon } from 'lucide-react';

export interface VacancySectionProps {
  title: string;
  icon?: LucideIcon;
  accessory?: React.ReactNode;
  badge?: React.ReactNode;
  paddingBody?: SectionBodyProps['padding'];
  tone?: SectionHeaderProps['tone'];
}

export function VacancySection({
  title,
  icon,
  accessory,
  badge,
  children,
  paddingBody = 'md',
  tone,
}: PropsWithChildren<VacancySectionProps>) {
  const bodyRef = useBlueprintGrid<HTMLDivElement>({
    deps: [children],
    observeSubtree: true,
  });

  return (
    <Section>
      <SectionHeader
        title={title}
        icon={icon && <Icon icon={icon} size="xs" tone={tone} />}
        accessory={accessory}
        badge={badge}
        tone={tone}
      />
      <SectionBody ref={bodyRef} padding={paddingBody} className="bp-snap">
        {children}
      </SectionBody>
    </Section>
  );
}
