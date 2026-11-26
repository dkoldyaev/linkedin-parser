import { Button, Icon } from '@blueprint/ui-kit';
import { List, Plus, RefreshCw } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export interface HomePrimaryActionsProps {
  onRefresh: () => void;
  queueRemaining?: number;
  onOpenQueue: () => void;
  onAddVacanciesClick: () => void;
}

const REFRESH_ICON = <Icon icon={RefreshCw} size="xs" />;
const LIST_ICON = <Icon icon={List} size="xs" />;
const PLUS_ICON = <Icon icon={Plus} size="xs" />;

export default function HomePrimaryActions({
  onRefresh,
  queueRemaining,
  onOpenQueue,
  onAddVacanciesClick,
}: HomePrimaryActionsProps): React.ReactElement {
  const { t } = useTranslation();
  const hasQueue = Boolean(queueRemaining && queueRemaining > 0);

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={onRefresh}
        title={t('nav.refresh_board')}
        aria-label={t('nav.refresh_board')}
      >
        {REFRESH_ICON}
      </Button>

      {hasQueue && (
        <Button variant="secondary" size="sm" onClick={onOpenQueue} startIcon={LIST_ICON}>
          {t('nav.queue')} [{queueRemaining}]
        </Button>
      )}

      <Button variant="primary" size="sm" onClick={onAddVacanciesClick} startIcon={PLUS_ICON}>
        {t('nav.add_vacancies')}
      </Button>
    </>
  );
}
