import React from 'react';
import { SearchBar } from '@blueprint/ui-kit';
import { trackEvent, EVENTS } from '../utils/analytics';
import { useTranslation } from '../i18n/I18nContext';

export interface HomeSearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
}

export default function HomeSearchBar({
  search,
  onSearchChange,
}: HomeSearchBarProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <SearchBar
      value={search}
      onValueChange={onSearchChange}
      onClear={() => {
        trackEvent(EVENTS.SEARCH_APPLIED, { query_length: 0 });
        onSearchChange('');
      }}
      placeholder={t('nav.search_placeholder')}
      expandOnFocus
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Escape') {
          e.currentTarget.blur();
        }
      }}
    />
  );
}
