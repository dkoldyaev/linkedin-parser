import { Badge, Button, Icon, Text } from '@blueprint/ui-kit';
import { getTaskIdentifier, getTaskLabel } from './useQueueTasks';
import type { QueueTask } from '../types/models';
import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export interface QueueTaskRowProps {
  task: QueueTask;
  onCancel: (id: string | number) => void;
}

const ITEM_CONTAINER_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'var(--ui-space-3)',
  background: 'var(--ui-bg-subtle)',
  border: '1px solid var(--ui-border-subtle)',
};

const TEXT_TRUNCATE_STYLE: React.CSSProperties = {
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const BADGES_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--ui-space-2)',
  marginTop: 'var(--ui-space-1)',
};

export default function QueueTaskRow({ task, onCancel }: QueueTaskRowProps): React.ReactElement {
  const { t } = useTranslation();
  const id = getTaskIdentifier(task);
  const cancelLabel = t('queueModal.cancel_task');

  return (
    <li style={ITEM_CONTAINER_STYLE}>
      <div style={{ overflow: 'hidden', marginRight: 'var(--ui-space-4)' }}>
        <Text variant="body" weight="medium" style={TEXT_TRUNCATE_STYLE} title={task.url}>
          {getTaskLabel(task)}
        </Text>
        <div style={BADGES_ROW_STYLE}>
          <Badge variant="outline" size="xs" tone="neutral">
            {t('queueModal.task_status', { status: task.status })}
          </Badge>
          {task.stage && (
            <Badge variant="outline" size="xs" tone="info">
              {t('queueModal.task_stage', { stage: task.stage })}
            </Badge>
          )}
        </div>
      </div>
      <Button
        variant="secondary"
        tone="danger"
        size="icon-sm"
        title={cancelLabel}
        aria-label={cancelLabel}
        onClick={() => onCancel(id)}
      >
        <Icon icon={Trash2} size="sm" />
      </Button>
    </li>
  );
}
