export const WORKPLACE_CONFIG = {
  remote: {
    label: 'Удаленка',
    className: 'remote',
    fullLabel: 'Удаленка (Remote)',
  },
  hybrid: {
    label: 'Гибрид',
    className: 'hybrid',
    fullLabel: 'Гибрид (Hybrid)',
  },
  'on-site': {
    label: 'On-site',
    className: 'onsite',
    fullLabel: 'On-site (В офисе)',
  },
};

export function getWorkplaceInfo(type, t) {
  if (!type) return null;
  const key = String(type).toLowerCase().trim();
  let baseKey = type;
  let className = 'onsite';

  if (key === 'remote' || key.includes('удален')) {
    baseKey = 'remote';
    className = 'remote';
  } else if (key === 'hybrid' || key.includes('гибрид')) {
    baseKey = 'hybrid';
    className = 'hybrid';
  } else if (key === 'on-site' || key === 'onsite' || key.includes('офис')) {
    baseKey = 'on-site';
    className = 'onsite';
  }

  const defaultConf = WORKPLACE_CONFIG[baseKey] || { label: type, fullLabel: type, className: 'onsite' };
  const label = t ? t(`workplace.${baseKey}`) : defaultConf.label;
  const fullLabelKey = baseKey === 'on-site' ? 'workplace.full_onsite' : `workplace.full_${baseKey}`;
  const fullLabel = t ? t(fullLabelKey) : defaultConf.fullLabel;

  return {
    key: baseKey,
    label,
    fullLabel,
    className,
  };
}
