'use client';

import React, { useState } from 'react';
import { Settings, Globe, Columns3 } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Tabs,
  Icon,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { STATUS_REJECTED } from '../constants/columns.consts';
import SettingsGeneralTab from './SettingsGeneralTab';
import SettingsColumnsTab from './SettingsColumnsTab';
import SettingsColumnModals from './SettingsColumnModals';
import SettingsModalFooterActions from './SettingsModalFooterActions';
import { useSettingsController } from './useSettingsController';
import type { BoardColumn, Vacancy, User } from '../types/models';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vacancies?: Vacancy[];
  onColumnsUpdated?: (columns: BoardColumn[]) => void;
  onUserUpdated?: (user: User) => void;
}

const SETTINGS_ICON = <Icon icon={Settings} size="md" tone="accent" />;
const GLOBE_ICON = <Icon icon={Globe} size="xs" />;
const COLUMNS_ICON = <Icon icon={Columns3} size="xs" />;

export default function SettingsModal({
  isOpen,
  onClose,
  vacancies = [],
  onColumnsUpdated,
}: SettingsModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [isCreateColOpen, setIsCreateColOpen] = useState(false);
  const [editingCol, setEditingCol] = useState<BoardColumn | null>(null);
  const [deletingCol, setDeletingCol] = useState<BoardColumn | null>(null);

  const ctrl = useSettingsController(isOpen, onColumnsUpdated);

  if (!isOpen) return null;

  const funnelColumns = ctrl.columnsList.filter((c) => c.id !== STATUS_REJECTED);
  const deletingVacanciesCount = deletingCol
    ? vacancies.filter((v) => v.status === deletingCol.id).length
    : 0;

  const tabItems = [
    { value: 'general', label: t('settingsModal.tab_general'), icon: GLOBE_ICON },
    { value: 'columns', label: t('settingsModal.tab_columns'), icon: COLUMNS_ICON },
  ];

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={activeTab === 'columns' ? 'lg' : 'md'}>
        <ModalHeader title={t('settingsModal.title')} icon={SETTINGS_ICON} onClose={onClose} />

        <div style={{ padding: '0 var(--ui-space-6)' }}>
          <Tabs value={activeTab} onValueChange={setActiveTab} items={tabItems} />
        </div>

        <ModalBody>
          {activeTab === 'general' ? (
            <SettingsGeneralTab
              selectedLocale={ctrl.selectedLocale}
              onSelectLocale={ctrl.setSelectedLocale}
              selectedSalaryFormat={ctrl.selectedSalaryFormat}
              onSelectSalaryFormat={ctrl.setSelectedSalaryFormat}
              selectedCurrency={ctrl.selectedCurrency}
              onSelectCurrency={ctrl.setSelectedCurrency}
              savedSuccess={ctrl.savedSuccess}
              onSubmit={ctrl.handleSaveGeneral}
            />
          ) : (
            <SettingsColumnsTab
              funnelColumns={funnelColumns}
              onOpenCreate={() => setIsCreateColOpen(true)}
              onMoveColumn={ctrl.handleMoveColumn}
              onEditColumn={setEditingCol}
              onDeleteColumn={setDeletingCol}
            />
          )}
        </ModalBody>

        <ModalFooter justify="end">
          <ModalFooter.Actions>
            <SettingsModalFooterActions
              activeTab={activeTab}
              loading={ctrl.loading}
              onClose={onClose}
            />
          </ModalFooter.Actions>
        </ModalFooter>
      </Modal>

      <SettingsColumnModals
        isCreateOpen={isCreateColOpen}
        onCloseCreate={() => setIsCreateColOpen(false)}
        onCreateColumn={ctrl.handleCreateColumn}
        editingCol={editingCol}
        onCloseEdit={() => setEditingCol(null)}
        onSaveColumn={ctrl.handleSaveColumn}
        deletingCol={deletingCol}
        onCloseDelete={() => setDeletingCol(null)}
        onDeleteColumn={ctrl.handleDeleteColumn}
        funnelColumns={funnelColumns}
        deletingVacanciesCount={deletingVacanciesCount}
      />
    </>
  );
}
