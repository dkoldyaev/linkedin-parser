import React, { useState } from 'react';
import { X, UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';

export default function BatchImportModal({ isOpen, onClose, onImportComplete, queueRemaining = 0 }) {
  const { t } = useTranslation();
  const [urlsText, setUrlsText] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

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

  const handleClose = () => {
    setResult(null);
    setError(null);
    setUrlsText('');
    setTagsInput('');
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
      </div>
    </div>
  );
}
