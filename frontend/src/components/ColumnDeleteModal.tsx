import { ArrowRight, Trash2 } from 'lucide-react';
import {
  Button,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Paragraph,
  Select,
  Text,
} from '@blueprint/ui-kit';
import React, { useState } from 'react';
import type { BoardColumn } from '../types/models';
import { STATUS_NOT_CONTACTED } from '../constants/columns';
import { useTranslation } from '../i18n/I18nContext';

export interface ColumnDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  column: BoardColumn | null;
  availableColumns?: BoardColumn[];
  vacanciesCount?: number;
  onConfirm?: (columnId: string, targetColumnId: string) => void;
  onDelete?: (columnId: string, targetColumnId: string) => void;
}

function buildValidTargets(
  availableColumns: BoardColumn[],
  currentColId: string,
  t: (key: string) => string,
): Array<{ value: string; label: string }> {
  return availableColumns
    .filter((c) => c.id !== currentColId)
    .map((col) => ({
      value: col.id,
      label: t(`kanban.columns.${col.id}`),
    }));
}

const ARROW_ICON = <Icon icon={ArrowRight} size="xs" tone="accent" />;
const TRASH_ICON = <Icon icon={Trash2} size="md" tone="danger" />;

export default function ColumnDeleteModal({
  isOpen,
  onClose,
  column,
  availableColumns = [],
  vacanciesCount = 0,
  onConfirm,
  onDelete,
}: ColumnDeleteModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [targetColumn, setTargetColumn] = useState<string>(STATUS_NOT_CONTACTED);

  if (!isOpen || !column) return null;

  const validTargets = buildValidTargets(availableColumns, column.id, t);

  const handleConfirm = () => {
    const callback = onConfirm || onDelete;
    if (callback) {
      callback(column.id, targetColumn);
    }
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader
        title={t('kanban.delete_column_confirm_title', {
          name: t(`kanban.columns.${column.id}`),
        })}
        icon={TRASH_ICON}
        onClose={onClose}
      />

      <ModalBody>
        {vacanciesCount > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
            <Paragraph tone="secondary">
              {t('kanban.delete_column_has_vacancies', { count: vacanciesCount })}
            </Paragraph>
            <Text variant="caption" weight="medium" startIcon={ARROW_ICON}>
              {t('kanban.migrate_to_label')}
            </Text>
            <Select
              value={targetColumn}
              onValueChange={setTargetColumn}
              options={validTargets}
              ariaLabel={t('kanban.migrate_to_label')}
            />
          </div>
        ) : (
          <Paragraph tone="secondary">{t('kanban.delete_column_confirm_empty')}</Paragraph>
        )}
      </ModalBody>

      <ModalFooter justify="end">
        <ModalFooter.Actions>
          <Button variant="secondary" onClick={onClose}>
            {t('batchModal.cancel_btn')}
          </Button>
          <Button variant="secondary" tone="danger" onClick={handleConfirm}>
            {t('kanban.delete_column')}
          </Button>
        </ModalFooter.Actions>
      </ModalFooter>
    </Modal>
  );
}
