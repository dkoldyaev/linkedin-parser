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
import { anonymizeCVText } from '../utils/anonymizer';
import { getLocalCV, saveLocalCV, clearLocalCV } from '../utils/cvIndexedDB';

export default function CVManagementPage() {
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

  // Load local CV from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        await fetchServerApprovedCV();
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
        setError('Error loading local CV: ' + err.message);
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
        anonymizedText: text, // Raw text is directly saved
        detectedEntities: [],
        replacementMappings: [],
        sourceRevision: newRev,
        approvedRevision: 0,
        filename: file.name,
      });

      setMessage(`File "${file.name}" loaded successfully.`);
    } catch (err) {
      setError('File extraction failed: ' + err.message);
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

  // Server approval
  const handleApproveAndSync = async () => {
    if (!sourceText.trim()) {
      setError('Cannot save an empty CV.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Save CV directly on the server
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

      setMessage('CV successfully saved on server! Vacancy compatibility analysis is now unlocked.');
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteServerCV = async () => {
    if (!window.confirm('Are you sure you want to delete your CV from the server? This will also remove compatibility analyses.')) return;
    try {
      setIsSubmitting(true);
      await fetch('/api/cv/approved', { method: 'DELETE' });
      setServerCV(null);
      setApprovedRevision(0);
      setSyncStatus(sourceText ? 'draft' : 'none');
      setMessage('Server CV removed.');
    } catch (err) {
      setError('Delete error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear local storage
  const handleClearLocal = async () => {
    if (!window.confirm('Delete local CV draft from your browser?')) return;
    await clearLocalCV();
    setSourceText('');
    setSourceRevision(1);
    setApprovedRevision(0);
    setFilename('');
    setSyncStatus('none');
    setMessage('Local CV draft cleared.');
  };

  return (
    <div className="cv-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText style={{ color: '#6366f1' }} size={28} />
            CV Management
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>
            Upload or edit your base CV. It is used directly for automatic vacancy compatibility matching and tailoring.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {syncStatus === 'approved' && (
            <span style={{ background: '#05966922', color: '#10b981', border: '1px solid #059669', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Saved on Server (Rev {approvedRevision})
            </span>
          )}
          {syncStatus === 'outdated' && (
            <span style={{ background: '#d9770622', color: '#f59e0b', border: '1px solid #d97706', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Modified Locally (Save Needed)
            </span>
          )}
          {syncStatus === 'draft' && (
            <span style={{ background: '#6366f122', color: '#818cf8', border: '1px solid #6366f1', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={16} /> Local Draft (Unsaved)
            </span>
          )}
        </div>
      </div>

      {/* Notifications */}
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

      {/* Upload & Actions Toolbar */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: '#0f172a', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #334155' }}>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#ffffff', padding: '10px 18px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', fontSize: '0.9rem' }}>
          <Upload size={18} />
          {sourceText ? 'Replace CV (MD, JSON, TXT)' : 'Upload CV (MD, JSON, TXT)'}
          <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        {sourceText && (
          <>
            <button
              onClick={handleApproveAndSync}
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
            >
              <CheckCircle2 size={18} /> Save on Server
            </button>

            <button
              onClick={handleClearLocal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#334155', color: '#f87171', border: '1px solid #475569', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}
            >
              <Trash2 size={16} /> Clear Draft
            </button>
          </>
        )}

        {serverCV && (
          <button
            onClick={handleDeleteServerCV}
            disabled={isSubmitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#7f1d1d22', color: '#fca5a5', border: '1px solid #7f1d1d', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
          >
            <Trash2 size={16} /> Delete Server CV
          </button>
        )}
      </div>

      {/* Main Content Area */}
      {sourceText ? (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={18} /> CV Content ({filename || 'Current Document'})
            </span>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Revision {sourceRevision}</span>
          </div>
          <textarea
            value={sourceText}
            onChange={handleSourceTextChange}
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
            }}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0f172a', border: '2px dashed #334155', borderRadius: '12px' }}>
          <FileText size={48} style={{ color: '#6366f1', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>No CV Loaded</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            Upload your CV in Markdown (.md), JSON (.json), or Plain Text (.txt) format. It will be used directly for automatic vacancy matching.
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            <Upload size={18} /> Choose CV File
            <input type="file" accept=".md,.markdown,.json,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
}
