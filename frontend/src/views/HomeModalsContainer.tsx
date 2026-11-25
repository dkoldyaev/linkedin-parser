import React from 'react';
import BatchImportModal from '../components/BatchImportModal';
import QueueModal from '../components/QueueModal';
import LoginModal from '../components/LoginModal';
import type { useHomeVacanciesData } from './useHomeVacanciesData';
import type { useHomeModalController } from './useHomeModalController';
import type { useVacancyBoardActions } from './useVacancyBoardActions';
import type { User } from '../types/models';
import VacancyModal from '../components/VacancyModal/VacancyModal';

export interface HomeModalsContainerProps {
  modals: ReturnType<typeof useHomeModalController>;
  data: ReturnType<typeof useHomeVacanciesData>;
  actions: ReturnType<typeof useVacancyBoardActions>;
  onUserUpdated?: (user: User) => void;
}

export default function HomeModalsContainer({
  modals,
  data,
  actions,
  onUserUpdated,
}: HomeModalsContainerProps): React.ReactElement {
  return (
    <>
      <BatchImportModal
        isOpen={modals.isBatchOpen}
        onClose={() => modals.setIsBatchOpen(false)}
        queueRemaining={data.queueRemaining}
        onImportComplete={actions.handleImportComplete}
      />

      <VacancyModal
        vacancy={modals.selectedVacancy}
        isOpen={modals.isVacancyModalOpen}
        loadingDetails={modals.loadingVacancyDetails}
        columns={data.columns}
        onClose={modals.handleCloseVacancyModal}
        onUpdate={actions.handleVacancyUpdate}
        onDelete={actions.handleVacancyDelete}
      />

      <QueueModal
        isOpen={modals.isQueueOpen}
        onClose={() => modals.setIsQueueOpen(false)}
        queueRemaining={data.queueRemaining}
        onRefreshQueue={data.fetchQueueStatus}
      />

      {modals.isGuestAuthModalOpen && (
        <LoginModal
          isOpen={modals.isGuestAuthModalOpen}
          onClose={() => modals.setIsGuestAuthModalOpen(false)}
          onLoginSuccess={(updatedUser) => {
            modals.setIsGuestAuthModalOpen(false);
            onUserUpdated?.(updatedUser);
          }}
          isGuestPromotion
        />
      )}
    </>
  );
}
