import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import { extractTextFromFile } from '../utils/textExtractor';
import { getLocalCV, saveLocalCV, clearLocalCV } from '../utils/cvIndexedDB';
import { useTranslation } from '../i18n/I18nContext';

export default function CVManagementPage({ user }) {
  const { t, locale } = useTranslation();
  const [currentUser, setCurrentUser] = useState(user || null);
  const canEditCV = true;
  const [loading, setLoading] = useState(true);
  const [sourceText, setSourceText] = useState('');
  const [sourceRevision, setSourceRevision] = useState(1);
  const [approvedRevision, setApprovedRevision] = useState(0);
  const [serverCV, setServerCV] = useState(null);
  const [syncStatus, setSyncStatus] = useState('none'); // 'none' | 'draft' | 'approved' | 'outdated'
  const [filename, setFilename] = useState('');

  // UI status
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch server approved CV
  const fetchServerApprovedCV = useCallback(async () => {
    try {
      const res = await fetch('/api/cv/approved');
      if (res.ok) {
        const data = await res.json();
        setServerCV(data);
        if (data) {
          setApprovedRevision(data.revision);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch server CV:', err);
    }
  }, []);

  // Fetch current user if not provided via props
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const u = await res.json();
        setCurrentUser(u);
      }
    } catch (err) {
      console.warn('Failed to fetch current user:', err);
    }
  }, []);

  // Load local CV from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await Promise.all([fetchServerApprovedCV(), fetchCurrentUser()]);
        const local = await getLocalCV();
        if (local) {
          const text = local.sourceText || local.anonymizedText || '';
          setSourceText(text);
          setSourceRevision(local.sourceRevision || 1);
          setApprovedRevision(local.approvedRevision || 0);
          setFilename(local.filename || '');

          if (local.sourceRevision > (local.approvedRevision || 0)) {
            setSyncStatus('outdated');
          } else if (local.approvedRevision > 0) {
            setSyncStatus('approved');
          } else {
            setSyncStatus('draft');
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fetchServerApprovedCV]);

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);
    try {
      setLoading(true);
      const text = await extractTextFromFile(file);
      const newRev = sourceRevision + 1;
      setSourceText(text);
      setFilename(file.name);
      setSourceRevision(newRev);
      setSyncStatus('draft');

      await saveLocalCV({
        sourceText: text,
        anonymizedText: text,
        detectedEntities: [],
        replacementMappings: [],
        sourceRevision: newRev,
        approvedRevision: 0,
        filename: file.name,
      });

      setMessage(t('pages.cv.loaded_success', { filename: file.name }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Edit source text locally
  const handleSourceTextChange = (e) => {
    const newText = e.target.value;
    const newRev = sourceRevision + 1;
    setSourceText(newText);
    setSourceRevision(newRev);
    setSyncStatus('outdated');

    saveLocalCV({
      sourceText: newText,
      anonymizedText: newText,
      detectedEntities: [],
      replacementMappings: [],
      sourceRevision: newRev,
      approvedRevision,
      filename,
    });
  };

  // Server save
  const handleApproveAndSync = async () => {
    if (!sourceText.trim()) {
      setError(t('pages.cv.empty_error'));
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const res = await fetch('/api/cv/approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceText,
          revision: sourceRevision,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save CV');
      }

      const saved = await res.json();
      setServerCV(saved);
      setApprovedRevision(saved.revision);
      setSyncStatus('approved');

      await saveLocalCV({
        sourceText,
        anonymizedText: sourceText,
        detectedEntities: [],
        replacementMappings: [],
        sourceRevision,
        approvedRevision: saved.revision,
        filename,
      });

      setMessage(t('pages.cv.save_success'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServerCV = async () => {
    if (!window.confirm(t('pages.cv.confirm_delete_server'))) return;
    try {
      setIsSubmitting(true);
      await fetch('/api/cv/approved', { method: 'DELETE' });
      setServerCV(null);
      setApprovedRevision(0);
      setSyncStatus(sourceText ? 'draft' : 'none');
      setMessage(t('pages.cv.server_deleted_success'));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear local storage
  const handleClearLocal = async () => {
    if (!window.confirm(t('pages.cv.confirm_clear_draft'))) return;
    await clearLocalCV();
    setSourceText('');
    setSourceRevision(1);
    setApprovedRevision(0);
    setFilename('');
    setSyncStatus('none');
    setMessage(t('pages.cv.draft_cleared'));
  };

  return (
    <div className="cv-page-container">
      {/* Header */}
      <div className="cv-hero-section">
        <div>
          <div className="cv-hero-meta">[ REVISION CONTROL // CV ]</div>
          <h1 className="cv-title">
            <FileText size={26} style={{ color: 'var(--primary)' }} />
            {t('pages.cv.title')}
          </h1>
          <p className="cv-subtitle">
            {t('pages.cv.subtitle')}
          </p>
        </div>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {syncStatus === 'approved' && (
            <span className="cv-sync-badge approved">
              <CheckCircle2 size={15} /> {t('pages.cv.saved_on_server', { rev: approvedRevision })}
            </span>
          )}
          {syncStatus === 'outdated' && (
            <span className="cv-sync-badge outdated">
              <AlertTriangle size={15} /> {t('pages.cv.modified_locally')}
            </span>
          )}
          {syncStatus === 'draft' && (
            <span className="cv-sync-badge draft">
              <Edit3 size={15} /> {t('pages.cv.local_draft')}
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="info-banner" style={{ borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(239, 68, 68, 0.12)', color: '#fca5a5' }}>
          {error}
        </div>
      )}
      {message && (
        <div className="info-banner" style={{ borderColor: 'var(--aspen-mint-border)', background: 'var(--aspen-mint-subtle)', color: 'var(--aspen-mint-bright)' }}>
          {message}
        </div>
      )}

      {/* Upload & Actions Toolbar */}
      {canEditCV && (
        <div className="cv-toolbar">
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <span>{sourceText ? t('pages.cv.replace_btn') : t('pages.cv.upload_btn')}</span>
            <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          {sourceText && (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleApproveAndSync}
                disabled={isSubmitting}
                style={{ background: 'var(--aspen-mint)', borderColor: 'var(--aspen-mint-border)' }}
              >
                <CheckCircle2 size={16} />
                <span>{t('pages.cv.save_btn')}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleClearLocal}
                style={{ color: '#f87171', marginLeft: 'auto' }}
              >
                <Trash2 size={15} />
                <span>{t('pages.cv.clear_draft_btn')}</span>
              </button>
            </>
          )}

          {serverCV && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={handleDeleteServerCV}
              disabled={isSubmitting}
            >
              <Trash2 size={15} />
              <span>{t('pages.cv.delete_server_btn')}</span>
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {sourceText ? (
        <div className="cv-editor-card">
          <div className="cv-editor-header">
            <span style={{ fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={16} style={{ color: 'var(--primary)' }} />
              {t('pages.cv.content_header', { filename: filename || (locale === 'ru' ? 'Текущий документ' : 'Current Document') })}
            </span>
            <span className="technical-stamp">{t('pages.cv.revision', { rev: sourceRevision })}</span>
          </div>
          <textarea
            className="cv-textarea"
            value={sourceText}
            onChange={canEditCV ? handleSourceTextChange : undefined}
            readOnly={!canEditCV}
            rows={26}
          />
        </div>
      ) : (
        <div className="cv-dropzone">
          <FileText size={48} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '-0.03em' }}>
            {t('pages.cv.no_cv_title')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '480px', fontSize: '0.875rem', lineHeight: 1.6 }}>
            {t('pages.cv.no_cv_desc')}
          </p>
          <div className="cv-dropzone-specs">
            .PDF &nbsp;•&nbsp; .MD &nbsp;•&nbsp; .JSON &nbsp;•&nbsp; .TXT &nbsp;|&nbsp; MAX SIZE: 5MB
          </div>
          <label className="btn btn-primary" style={{ padding: '0 24px', height: '42px', cursor: 'pointer', marginTop: '8px' }}>
            <Upload size={16} />
            <span>{t('pages.cv.choose_file')}</span>
            <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
}
