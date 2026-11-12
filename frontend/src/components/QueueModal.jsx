import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Trash2, AlertCircle, List, ExternalLink, Clock, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { useAutoAnimate } from '@formkit/auto-animate/react';

export default function QueueModal({ isOpen, onClose, queueRemaining, onRefreshQueue }) {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [counts, setCounts] = useState({ total: 0, pending: 0, processing: 0, failed: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parent] = useAutoAnimate();

  const fetchQueueLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/queue/links');
      if (!res.ok) throw new Error('Failed to fetch queue links');
      const data = await res.json();
      setLinks(data.links || []);
      setCounts({
        total: data.total || 0,
        pending: data.pending_count || 0,
        processing: data.processing_count || 0,
        failed: data.failed_count || 0,
      });
      if ((data.links || []).length === 0 && queueRemaining > 0) {
        onRefreshQueue?.();
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [queueRemaining, onRefreshQueue]);

  useEffect(() => {
    if (isOpen) {
      fetchQueueLinks();
      onRefreshQueue?.();
    } else {
      setLinks([]);
      setCounts({ total: 0, pending: 0, processing: 0, failed: 0 });
      setError('');
      setLoading(false);
    }
  }, [isOpen, queueRemaining, fetchQueueLinks, onRefreshQueue]);

  const handleCancelLink = async (taskId) => {
    try {
      setLinks((prev) => prev.filter(item => item.task_id !== taskId));
      setCounts((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
      }));
      const res = await fetch(`/api/queue/links/${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to cancel link processing');
      onRefreshQueue?.();
    } catch (err) {
      alert(t('queueModal.cancel_error', { error: err.message }));
      fetchQueueLinks();
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t('queueModal.clear_all_confirm'))) return;
    try {
      setLinks([]);
      setCounts({ total: 0, pending: 0, processing: 0, failed: 0 });
      const res = await fetch('/api/queue/links', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear queue links');
      onRefreshQueue?.();
    } catch (err) {
      alert(t('queueModal.clear_all_error', { error: err.message }));
      fetchQueueLinks();
    }
  };

  const renderStageBadge = (stage, status) => {
    switch (stage) {
      case 'queued':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: 'var(--bg-subtle, rgba(148, 163, 184, 0.15))',
            color: 'var(--text-muted, #94a3b8)',
            border: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.25))',
            whiteSpace: 'nowrap',
          }}>
            <Clock size={12} />
            <span>{t('queueModal.stages.queued')}</span>
          </span>
        );
      case 'scraping':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: 'rgba(37, 99, 235, 0.12)',
            color: '#3b82f6',
            border: '1px solid rgba(37, 99, 235, 0.25)',
            whiteSpace: 'nowrap',
          }}>
            <Loader2 size={12} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>{t('queueModal.stages.scraping')}</span>
          </span>
        );
      case 'ai_analysis':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: 'rgba(147, 51, 234, 0.12)',
            color: '#a855f7',
            border: '1px solid rgba(147, 51, 234, 0.25)',
            whiteSpace: 'nowrap',
          }}>
            <Loader2 size={12} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>{t('queueModal.stages.ai_analysis')}</span>
          </span>
        );
      case 'cv_scoring':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: 'rgba(217, 119, 6, 0.12)',
            color: '#f59e0b',
            border: '1px solid rgba(217, 119, 6, 0.25)',
            whiteSpace: 'nowrap',
          }}>
            <Loader2 size={12} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
            <span>{t('queueModal.stages.cv_scoring')}</span>
          </span>
        );
      case 'completed':
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: 'rgba(16, 185, 129, 0.12)',
            color: '#10b981',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            whiteSpace: 'nowrap',
          }}>
            <CheckCircle2 size={12} />
            <span>{t('queueModal.stages.completed')}</span>
          </span>
        );
      case 'failed':
      default:
        if (status === 'failed' || stage === 'failed') {
          return (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: '500',
              background: 'rgba(239, 68, 68, 0.12)',
              color: 'var(--danger, #ef4444)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              whiteSpace: 'nowrap',
            }}>
              <AlertCircle size={12} />
              <span>{t('queueModal.stages.failed')}</span>
            </span>
          );
        }
        return (
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: '500',
            background: 'var(--bg-subtle, rgba(148, 163, 184, 0.15))',
            color: 'var(--text-muted, #94a3b8)',
            border: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.25))',
            whiteSpace: 'nowrap',
          }}>
            <span>{stage || status}</span>
          </span>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <List size={20} color="#2563eb" />
            <span>{t('queueModal.title')} {counts.total > 0 ? `(${counts.total})` : ''}</span>
          </div>
          <button className="btn-icon modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Counter Summary Bar */}
        {counts.total > 0 && (
          <div style={{
            padding: '8px 16px',
            background: 'var(--bg-subtle, rgba(0, 0, 0, 0.04))',
            borderBottom: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                {t('queueModal.total_summary', {
                  total: counts.total,
                  processing: counts.processing,
                  pending: counts.pending,
                })}
              </div>
              {counts.failed > 0 && (
                <div style={{ color: 'var(--danger, #ef4444)', fontWeight: '600' }}>
                  {t('queueModal.failed_count', { count: counts.failed })}
                </div>
              )}
            </div>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleClearAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 8px',
                fontSize: '0.75rem',
                height: 'auto',
              }}
              title={t('queueModal.clear_all_btn')}
            >
              <Trash2 size={12} />
              <span>{t('queueModal.clear_all_btn')}</span>
            </button>
          </div>
        )}

        <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {loading ? (
             <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
               <Loader2 size={24} className="spin" style={{ color: '#2563eb', animation: 'spin 1s linear infinite' }} />
             </div>
          ) : error ? (
             <div style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <AlertCircle size={16} /> {error}
             </div>
          ) : links.length === 0 ? (
             <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
               {t('queueModal.empty')}
             </div>
          ) : (
            <ul ref={parent} style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {links.map(item => (
                <li key={item.task_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-xs, 4px)',
                  border: '1px solid var(--border-subtle)',
                  gap: '12px',
                }}>
                  <div style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
                    {/* Link URL only */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        title={item.url}
                        style={{
                          fontWeight: '500',
                          fontSize: '0.9rem',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 'calc(100% - 24px)',
                          fontFamily: 'monospace',
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        {item.url}
                      </a>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        title={t('queueModal.open_link')}
                        style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>

                    {/* Status & Stage Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                      {renderStageBadge(item.stage, item.status)}
                      {item.attempts > 1 && item.status !== 'completed' && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {t('queueModal.attempts_label', { attempt: item.attempts, max: item.max_attempts })}
                        </span>
                      )}
                    </div>

                    {/* Error display if failed */}
                    {item.error && item.status === 'failed' && (
                      <div style={{
                        fontSize: '0.75rem',
                        color: 'var(--danger, #ef4444)',
                        marginTop: '4px',
                        wordBreak: 'break-word',
                        background: 'rgba(239, 68, 68, 0.08)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}>
                        {item.error}
                      </div>
                    )}
                  </div>

                  {/* Cancel / Remove Button */}
                  <button 
                    className="btn btn-danger btn-icon" 
                    title={t('queueModal.cancel_btn')}
                    onClick={() => handleCancelLink(item.task_id)}
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

