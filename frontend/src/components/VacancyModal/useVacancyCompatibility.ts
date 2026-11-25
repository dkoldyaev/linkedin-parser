import { useState, useEffect, useCallback } from 'react';
import { vacancyService } from '../../services/vacancyService';
import type { Vacancy, CompatibilityAnalysis } from '../../types/models';
import type { TranslateFn } from '../../i18n/I18nContext';

function resolveCompatErrorMessage(err: unknown, t: TranslateFn | undefined): string {
  if (err instanceof Error) return err.message;
  if (t) return t('vacancyModal.compat_error_unknown');
  return 'Error';
}

export function useVacancyCompatibility(
  vacancy: Vacancy | null,
  isOpen: boolean,
  t: TranslateFn | undefined
) {
  const [compatibility, setCompatibility] = useState<CompatibilityAnalysis | null>(null);
  const [analyzingCompatibility, setAnalyzingCompatibility] = useState(false);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [compatError, setCompatError] = useState<string | null>(null);
  const vacancyId = vacancy?.id;

  useEffect(() => {
    if (!isOpen || !vacancyId) {
      return undefined;
    }

    let cancelled = false;
    setCompatibility(null);
    setCompatError(null);
    setLoadingCompatibility(true);

    vacancyService
      .getCompatibility(vacancyId)
      .then((res) => {
        if (!cancelled) setCompatibility(res);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingCompatibility(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, vacancyId]);

  const handleRunCompatibility = useCallback(
    async (hasExistingSections: boolean) => {
      if (!vacancyId) return;
      setAnalyzingCompatibility(true);
      setCompatError(null);
      try {
        const result = await vacancyService.triggerCompatibility(vacancyId, hasExistingSections);
        setCompatibility(result);
      } catch (err) {
        setCompatError(resolveCompatErrorMessage(err, t));
      } finally {
        setAnalyzingCompatibility(false);
      }
    },
    [vacancyId, t]
  );

  return {
    compatibility: isOpen && vacancyId ? compatibility : null,
    analyzingCompatibility,
    loadingCompatibility: isOpen && Boolean(vacancyId) && loadingCompatibility,
    compatError,
    handleRunCompatibility,
  };
}
