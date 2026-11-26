import { useCallback, useEffect, useState } from 'react';
import { queueService } from '../services/queueService';
import type { QueueTask } from '../types/models';

export function getTaskIdentifier(task: QueueTask): string | number {
  return task.task_id ?? task.id ?? task.url;
}

export function getTaskLabel(task: QueueTask): string {
  if (!task.title) return task.url;
  const company = task.company || 'Unknown';
  return `${task.title} at ${company}`;
}

export function useQueueTasks(
  isOpen: boolean,
  queueRemaining?: number,
  onRefreshQueue?: () => void,
) {
  const [tasks, setTasks] = useState<QueueTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTasks = useCallback(async () => {
    try {
      const list = await queueService.getTasks();
      setTasks(list);
      const hasRemaining = Boolean(queueRemaining && queueRemaining > 0);
      if (list.length === 0 && hasRemaining) {
        onRefreshQueue?.();
      }
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch queue tasks');
    } finally {
      setLoading(false);
    }
  }, [queueRemaining, onRefreshQueue]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchTasks();
    onRefreshQueue?.();
  }, [isOpen, queueRemaining, fetchTasks, onRefreshQueue]);

  const handleCancelTask = async (taskId: string | number) => {
    try {
      setTasks((prev) => prev.filter((item) => getTaskIdentifier(item) !== taskId));
      await queueService.cancelTask(taskId);
      onRefreshQueue?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert('Error cancelling task: ' + msg);
      void fetchTasks();
    }
  };

  return { tasks, loading, error, handleCancelTask };
}
