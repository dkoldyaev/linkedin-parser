import React, { useState, useEffect, useCallback } from 'react';
import { CloudOff, RefreshCw, Loader2, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { getSyncQueue, syncPendingQueue } from '../utils/offlineSync';

export default function OfflineSyncBadge({ onSyncComplete }) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueCount, setQueueCount] = useState(() => getSyncQueue().length);
  const [justSynced, setJustSynced] = useState(false);

  const refreshQueueCount = useCallback(() => {
    setQueueCount(getSyncQueue().length);
  }, []);

  const runSync = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    try {
      const success = await syncPendingQueue({
        onSyncSuccess: () => {
          setJustSynced(true);
          setTimeout(() => setJustSynced(false), 3000);
          if (onSyncComplete) onSyncComplete();
        },
        onRefreshNeeded: () => {
          if (onSyncComplete) onSyncComplete();
        }
      });
      refreshQueueCount();
      return success;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, onSyncComplete, refreshQueueCount]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Run sync automatically when returning online
      runSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChange = (e) => {
      if (e.detail && typeof e.detail.count === 'number') {
        setQueueCount(e.detail.count);
      } else {
        refreshQueueCount();
      }
    };

    const handleSyncStatus = (e) => {
      if (e.detail && typeof e.detail.syncing === 'boolean') {
        setIsSyncing(e.detail.syncing);
      }
    };

    const handleSyncDone = () => {
      refreshQueueCount();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
      if (onSyncComplete) onSyncComplete();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('lp_sync_queue_changed', handleQueueChange);
    window.addEventListener('lp_sync_status_changed', handleSyncStatus);
    window.addEventListener('lp_sync_complete', handleSyncDone);

    // Initial check
    refreshQueueCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('lp_sync_queue_changed', handleQueueChange);
      window.removeEventListener('lp_sync_status_changed', handleSyncStatus);
      window.removeEventListener('lp_sync_complete', handleSyncDone);
    };
  }, [runSync, refreshQueueCount, onSyncComplete]);

  if (!isOnline) {
    return (
      <div 
        className="queue-pill offline-pill" 
        title={t('pwa.offline_desc')}
        style={{
          background: 'rgba(239, 68, 68, 0.15)',
          borderColor: 'rgba(239, 68, 68, 0.35)',
          color: '#f87171'
        }}
      >
        <CloudOff size={13} />
        <span>{t('pwa.offline')}{queueCount > 0 ? ` (${queueCount})` : ''}</span>
      </div>
    );
  }

  if (isSyncing) {
    return (
      <div 
        className="queue-pill syncing-pill" 
        title={t('pwa.syncing')}
        style={{
          background: 'rgba(99, 102, 241, 0.15)',
          borderColor: 'rgba(99, 102, 241, 0.35)',
          color: '#818cf8'
        }}
      >
        <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
        <span>{t('pwa.syncing')}</span>
      </div>
    );
  }

  if (queueCount > 0) {
    return (
      <button 
        type="button"
        className="queue-pill pending-sync-btn" 
        title={t('pwa.sync_pending', { count: queueCount })}
        onClick={runSync}
        style={{
          background: 'rgba(245, 158, 11, 0.15)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          color: '#fbbf24',
          cursor: 'pointer'
        }}
      >
        <RefreshCw size={13} />
        <span>{t('pwa.sync_now')} ({queueCount})</span>
      </button>
    );
  }

  if (justSynced) {
    return (
      <div 
        className="queue-pill synced-pill" 
        style={{
          background: 'rgba(16, 185, 129, 0.15)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          color: '#34d399'
        }}
      >
        <CheckCircle2 size={13} />
        <span>{t('pwa.sync_success')}</span>
      </div>
    );
  }

  return null;
}
