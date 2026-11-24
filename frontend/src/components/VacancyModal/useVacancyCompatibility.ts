import { useState, useEffect, useCallback } from 'react';
import { vacancyService } from '../../services/vacancyService';
import type { Vacancy, CompatibilityAnalysis } from '../../types/models';
import type { TranslateFn } from '../../i18n/I18nContext';

export function useVacancyCompatibility(
  vacancy: Vacancy | null,
  initialCompatibility?: CompatibilityAnalysis | null,
  t?: TranslateFn
) {
  const [compatibility, setCompatibility] = useState<CompatibilityAnalysis | null>(
    initialCompatibility || null
  );
  const [analyzingCompatibility, setAnalyzingCompatibility] = useState(false);
  const [loadingCompatibility, setLoadingCompatibility] = useState(false);
  const [compatError, setCompatError] = useState<string | null>(null);

  useEffect(() => {
    if (!vacancy) return;
    if (initialCompatibility !== undefined) {
      setCompatibility(initialCompatibility);
      return;
    }
    if (vacancy.id) {
      setLoadingCompatibility(true);
      vacancyService
        .getCompatibility(vacancy.id)
        .then((res) => {
          setCompatibility(res);
        })
        .catch(() => {})
        .finally(() => setLoadingCompatibility(false));
    }
  }, [vacancy?.id, initialCompatibility]);

  const handleRunCompatibility = useCallback(
    async (hasExistingSections: boolean) => {
      if (!vacancy) return;
      setAnalyzingCompatibility(true);
      setCompatError(null);
      try {
        const result = await vacancyService.triggerCompatibility(vacancy.id, hasExistingSections);
        setCompatibility(result);
      } catch (err) {
        setCompatError(
          err instanceof Error
            ? err.message
            : t
            ? t('vacancyModal.compat_error_unknown')
            : 'Error'
        );
      } finally {
        setAnalyzingCompatibility(false);
      }
    },
    [vacancy?.id, t]
  );

  return {
    compatibility,
    analyzingCompatibility,
    loadingCompatibility,
    compatError,
    handleRunCompatibility,
  };
}
