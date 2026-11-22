import { useEffect, useState } from 'react';
import type { StatsApiData } from './statsHelpers';
import { statsService } from '../services/statsService';

export function useStatsData() {
  const [data, setData] = useState<StatsApiData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    statsService
      .getStats()
      .then((d: StatsApiData) => {
        if (active) setData(d);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return { data, error };
}
