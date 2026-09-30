import React, { useState, useEffect } from 'react';
import { X, Loader2, Trash2, AlertCircle, List } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';

export default function QueueModal({ isOpen, onClose, queueRemaining }) {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTasks();
    } else {
      setTasks([]);
      setError('');
    }
  }, [isOpen, queueRemaining]);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/queue/tasks');
      if (!res.ok) throw new Error('Failed to fetch queue tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTask = async (taskId) => {
    try {
      const res = await fetch(`/api/queue/tasks/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel task');
      // Remove from list visually
      setTasks((prev) => prev.filter(t => t.task_id !== taskId));
    } catch (err) {
      alert('Error cancelling task: ' + err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <List size={20} color="#6366f1" />
            <span>Очередь обработки</span>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
               <Loader2 size={24} className="spin" style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
             </div>
          ) : error ? (
             <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <AlertCircle size={16} /> {error}
             </div>
          ) : tasks.length === 0 ? (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
               Очередь пуста
             </div>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tasks.map(task => (
                <li key={task.task_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ overflow: 'hidden', marginRight: '16px' }}>
                    <div style={{ fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={task.url}>
                      {task.title ? `${task.title} at ${task.company || 'Unknown'}` : task.url}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <span style={{ textTransform: 'capitalize' }}>Status: {task.status}</span>
                      {task.stage && <span>• Stage: {task.stage}</span>}
                    </div>
                  </div>
                  <button 
                    className="btn btn-danger btn-icon" 
                    title="Удалить из очереди"
                    onClick={() => handleCancelTask(task.task_id)}
                    style={{ flexShrink: 0 }}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
