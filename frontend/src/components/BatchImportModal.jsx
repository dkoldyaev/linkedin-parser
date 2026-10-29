import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader2, CloudOff } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { shouldShowExtensionPrompt } from '../utils/extension';
import ExtensionPromptModal from './ExtensionPromptModal';

export default function BatchImportModal({ isOpen, onClose, onImportComplete, onAddOfflineVacancies, queueRemaining = 0 }) {
  const { t } = useTranslation();
  const [urlsText, setUrlsText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showExtModal, setShowExtModal] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(null);

  if (!isOpen) return null;

  const performSubmit = async (urls, defaultTags) => {
    // If offline, bypass network call and create offline vacancies directly
    if (!navigator.onLine) {
      if (onAddOfflineVacancies) {
        onAddOfflineVacancies(urls, defaultTags);
      }
      handleClose();
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    trackEvent(EVENTS.BATCH_IMPORT_SUBMIT, {
      urls_count: urls.length,
      has_tags: defaultTags.length > 0,
      tags_count: defaultTags.length
    });

    try {
      const res = await fetch('/api/vacancies/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          urls,
          default_tags: defaultTags
        })
      });

      if (!res.ok) {
        throw new Error(t('batchModal.error_server', { status: res.status }));
      }

      const data = await res.json();
      trackEvent(EVENTS.BATCH_IMPORT_SUCCESS, {
        urls_count: urls.length,
        status: data.status,
        queued: data.queued,
        imported: data.imported,
        total: data.total
      });

      setResult(data);
      setUrlsText('');
      setTagsInput('');
      setDuplicateWarning(null);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      // If network fails (connection dropped or server offline), fallback to offline queue
      if (!navigator.onLine || err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        if (onAddOfflineVacancies) {
          onAddOfflineVacancies(urls, defaultTags);
          handleClose();
          return;
        }
      }
      trackEvent(EVENTS.BATCH_IMPORT_ERROR, {
        error: err.message || t('common.error')
      });
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const urls = urlsText
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) {
      setError(t('batchModal.error_empty_urls'));
      return;
    }

    const defaultTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    if (!navigator.onLine) {
      if (onAddOfflineVacancies) {
        onAddOfflineVacancies(urls, defaultTags);
      }
      handleClose();
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const dupRes = await fetch('/api/vacancies/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls }),
      });
      if (dupRes.ok) {
        const dupData = await dupRes.json();
        if (dupData.has_duplicates && dupData.duplicates.length > 0) {
          setLoading(false);
          setDuplicateWarning({
            duplicates: dupData.duplicates,
            urls,
            defaultTags,
          });
          return;
        }
      }
    } catch (dupErr) {
      console.warn("Duplicate check error (ignoring offline):", dupErr);
    } finally {
      setLoading(false);
    }

    const needsPrompt = await shouldShowExtensionPrompt();
    if (needsPrompt) {
      setShowExtModal(true);
    } else {
      await performSubmit(urls, defaultTags);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setUrlsText('');
    setTagsInput('');
    setDuplicateWarning(null);
    onClose();
  };

  const queueUnit = queueRemaining === 1 ? t('nav.queue_unit_one') : t('nav.queue_unit_many');

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <UploadCloud size={20} color="#6366f1" />
            <span>{t('batchModal.title')}</span>
          </div>
          <button className="btn-icon" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {duplicateWarning ? (
          <div>
            <div className="modal-body">
              <div className="info-banner" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)', color: '#fbbf24' }}>
                <AlertCircle size={20} style={{ flexShrink: 0 }} />
                <div>
                  <strong>{t('batchModal.duplicate_warning_title')}</strong>
                  <div style={{ fontSize: '0.875rem', marginTop: '4px' }}>
                    {t('batchModal.duplicate_warning_desc')}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '16px', maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {duplicateWarning.duplicates.map((dup) => (
                  <div key={dup.id} style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary, rgba(255, 255, 255, 0.05))',
                    border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary, #f3f4f6)' }}>
                      {dup.title || dup.url}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary, #9ca3af)' }}>
                      <span>{dup.company || 'Unknown'}</span>
                      {dup.status && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          background: 'rgba(99, 102, 241, 0.2)',
                          color: '#a5b4fc',
                          fontSize: '0.75rem'
                        }}>
                          {dup.status}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dup.url}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDuplicateWarning(null)}
                disabled={loading}
              >
                {t('batchModal.duplicate_warning_cancel')}
              </button>
              <button
                type="button"
                className="btn btn-warning"
                style={{ background: '#f59e0b', color: '#111827', fontWeight: 600, border: 'none' }}
                onClick={async () => {
                  const { urls, defaultTags } = duplicateWarning;
                  const needsPrompt = await shouldShowExtensionPrompt();
                  if (needsPrompt) {
                    setShowExtModal(true);
                  } else {
                    await performSubmit(urls, defaultTags);
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t('batchModal.submitting_btn')}</span>
                  </>
                ) : (
                  <span>{t('batchModal.duplicate_warning_proceed')}</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {!navigator.onLine && (
                <div className="info-banner" style={{ background: 'rgba(99, 102, 241, 0.12)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#a5b4fc', marginBottom: '16px' }}>
                  <CloudOff size={18} style={{ flexShrink: 0 }} />
                  <div>
                    <strong>{t('pwa.offline')}</strong>
                    <div style={{ fontSize: '0.8rem', marginTop: '2px' }}>
                      {t('pwa.offline_batch_notice')}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="info-banner" style={{ background: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)', color: '#fca5a5' }}>
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="info-banner" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', color: '#6ee7b7' }}>
                  <CheckCircle size={18} />
                  <div>
                    <strong>{result.status === 'queued' ? t('batchModal.queued_success_title') : t('batchModal.import_completed')}</strong>{' '}
                    {result.status === 'queued' 
                      ? t('batchModal.queued_success_desc', { count: result.queued })
                      : t('batchModal.import_result', { imported: result.imported, total: result.total })}
                  </div>
                </div>
              )}

              {queueRemaining > 0 && (
                <div className="info-banner" style={{ background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#c7d2fe' }}>
                  <Loader2 size={18} className="spin" style={{ animation: 'spin 1.2s linear infinite', flexShrink: 0 }} />
                  <div>
                    {t('batchModal.queue_remaining_notice', { count: queueRemaining, unit: queueUnit })}
                    <span style={{ display: 'block', fontSize: '0.75rem', color: '#a5b4fc', marginTop: '2px' }}>
                      {t('batchModal.background_notice')}
                    </span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  {t('batchModal.urls_label')}
                </label>
                <textarea
                  className="form-textarea"
                  rows={7}
                  placeholder={t('batchModal.urls_placeholder')}
                  value={urlsText}
                  onChange={e => setUrlsText(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('batchModal.tags_label')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('batchModal.tags_placeholder')}
                  value={tagsInput}
                  onChange={e => setTagsInput(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                {t('common.cancel')}
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t('batchModal.submitting_btn')}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud size={16} />
                    <span>{t('batchModal.submit_btn')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <ExtensionPromptModal
        isOpen={showExtModal}
        onClose={() => setShowExtModal(false)}
        onProceed={() => {
          const urls = urlsText
            .split('\n')
            .map(u => u.trim())
            .filter(u => u.length > 0);
          const defaultTags = tagsInput
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
          performSubmit(urls, defaultTags);
        }}
      />
    </div>
  );
}
