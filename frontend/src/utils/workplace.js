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

export function getWorkplaceInfo(type) {
  if (!type) return null;
  const key = String(type).toLowerCase().trim();
  if (key === 'remote' || key.includes('удален')) {
    return { key: 'remote', ...WORKPLACE_CONFIG.remote };
  }
  if (key === 'hybrid' || key.includes('гибрид')) {
    return { key: 'hybrid', ...WORKPLACE_CONFIG.hybrid };
  }
  if (key === 'on-site' || key === 'onsite' || key.includes('офис')) {
    return { key: 'on-site', ...WORKPLACE_CONFIG['on-site'] };
  }
  return {
    key: type,
    label: type,
    fullLabel: type,
    className: 'onsite',
  };
}
