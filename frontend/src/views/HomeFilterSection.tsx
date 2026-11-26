import { buildFilterSelects, hasAnyActiveFilter } from './homeFilterHelpers';
import { EVENTS, trackEvent } from '../utils/analytics';
import { FilterBar } from '@blueprint/ui-kit';
import HomeMoveClosedButton from './HomeMoveClosedButton';
import React from 'react';
import { resolveRejectedStatusId } from '../components/kanbanCardHelpers';
import type { useHomeVacanciesData } from './useHomeVacanciesData';
import { useTranslation } from '../i18n/I18nContext';
import type { useVacancyBoardActions } from './useVacancyBoardActions';

export interface HomeFilterSectionProps {
  data: ReturnType<typeof useHomeVacanciesData>;
  actions: ReturnType<typeof useVacancyBoardActions>;
}

export default function HomeFilterSection({
  data,
  actions,
}: HomeFilterSectionProps): React.ReactElement {
  const { t } = useTranslation();
  const filterSelects = buildFilterSelects(
    data.filters,
    {
      allTags: data.allTags,
      allCountries: data.allCountries,
      allCities: data.allCities,
      allSources: data.allSources,
    },
    {
      onCountryChange: data.handleCountryChange,
      onCityChange: data.handleCityChange,
      onWorkplaceChange: data.handleWorkplaceChange,
      onSourceChange: data.handleSourceChange,
      onClosedChange: data.handleClosedChange,
    },
    t,
  );

  const rejectedStatusId = resolveRejectedStatusId(data.columns);
  const nonRejectedCount = data.vacancies.filter(
    (v) =>
      Boolean(v.is_closed) && v.status !== rejectedStatusId && !data.hiddenVacancyIds.has(v.id),
  ).length;

  return (
    <FilterBar
      selects={filterSelects}
      tags={data.allTags.map((tag) => ({ label: tag }))}
      selectedTags={data.selectedTag ? [data.selectedTag] : []}
      onToggleTag={(tag: string) => {
        const next = data.selectedTag === tag ? '' : tag;
        trackEvent(EVENTS.FILTER_TAG, { tag: next ? next : 'all' });
        data.handleTagChange(next);
      }}
      tagPrefix="#"
      hasActiveFilters={hasAnyActiveFilter(data.filters)}
      onReset={data.resetAllFilters}
      resetLabel={t('nav.reset_filters')}
      actionsSlot={
        <HomeMoveClosedButton
          selectedClosed={data.selectedClosed}
          nonRejectedClosedCount={nonRejectedCount}
          isMovingAllRejected={actions.isMovingAllRejected}
          onMoveAllClosedToRejected={actions.handleMoveAllClosedToRejected}
        />
      }
    />
  );
}
