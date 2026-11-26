import { type HomePageControllerProps, useHomePageController } from './useHomePageController';
import type { BoardColumn } from '../types/models';
import { DashboardLayout } from '@blueprint/ui-kit';
import HomeFilterSection from './HomeFilterSection';
import HomeGuestBanner from './HomeGuestBanner';
import HomeHeaderSection from './HomeHeaderSection';
import HomeModalsContainer from './HomeModalsContainer';
import HomeToastNotification from './HomeToastNotification';
import KanbanBoard from '../components/KanbanBoard';
import NotFoundPage from './NotFoundPage';
import React from 'react';
import { useTranslation } from '../i18n/I18nContext';

export type HomePageProps = HomePageControllerProps;

export default function HomePage(props: HomePageProps): React.ReactElement {
  const { t } = useTranslation();
  const { user, onLogout, onUserUpdated, data, modals, actions } = useHomePageController(props, t);

  if (modals.isVacancyNotFound) {
    return <NotFoundPage showHeader />;
  }

  const handleColumnsUpdated = (newCols: BoardColumn[]) => {
    data.setColumns(newCols);
    void data.fetchVacancies();
  };

  return (
    <DashboardLayout
      header={
        <HomeHeaderSection
          user={user}
          search={data.search}
          onSearchChange={data.handleSearchChange}
          queueRemaining={data.queueRemaining}
          onOpenQueue={() => modals.setIsQueueOpen(true)}
          onAddVacanciesClick={modals.handleAddVacanciesClick}
          onRefresh={actions.handleRefreshVacancies}
          hasSelectedIds={actions.selectedIds.length > 0}
          onOpenGuestAuth={() => modals.setIsGuestAuthModalOpen(true)}
          onLogout={onLogout}
          vacancies={data.vacancies}
          onColumnsUpdated={handleColumnsUpdated}
          onUserUpdated={onUserUpdated}
        />
      }
      filterBar={<HomeFilterSection data={data} actions={actions} />}
      toolbar={
        <HomeGuestBanner
          user={user}
          vacancyCount={data.vacancies.length}
          guestBannerDismissed={modals.guestBannerDismissed}
          onDismiss={modals.dismissGuestBanner}
          onOpenAuth={() => modals.setIsGuestAuthModalOpen(true)}
        />
      }
    >
      <KanbanBoard
        vacancies={data.vacancies}
        columns={data.columns}
        onColumnsChange={handleColumnsUpdated}
        onCardClick={modals.handleCardClick}
        onStatusChange={actions.handleStatusChange}
        selectedIds={actions.selectedIds}
        onToggleSelect={actions.toggleSelect}
        onStatusChangeMulti={actions.handleStatusChangeMulti}
        onReorder={actions.handleReorder}
        hiddenVacancyIds={data.hiddenVacancyIds}
      />

      <HomeModalsContainer
        modals={modals}
        data={data}
        actions={actions}
        onUserUpdated={onUserUpdated}
      />

      <HomeToastNotification toast={modals.toast} onDismiss={() => modals.setToast(null)} />
    </DashboardLayout>
  );
}
