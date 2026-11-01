import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Edit3,
  Key,
} from 'lucide-react';
import { extractTextFromFile } from '../utils/textExtractor';
import { getLocalCV, saveLocalCV, clearLocalCV } from '../utils/cvIndexedDB';
import { useTranslation } from '../i18n/I18nContext';

export default function CVManagementPage({ user }) {
  const { t, locale } = useTranslation();
  const [currentUser, setCurrentUser] = useState(user || null);

  const userFlags = currentUser?.feature_flags || [];
  const canEditCV = userFlags.includes('cv_edit') || userFlags.includes('cv_editing');
  const [loading, setLoading] = useState(true);
  const [sourceText, setSourceText] = useState('');
  const [sourceRevision, setSourceRevision] = useState(1);
  const [approvedRevision, setApprovedRevision] = useState(0);
  const [serverCV, setServerCV] = useState(null);
  const [syncStatus, setSyncStatus] = useState('none'); // 'none' | 'draft' | 'approved' | 'outdated'
  const [filename, setFilename] = useState('');
  const [cvServiceToken, setCvServiceToken] = useState('');
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [tokenSavedMsg, setTokenSavedMsg] = useState(false);

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

  // Fetch settings (for cv_service_token)
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.cv_service_token !== undefined) {
          setCvServiceToken(data.cv_service_token || '');
        }
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
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

  // Save CV service token
  const handleSaveToken = async (e) => {
    if (e) e.preventDefault();
    setIsSavingToken(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cv_service_token: cvServiceToken.trim() }),
      });
      if (res.ok) {
        setTokenSavedMsg(true);
        setTimeout(() => setTokenSavedMsg(false), 2500);
      }
    } catch (err) {
      setError(err.message || 'Failed to save token');
    } finally {
      setIsSavingToken(false);
    }
  };

  // Load local CV from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await Promise.all([fetchServerApprovedCV(), fetchSettings(), fetchCurrentUser()]);
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
  }, [fetchServerApprovedCV, fetchSettings]);

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
    <div className="cv-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText style={{ color: '#6366f1' }} size={28} />
            {t('pages.cv.title')}
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>
            {t('pages.cv.subtitle')}
          </p>
        </div>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {syncStatus === 'approved' && (
            <span style={{ background: '#05966922', color: '#10b981', border: '1px solid #059669', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> {t('pages.cv.saved_on_server', { rev: approvedRevision })}
            </span>
          )}
          {syncStatus === 'outdated' && (
            <span style={{ background: '#d9770622', color: '#f59e0b', border: '1px solid #d97706', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> {t('pages.cv.modified_locally')}
            </span>
          )}
          {syncStatus === 'draft' && (
            <span style={{ background: '#6366f122', color: '#818cf8', border: '1px solid #6366f1', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={16} /> {t('pages.cv.local_draft')}
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
      {!canEditCV && (
        <div style={{ background: '#3b82f622', border: '1px solid #3b82f6', color: '#93c5fd', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={18} />
          <span>{t('pages.cv.cv_editing_disabled')}</span>
        </div>
      )}
      {error && (
        <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {error}
        </div>
      )}
      {message && (
        <div style={{ background: '#10b98122', border: '1px solid #10b981', color: '#6ee7b7', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px' }}>
          {message}
        </div>
      )}

      {/* API Key Configuration Card */}
      <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSaveToken} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} style={{ color: '#6366f1' }} />
            <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#e2e8f0' }}>{t('pages.cv.token_card_title')}</span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '2px 0 8px 0' }}>
            {t('pages.cv.token_card_desc')}
          </p>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="password"
              placeholder="cvt_..."
              value={cvServiceToken}
              onChange={(e) => setCvServiceToken(e.target.value)}
              style={{
                flex: '1 1 300px',
                background: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#f8fafc',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="submit"
              disabled={isSavingToken}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#6366f1',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {tokenSavedMsg ? (
                <>
                  <CheckCircle2 size={16} color="#4ade80" />
                  <span style={{ color: '#4ade80' }}>{t('pages.cv.token_saved')}</span>
                </>
              ) : (
                t('pages.cv.token_save_btn')
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Upload & Actions Toolbar */}
      {canEditCV && (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #334155' }}>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
            <Upload size={18} />
            {sourceText ? t('pages.cv.replace_btn') : t('pages.cv.upload_btn')}
            <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          {sourceText && (
            <>
              <button
                onClick={handleApproveAndSync}
                disabled={isSubmitting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
              >
                <CheckCircle2 size={18} /> {t('pages.cv.save_btn')}
              </button>

              <button
                onClick={handleClearLocal}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#334155', color: '#f87171', border: '1px solid #475569', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}
              >
                <Trash2 size={16} /> {t('pages.cv.clear_draft_btn')}
              </button>
            </>
          )}

          {serverCV && (
            <button
              onClick={handleDeleteServerCV}
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7f1d1d22', color: '#fca5a5', border: '1px solid #7f1d1d', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <Trash2 size={16} /> {t('pages.cv.delete_server_btn')}
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {sourceText ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={18} /> {t('pages.cv.content_header', { filename: filename || (locale === 'ru' ? 'Текущий документ' : 'Current Document') })}
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{t('pages.cv.revision', { rev: sourceRevision })}</span>
          </div>
          <textarea
            value={sourceText}
            onChange={canEditCV ? handleSourceTextChange : undefined}
            readOnly={!canEditCV}
            rows={26}
            style={{
              width: '100%',
              background: '#0f172a',
              color: '#e2e8f0',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '16px',
              fontFamily: 'monospace',
              fontSize: '0.9rem',
              lineHeight: '1.6',
              resize: 'vertical',
              opacity: canEditCV ? 1 : 0.85,
              cursor: canEditCV ? 'text' : 'default',
            }}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0f172a', border: '2px dashed #334155', borderRadius: '12px' }}>
          <FileText size={48} style={{ color: '#6366f1', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>{t('pages.cv.no_cv_title')}</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            {canEditCV ? t('pages.cv.no_cv_desc') : t('pages.cv.cv_editing_disabled')}
          </p>
          {canEditCV && (
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              <Upload size={18} /> {t('pages.cv.choose_file')}
              <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          )}
        </div>
      )}
    </div>
  );
}
