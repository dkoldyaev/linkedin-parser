import React from 'react';
import { Button, Icon, Modal } from '@blueprint/ui-kit';
import { Trash2, XCircle } from 'lucide-react';
import { useTranslation } from '../../i18n/I18nContext';

export interface VacancyModalFooterProps {
  onClose: () => void;
  onReject?: () => void;
  onDelete?: () => void;
}

export function VacancyModalFooter({
  onClose,
  onReject,
  onDelete,
}: VacancyModalFooterProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Modal.Footer justify="between">
      <div>
        {onReject && (
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            startIcon={<Icon icon={XCircle} size="xs" />}
            onClick={onReject}
          >
            {t('vacancyModal.reject_btn')}
          </Button>
        )}
      </div>

      <Modal.Footer.Actions>
        {onDelete && (
          <Button
            variant="ghost"
            tone="danger"
            size="sm"
            startIcon={<Icon icon={Trash2} size="xs" />}
            onClick={onDelete}
          >
            {t('vacancyModal.delete_btn')}
          </Button>
        )}
        <Button variant="secondary" size="sm" onClick={onClose}>
          {t('vacancyModal.close_btn')}
        </Button>
      </Modal.Footer.Actions>
    </Modal.Footer>
  );
}
