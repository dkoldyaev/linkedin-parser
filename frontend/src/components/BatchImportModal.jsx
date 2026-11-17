import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { checkExtensionPromptRequirement, anyUrlRequiresExtension } from '../utils/extension';
import ExtensionPromptModal from './ExtensionPromptModal';

export default function BatchImportModal({ isOpen, onClose, onImportComplete, onOpenVacancy, queueRemaining = 0 }) {
  const { t } = useTranslation();
  const [urlsText, setUrlsText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showExtModal, setShowExtModal] = useState(false);
  const [extModalInfo, setExtModalInfo] = useState(null);
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [pendingSubmit, setPendingSubmit] = useState(null);

  if (!isOpen) return null;

  const performSubmit = async (urls, defaultTags) => {
    setLoading(true);
    setError(null);
    setResult(null);

    trackEvent(EVENTS.BATCH_IMPORT_SUBMIT, {
      urls_count: urls.length,
      has_tags: defaultTags.length > 0,
      tags_count: defaultTags.length
    });

    try {
      const res = await fetch('/api/v2/vacancies/batch', {
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

      if (data.existing_vacancies && data.existing_vacancies.length > 0) {
        setDuplicateWarning({
          duplicates: data.existing_vacancies,
          batchResult: data,
        });
      } else {
        setResult(data);
        setDuplicateWarning(null);
      }
      setUrlsText('');
      setTagsInput('');
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
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

    if (anyUrlRequiresExtension(urls)) {
      const promptReq = await checkExtensionPromptRequirement();
      if (promptReq.show) {
        setExtModalInfo(promptReq);
        setPendingSubmit(() => () => performSubmit(urls, defaultTags));
        setShowExtModal(true);
        return;
      }
    }

    await performSubmit(urls, defaultTags);
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setUrlsText('');
    setTagsInput('');
    setDuplicateWarning(null);
    setPendingSubmit(null);
    setShowExtModal(false);
    onClose();
  };

  const handleRemoveDuplicate = (dupId) => {
    setDuplicateWarning(prev => {
      if (!prev) return null;
      const updated = prev.duplicates.filter(d => d.id !== dupId);
      return {
        ...prev,
        duplicates: updated,
      };
    });
  };

  const handleOpenDuplicate = (dup) => {
    if (onOpenVacancy) {
      onOpenVacancy(dup);
    }
  };

  const handleReparseDuplicates = async () => {
    if (!duplicateWarning || !duplicateWarning.duplicates.length) return;
    setLoading(true);
    setError(null);

    const dupIds = duplicateWarning.duplicates.map(d => d.id).filter(Boolean);
    try {
      const res = await fetch('/api/v2/vacancies/reparse_all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: dupIds }),
      });
      if (!res.ok) {
        throw new Error(t('batchModal.error_server', { status: res.status }));
      }
      setResult({
        status: 'queued',
        queued: dupIds.length,
        message: t('batchModal.reparse_success'),
      });
      setDuplicateWarning(null);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const queueUnit = queueRemaining === 1 ? t('nav.queue_unit_one') : t('nav.queue_unit_many');

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content batch-import-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <UploadCloud size={20} color="#2563eb" />
            <span>{t('batchModal.title')}</span>
          </div>
          <button className="btn-icon modal-close-btn" onClick={handleClose}>
            <X size={18} />
          </button>
        </div>

        {duplicateWarning ? (
          <div className="batch-duplicates">
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
                {duplicateWarning.duplicates.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {t('batchModal.duplicate_none_selected')}
                  </div>
                ) : (
                  duplicateWarning.duplicates.map((dup) => (
                    <div key={dup.id} style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-xs)',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dup.title || dup.url}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>{dup.company || 'Unknown'}</span>
                          {dup.status && (
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-xs)',
                              background: 'rgba(37, 99, 235, 0.15)',
                              border: '1px solid var(--border-blueprint)',
                              color: '#93c5fd',
                              fontSize: '0.75rem',
                              fontFamily: 'var(--font-mono)'
                            }}>
                              {dup.status}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dup.url}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            padding: '6px',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-xs)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleOpenDuplicate(dup)}
                          title={t('batchModal.duplicate_open_vacancy')}
                          aria-label={t('batchModal.duplicate_open_vacancy')}
                        >
                          <ExternalLink size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{
                            padding: '6px',
                            color: '#ef4444',
                            borderRadius: 'var(--radius-xs)',
                            cursor: 'pointer',
                          }}
                          onClick={() => handleRemoveDuplicate(dup.id)}
                          title={t('batchModal.duplicate_remove_from_list')}
                          aria-label={t('batchModal.duplicate_remove_from_list')}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  if (duplicateWarning.batchResult) {
                    setResult(duplicateWarning.batchResult);
                  }
                  setDuplicateWarning(null);
                }}
                disabled={loading}
              >
                {t('batchModal.duplicate_warning_cancel')}
              </button>
              <button
                type="button"
                className="btn btn-warning"
                style={{ background: '#f59e0b', color: '#111827', fontWeight: 600, border: 'none' }}
                onClick={handleReparseDuplicates}
                disabled={loading || duplicateWarning.duplicates.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>{t('batchModal.submitting_btn')}</span>
                  </>
                ) : (
                  <span>{t('batchModal.duplicate_warning_proceed', { count: duplicateWarning.duplicates.length })}</span>
                )}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
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
                <label className="form-label" htmlFor="batch-vacancy-urls">
                  {t('batchModal.urls_label')}
                </label>
                <textarea
                  id="batch-vacancy-urls"
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
                <label className="form-label" htmlFor="batch-vacancy-tags">
                  {t('batchModal.tags_label')}
                </label>
                <input
                  id="batch-vacancy-tags"
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
        mode={extModalInfo?.reason || 'not_installed'}
        currentVersion={extModalInfo?.currentVersion}
        latestVersion={extModalInfo?.latestVersion}
        changelog={extModalInfo?.changelog}
        onClose={() => {
          setShowExtModal(false);
          setPendingSubmit(null);
        }}
        onProceed={() => {
          setShowExtModal(false);
          if (pendingSubmit) {
            pendingSubmit();
            setPendingSubmit(null);
          } else {
            const urls = urlsText
              .split('\n')
              .map(u => u.trim())
              .filter(u => u.length > 0);
            const defaultTags = tagsInput
              .split(',')
              .map(t => t.trim())
              .filter(t => t.length > 0);
            performSubmit(urls, defaultTags);
          }
        }}
      />
    </div>
  );
}
