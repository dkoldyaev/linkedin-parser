import React from 'react';
import { FilterBar } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { buildFilterSelects, hasAnyActiveFilter } from './homeFilterHelpers';
import HomeMoveClosedButton from './HomeMoveClosedButton';
import type { useHomeVacanciesData } from './useHomeVacanciesData';
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
      onCityChange: data.setSelectedCity,
      onWorkplaceChange: data.setSelectedWorkplaceType,
      onSourceChange: data.setSelectedSource,
      onClosedChange: data.setSelectedClosed,
    },
    t
  );

  const nonRejectedCount = data.vacancies.filter((v) => v.is_closed && v.status !== 'rejected').length;

  return (
    <FilterBar
      selects={filterSelects}
      tags={data.allTags.map((tag) => ({ label: tag }))}
      selectedTags={data.selectedTag ? [data.selectedTag] : []}
      onToggleTag={(tag: string) => {
        const next = data.selectedTag === tag ? '' : tag;
        trackEvent(EVENTS.FILTER_TAG, { tag: next || 'all' });
        data.setSelectedTag(next);
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
