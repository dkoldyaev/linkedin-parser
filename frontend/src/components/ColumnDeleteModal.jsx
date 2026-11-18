import React, { useState } from 'react';
import { Trash2, ArrowRight } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  Paragraph,
  Text,
  Select,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { STATUS_NOT_CONTACTED } from '../constants/columns';

export default function ColumnDeleteModal({
  isOpen,
  onClose,
  column,
  availableColumns = [],
  vacanciesCount = 0,
  onConfirm,
}) {
  const { t } = useTranslation();
  const [targetColumn, setTargetColumn] = useState(STATUS_NOT_CONTACTED);

  if (!isOpen || !column) return null;

  const validTargets = availableColumns
    .filter((c) => c.id !== column.id)
    .map((col) => ({
      value: col.id,
      label: t(`kanban.columns.${col.id}`),
    }));

  const handleConfirm = () => {
    onConfirm(column.id, targetColumn);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title={t('kanban.delete_column_confirm_title', {
          name: t(`kanban.columns.${column.id}`),
        })}
        icon={<Icon icon={Trash2} size="md" tone="danger" />}
        onClose={onClose}
      />

      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
          {vacanciesCount > 0 ? (
            <>
              <Paragraph variant="body" tone="secondary">
                {t('kanban.delete_column_has_vacancies', { count: vacanciesCount })}
              </Paragraph>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1-5)' }}>
                <Text
                  variant="caption"
                  weight="medium"
                  startIcon={<Icon icon={ArrowRight} size="xs" tone="accent" />}
                >
                  {t('kanban.migrate_to_label')}
                </Text>
                <Select
                  value={targetColumn}
                  onValueChange={setTargetColumn}
                  options={validTargets}
                  ariaLabel={t('kanban.migrate_to_label')}
                />
              </div>
            </>
          ) : (
            <Paragraph variant="body" tone="secondary">
              {t('kanban.delete_column_confirm_empty')}
            </Paragraph>
          )}
        </div>
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={onClose}>
            {t('batchModal.cancel_btn')}
          </Button>
          <Button variant="danger" onClick={handleConfirm}>
            {t('kanban.delete_column')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </Modal>
  );
}
