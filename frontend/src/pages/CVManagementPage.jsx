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
import { useBlueprintGrid } from '../utils/useBlueprintGrid';

export default function CVManagementPage({ user }) {
  const { t, locale } = useTranslation();
  const [, setCurrentUser] = useState(user || null);
  const canEditCV = true;
  const [, setLoading] = useState(true);
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

  const pageRef = useBlueprintGrid([sourceText, syncStatus, error, message, filename, locale]);

  // Fetch server approved CV
  const fetchServerApprovedCV = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/cv/approved');
      if (res.ok) {
        const data = await res.json();
        setServerCV(data);
        return data;
      }
    } catch (err) {
      console.warn('Failed to fetch server CV:', err);
    }
  }, []);

  // Fetch current user if not provided via props
  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/auth/me');
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
        const [server] = await Promise.all([fetchServerApprovedCV(), fetchCurrentUser()]);
        const local = await getLocalCV(user?.id).catch(() => null);
        const hasLocalDraft = local && (local.sourceRevision > (local.approvedRevision || 0) || !server);
        if (server && !hasLocalDraft) {
          setSourceText(server.content || '');
          setSourceRevision(server.revision);
          setApprovedRevision(server.revision);
          setFilename(local?.filename || '');
          setSyncStatus('approved');
        } else if (local) {
          const text = local.sourceText || local.anonymizedText || '';
          setSourceText(text);
          setSourceRevision(local.sourceRevision || 1);
          setApprovedRevision(server?.revision || 0);
          setFilename(local.filename || '');

          if (server && local.sourceRevision > (local.approvedRevision || 0)) {
            setSyncStatus('outdated');
          } else if (server && local.approvedRevision > 0) {
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
  }, [fetchServerApprovedCV, fetchCurrentUser, user?.id]);

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
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
      }, user?.id);

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
    }, user?.id).catch(err => setError(err.message));
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

      const res = await fetch('/api/v2/cv/approved', {
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
      }, user?.id);

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
      const res = await fetch('/api/v2/cv/approved', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete CV');
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
    await clearLocalCV(user?.id);
    setSourceText(serverCV?.content || '');
    setSourceRevision(serverCV?.revision || 1);
    setApprovedRevision(serverCV?.revision || 0);
    setFilename('');
    setSyncStatus(serverCV ? 'approved' : 'none');
    setMessage(t('pages.cv.draft_cleared'));
  };

  return (
    <div ref={pageRef} className="bp-page cv-page-container">
      {/* Top Blueprint Rail */}
      <header className="bp-subbar cv-hero-section bp-snap" data-min-grids="1">
        <div className="bp-subbar-left">
          <span className="column-dot" style={{ background: 'var(--primary)' }} />
          <h1 className="cv-title bp-subbar-title">{t('pages.cv.title')}</h1>
          <span className="bp-subbar-sep">/</span>
          <p className="cv-subtitle bp-subbar-subtitle">{t('pages.cv.subtitle')}</p>
        </div>

        <div className="bp-subbar-right">
          {syncStatus === 'approved' && (
            <span className="cv-sync-badge approved">
              <CheckCircle2 size={14} /> {t('pages.cv.saved_on_server', { rev: approvedRevision })}
            </span>
          )}
          {syncStatus === 'outdated' && (
            <span className="cv-sync-badge outdated">
              <AlertTriangle size={14} /> {t('pages.cv.modified_locally')}
            </span>
          )}
          {syncStatus === 'draft' && (
            <span className="cv-sync-badge draft">
              <Edit3 size={14} /> {t('pages.cv.local_draft')}
            </span>
          )}
        </div>
      </header>

      {/* Notifications */}
      {error && (
        <div className="info-banner bp-banner is-error bp-snap" data-min-grids="1">
          <AlertTriangle size={15} />
          <span>{error}</span>
        </div>
      )}
      {message && (
        <div className="info-banner bp-banner is-success bp-snap" data-min-grids="1">
          <CheckCircle2 size={15} />
          <span>{message}</span>
        </div>
      )}

      {/* Document & Actions Toolbar Rail */}
      {canEditCV && (
        <div className="column-header cv-toolbar bp-snap" data-min-grids="1">
          <div className="column-title-group">
            <span className="column-index">01</span>
            <span
              className="column-dot"
              style={{ background: sourceText ? 'var(--aspen-mint)' : 'var(--text-muted)' }}
            />
            <span className="column-name">
              {sourceText
                ? t('pages.cv.content_header', {
                    filename: filename || (locale === 'ru' ? 'Текущий документ' : 'Current Document'),
                  })
                : t('pages.cv.no_cv_title')}
            </span>
            {sourceText && (
              <span className="column-badge">[{t('pages.cv.revision', { rev: sourceRevision })}]</span>
            )}
          </div>

          <div className="cv-toolbar-actions">
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <Upload size={14} />
              <span>{sourceText ? t('pages.cv.replace_btn') : t('pages.cv.upload_btn')}</span>
              <input
                type="file"
                accept=".pdf,.md,.markdown,.json,.txt"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>

            {sourceText && (
              <>
                <button
                  type="button"
                  className="btn btn-mint"
                  onClick={handleApproveAndSync}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 size={14} />
                  <span>{t('pages.cv.save_btn')}</span>
                </button>

                {syncStatus !== 'approved' && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-danger-text"
                    onClick={handleClearLocal}
                  >
                    <Trash2 size={14} />
                    <span>{t('pages.cv.clear_draft_btn')}</span>
                  </button>
                )}
              </>
            )}

            {serverCV && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteServerCV}
                disabled={isSubmitting}
              >
                <Trash2 size={14} />
                <span>{t('pages.cv.delete_server_btn')}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {sourceText ? (
        <div className="cv-editor-card bp-fill-grid" data-min-grids="12">
          <textarea
            className="cv-textarea"
            value={sourceText}
            onChange={canEditCV ? handleSourceTextChange : undefined}
            readOnly={!canEditCV}
            rows={20}
          />
        </div>
      ) : (
        <div className="cv-dropzone bp-snap" data-min-grids="8">
          <div className="stat-icon">
            <FileText size={18} />
          </div>
          <h2 className="cv-dropzone-title">{t('pages.cv.no_cv_title')}</h2>
          <p className="cv-dropzone-desc">{t('pages.cv.no_cv_desc')}</p>
          <div className="cv-dropzone-specs">
            .PDF &nbsp;•&nbsp; .MD &nbsp;•&nbsp; .JSON &nbsp;•&nbsp; .TXT &nbsp;|&nbsp; MAX SIZE: 5MB
          </div>
          <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
            <Upload size={14} />
            <span>{t('pages.cv.choose_file')}</span>
            <input
              type="file"
              accept=".pdf,.md,.markdown,.json,.txt"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
