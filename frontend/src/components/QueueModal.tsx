import {
  AlertBanner,
  EmptyState,
  Icon,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from '@blueprint/ui-kit';
import { getTaskIdentifier, useQueueTasks } from './useQueueTasks';
import { List } from 'lucide-react';
import QueueTaskRow from './QueueTaskRow';
import React from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { useTranslation } from '../i18n/I18nContext';

export interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueRemaining?: number;
  onRefreshQueue?: () => void;
}

const LIST_CONTAINER_STYLE: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--ui-space-3)',
};

const QUEUE_ICON = <Icon icon={List} size="md" tone="accent" />;

export default function QueueModal({
  isOpen,
  onClose,
  queueRemaining,
  onRefreshQueue,
}: QueueModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [parent] = useAutoAnimate<HTMLUListElement>();
  const { tasks, loading, error, handleCancelTask } = useQueueTasks(
    isOpen,
    queueRemaining,
    onRefreshQueue,
  );

  if (!isOpen) return null;

  let queueBody: React.ReactNode = (
    <ul ref={parent} style={LIST_CONTAINER_STYLE}>
      {tasks.map((task) => (
        <QueueTaskRow key={getTaskIdentifier(task)} task={task} onCancel={handleCancelTask} />
      ))}
    </ul>
  );

  if (loading) {
    queueBody = (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ui-space-8)' }}>
        <Spinner size="lg" />
      </div>
    );
  } else if (error) {
    queueBody = <AlertBanner tone="danger" title={error} />;
  } else if (tasks.length === 0) {
    queueBody = (
      <EmptyState title={t('queueModal.empty_title')} description={t('queueModal.empty_desc')} />
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title={t('queueModal.title')} icon={QUEUE_ICON} onClose={onClose} />

      <ModalBody>{queueBody}</ModalBody>
    </Modal>
  );
}
