'use client';

import React from 'react';
import { DashboardLayout } from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import KanbanBoard from '../components/KanbanBoard';
import HomeHeaderSection from './HomeHeaderSection';
import HomeGuestBanner from './HomeGuestBanner';
import HomeFilterSection from './HomeFilterSection';
import HomeModalsContainer from './HomeModalsContainer';
import HomeToastNotification from './HomeToastNotification';
import { useHomePageController, type HomePageControllerProps } from './useHomePageController';
import type { BoardColumn } from '../types/models';

export type HomePageProps = HomePageControllerProps;

export default function HomePage(props: HomePageProps): React.ReactElement {
  const { t, locale } = useTranslation();
  const { user, onLogout, onUserUpdated, data, modals, actions } = useHomePageController(
    props,
    t,
    locale
  );

  const handleColumnsUpdated = (newCols: BoardColumn[]) => {
    data.setColumns(newCols);
    data.fetchVacancies();
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
