import { Building, Home, Layers, LucideIcon } from "lucide-react";

export interface WorkplaceTypeConfig {
  label: string;
  className: string;
  fullLabel: string;
  icon: LucideIcon;
}

export interface WorkplaceInfo extends WorkplaceTypeConfig {
  key: string;
}

export type TranslateFn = (key: string, params?: Record<string, string | number>) => string;

export const WORKPLACE_CONFIG: Record<string, WorkplaceTypeConfig> = {
  remote: {
    label: 'Удаленка',
    className: 'remote',
    fullLabel: 'Удаленка (Remote)',
    icon: Home,
  },
  hybrid: {
    label: 'Гибрид',
    className: 'hybrid',
    fullLabel: 'Гибрид (Hybrid)',
    icon: Layers,
  },
  'on-site': {
    label: 'On-site',
    className: 'onsite',
    fullLabel: 'On-site (В офисе)',
    icon: Building,
  },
};

const WORKPLACE_MATCHERS: Array<{
  test: (key: string) => boolean;
  result: { baseKey: string; className: string };
}> = [
  {
    test: (key) => key === 'remote' || key.includes('удален'),
    result: { baseKey: 'remote', className: 'remote' },
  },
  {
    test: (key) => key === 'hybrid' || key.includes('гибрид'),
    result: { baseKey: 'hybrid', className: 'hybrid' },
  },
  {
    test: (key) => key === 'on-site' || key === 'onsite' || key.includes('офис'),
    result: { baseKey: 'on-site', className: 'onsite' },
  },
];

function resolveBaseKeyAndClass(rawType: string): { baseKey: string; className: string } {
  const key = String(rawType).toLowerCase().trim();
  const matched = WORKPLACE_MATCHERS.find((m) => m.test(key));
  return matched ? matched.result : { baseKey: rawType, className: 'onsite' };
}

export function getWorkplaceInfo(type?: string | null, t?: TranslateFn): WorkplaceInfo | null {
  if (!type) return null;
  const { baseKey, className } = resolveBaseKeyAndClass(type);
  const defaultConf: WorkplaceTypeConfig = WORKPLACE_CONFIG[baseKey] || {
    label: type,
    fullLabel: type,
    className: 'onsite',
    icon: Building,
  };
  const label = t ? t(`workplace.${baseKey}`) : defaultConf.label;
  const fullLabelKey = baseKey === 'on-site' ? 'workplace.full_onsite' : `workplace.full_${baseKey}`;
  const fullLabel = t ? t(fullLabelKey) : defaultConf.fullLabel;

  return {
    key: baseKey,
    label,
    fullLabel,
    className,
    icon: defaultConf.icon,
  };
}
