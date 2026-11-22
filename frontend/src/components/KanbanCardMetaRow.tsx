import React from 'react';
import {
  Award,
  Banknote,
  Building2,
  Globe,
  Home,
  MapPin,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Icon, Text } from '@blueprint/ui-kit';
import { resolveScoreTone } from './kanbanCardHelpers';
import type { WorkplaceInfo } from '../utils/workplace';
import type { SalaryDisplayInfo } from '../utils/salary';
import styles from './KanbanCard.module.css';

export interface KanbanCardMetaRowProps {
  matchScore?: number;
  workplaceInfo: WorkplaceInfo | null;
  location?: string;
  salaryInfo: SalaryDisplayInfo;
}

const WORKPLACE_CONFIG_BY_KEY: Record<
  string,
  { icon: LucideIcon; tone: 'accent' | 'warning' | 'secondary' }
> = {
  remote: { icon: Globe, tone: 'accent' },
  hybrid: { icon: Home, tone: 'warning' },
};

const DEFAULT_ONSITE_CONFIG = {
  icon: Building2,
  tone: 'secondary' as const,
};

function resolveWorkplaceVisuals(workplaceInfo: WorkplaceInfo | null) {
  const rawKey = String(workplaceInfo?.key || 'remote').toLowerCase();
  const entry = WORKPLACE_CONFIG_BY_KEY[rawKey] || DEFAULT_ONSITE_CONFIG;
  const label = rawKey === 'remote' ? 'Remote' : workplaceInfo?.label || 'Remote';

  return {
    icon: entry.icon,
    tone: entry.tone,
    label,
  };
}

const AWARD_ICON = <Icon icon={Award} size="2xs" />;
const PIN_ICON = <Icon icon={MapPin} size="xs" />;
const BANKNOTE_ICON = <Icon icon={Banknote} size="xs" />;

export default function KanbanCardMetaRow({
  matchScore,
  workplaceInfo,
  location,
  salaryInfo,
}: KanbanCardMetaRowProps): React.ReactElement {
  const wp = resolveWorkplaceVisuals(workplaceInfo);
  const scoreTone = resolveScoreTone(matchScore);

  return (
    <div className={styles.metaRow}>
      {matchScore !== undefined && (
        <Badge variant="solid" size="xs" tone={scoreTone} icon={AWARD_ICON}>
          {matchScore}%
        </Badge>
      )}
      <Text variant="caption" tone={wp.tone} startIcon={<Icon icon={wp.icon} size="xs" />}>
        {wp.label}
      </Text>
      {location !== undefined && (
        <Text variant="caption" tone="secondary" startIcon={PIN_ICON}>
          {location}
        </Text>
      )}
      {salaryInfo.hasSalary && (
        <Text variant="mono" tone="success" startIcon={BANKNOTE_ICON}>
          {salaryInfo.formatted}
        </Text>
      )}
    </div>
  );
}
