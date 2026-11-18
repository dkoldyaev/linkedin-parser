import React, { useState, useEffect } from 'react';
import { Trash2, AlertCircle, List } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  Button,
  Icon,
  Spinner,
  EmptyState,
  AlertBanner,
  Text,
  Badge,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function QueueModal({ isOpen, onClose, queueRemaining, onRefreshQueue }) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parent] = useAutoAnimate();

  useEffect(() => {
    if (isOpen) {
      if (tasks.length === 0) {
        setLoading(true);
      }
      fetchTasks();
      onRefreshQueue?.();
    } else {
      setTasks([]);
      setError('');
      setLoading(false);
    }
  }, [isOpen, queueRemaining]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/queue/tasks');
      if (!res.ok) throw new Error('Failed to fetch queue tasks');
      const data = await res.json();
      setTasks(data);
      if (data.length === 0 && queueRemaining > 0) {
        onRefreshQueue?.();
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTask = async (taskId) => {
    try {
      setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
      const res = await fetch(`/api/queue/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel task');
      onRefreshQueue?.();
    } catch (err) {
      alert('Error cancelling task: ' + err.message);
      fetchTasks();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title="Очередь обработки"
        icon={<Icon icon={List} size="md" tone="accent" />}
        onClose={onClose}
      />

      <ModalBody>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--ui-space-8)' }}>
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <AlertBanner tone="danger" title={error} />
        ) : tasks.length === 0 ? (
          <EmptyState
            title="Очередь пуста"
            description="Нет активных задач парсинга или анализа."
          />
        ) : (
          <ul
            ref={parent}
            style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--ui-space-3)',
            }}
          >
            {tasks.map((task) => (
              <li
                key={task.task_id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--ui-space-3)',
                  background: 'var(--ui-bg-subtle)',
                  border: '1px solid var(--ui-border-subtle)',
                }}
              >
                <div style={{ overflow: 'hidden', marginRight: 'var(--ui-space-4)' }}>
                  <Text
                    variant="body"
                    weight="medium"
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={task.url}
                  >
                    {task.title ? `${task.title} at ${task.company || 'Unknown'}` : task.url}
                  </Text>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--ui-space-2)',
                      marginTop: 'var(--ui-space-1)',
                    }}
                  >
                    <Badge variant="outline" size="xs" tone="neutral">
                      Status: {task.status}
                    </Badge>
                    {task.stage && (
                      <Badge variant="outline" size="xs" tone="info">
                        Stage: {task.stage}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="icon-sm"
                  title="Удалить из очереди"
                  aria-label="Удалить из очереди"
                  onClick={() => handleCancelTask(task.task_id)}
                >
                  <Icon icon={Trash2} size="sm" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </ModalBody>
    </Modal>
  );
}
