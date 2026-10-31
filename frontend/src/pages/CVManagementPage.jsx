import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Upload,
  FileText,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Building2,
  Edit3,
  Eye,
  AlertTriangle,
  ArrowRight,
  Plus,
  X,
  Lock,
  RotateCcw,
} from 'lucide-react';
import { extractTextFromFile } from '../utils/textExtractor';
import { anonymizeCVText, deanonymizeCVText, extractPotentialCompanies, PLACEHOLDERS } from '../utils/anonymizer';
import { getLocalCV, saveLocalCV, clearLocalCV } from '../utils/cvIndexedDB';

export default function CVManagementPage() {
  const [loading, setLoading] = useState(true);
  const [sourceText, setSourceText] = useState('');
  const [anonymizedText, setAnonymizedText] = useState('');
  const [detectedEntities, setDetectedEntities] = useState([]);
  const [replacementMappings, setReplacementMappings] = useState([]);
  const [sourceRevision, setSourceRevision] = useState(1);
  const [approvedRevision, setApprovedRevision] = useState(0);
  const [serverCV, setServerCV] = useState(null);
  const [syncStatus, setSyncStatus] = useState('none'); // 'none' | 'draft' | 'approved' | 'outdated'
  const [filename, setFilename] = useState('');

  // Company anonymization state
  const [potentialCompanies, setPotentialCompanies] = useState([]);
  const [selectedCompanies, setSelectedCompanies] = useState({});
  const [companyReplacements, setCompanyReplacements] = useState([]);
  const [isAnonymizingCompanies, setIsAnonymizingCompanies] = useState(false);

  // Manual replacement state
  const [manualOriginal, setManualOriginal] = useState('');
  const [manualPlaceholder, setManualPlaceholder] = useState('[CUSTOM]');
  const [customReplacements, setCustomReplacements] = useState([]);

  // UI status
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('sideBySide'); // 'sideBySide' | 'source' | 'preview'

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
          setSourceText(local.sourceText || '');
          setAnonymizedText(local.anonymizedText || '');
          setDetectedEntities(local.detectedEntities || []);
          setSourceRevision(local.sourceRevision || 1);
          setApprovedRevision(local.approvedRevision || 0);
          setFilename(local.filename || '');
          setCustomReplacements(local.customReplacements || []);
          setCompanyReplacements(local.companyReplacements || []);
          setReplacementMappings(local.replacementMappings || []);

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

      // Run anonymization pipeline
      const { anonymizedText: anon, detectedEntities: entities, mappings } = anonymizeCVText(text, [
        ...customReplacements,
        ...companyReplacements,
      ]);
      setAnonymizedText(anon);
      setDetectedEntities(entities);
      setReplacementMappings(mappings);

      // Detect potential companies
      const companies = extractPotentialCompanies(text);
      setPotentialCompanies(companies);
      const initialSelected = {};
      companies.forEach((c) => (initialSelected[c] = true));
      setSelectedCompanies(initialSelected);

      await saveLocalCV({
        sourceText: text,
        anonymizedText: anon,
        detectedEntities: entities,
        replacementMappings: mappings,
        sourceRevision: newRev,
        approvedRevision: 0,
        filename: file.name,
        customReplacements,
        companyReplacements,
      });

      setMessage(`File "${file.name}" extracted and anonymized locally.`);
    } catch (err) {
      setError('File extraction failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run or re-run anonymization
  const runAnonymization = useCallback(
    async (newSourceText, newCustom = customReplacements, newCompanies = companyReplacements) => {
      const { anonymizedText: anon, detectedEntities: entities, mappings } = anonymizeCVText(newSourceText, [
        ...newCustom,
        ...newCompanies,
      ]);
      setAnonymizedText(anon);
      setDetectedEntities(entities);
      setReplacementMappings(mappings);

      const comps = extractPotentialCompanies(newSourceText);
      setPotentialCompanies(comps);

      await saveLocalCV({
        sourceText: newSourceText,
        anonymizedText: anon,
        detectedEntities: entities,
        replacementMappings: mappings,
        sourceRevision,
        approvedRevision,
        filename,
        customReplacements: newCustom,
        companyReplacements: newCompanies,
      });
    },
    [customReplacements, companyReplacements, sourceRevision, approvedRevision, filename]
  );

  // Edit source text locally
  const handleSourceTextChange = (e) => {
    const newText = e.target.value;
    const newRev = sourceRevision + 1;
    setSourceText(newText);
    setSourceRevision(newRev);
    setSyncStatus('outdated');
    runAnonymization(newText);
  };

  // Add custom manual entity replacement
  const handleAddCustomReplacement = () => {
    if (!manualOriginal.trim()) return;
    const newCustom = [
      ...customReplacements.filter((c) => c.original !== manualOriginal.trim()),
      { original: manualOriginal.trim(), replacement: manualPlaceholder.trim() },
    ];
    setCustomReplacements(newCustom);
    setManualOriginal('');
    runAnonymization(sourceText, newCustom, companyReplacements);
  };

  const handleRemoveCustomReplacement = (orig) => {
    const newCustom = customReplacements.filter((c) => c.original !== orig);
    setCustomReplacements(newCustom);
    runAnonymization(sourceText, newCustom, companyReplacements);
  };

  // Request company anonymization from LLM
  const handleRequestCompanyAnonymization = async () => {
    const toAnonymize = potentialCompanies.filter((c) => selectedCompanies[c]);
    if (toAnonymize.length === 0) {
      setError('Please select at least one company to anonymize.');
      return;
    }

    try {
      setIsAnonymizingCompanies(true);
      setError(null);
      // Privacy by design: ONLY approved company names are sent. Raw CV is NEVER sent.
      const res = await fetch('/api/cv/anonymize-companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companies: toAnonymize }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || 'Company anonymization request failed');
      }

      const data = await res.json();
      const replacements = data.replacements || [];
      setCompanyReplacements(replacements);

      // Re-run pipeline locally with company replacements
      await runAnonymization(sourceText, customReplacements, replacements);
      setMessage(`Successfully anonymized ${replacements.length} companies into generalized industries.`);
    } catch (err) {
      setError('Company anonymization failed: ' + err.message);
    } finally {
      setIsAnonymizingCompanies(false);
    }
  };

  // Server approval
  const handleApproveAndSync = async () => {
    if (!anonymizedText.trim()) {
      setError('Cannot approve an empty CV.');
      return;
    }

    // Run client-side safety verification pass before transmission
    const safetyCheck = anonymizeCVText(anonymizedText);
    const unanonymizedEmailsOrPhones = safetyCheck.detectedEntities.filter(
      (e) => e.type === 'EMAIL' || e.type === 'PHONE'
    );
    if (unanonymizedEmailsOrPhones.length > 0) {
      setError(
        `Warning: Anonymized text still appears to contain ${unanonymizedEmailsOrPhones.length} detected email/phone identifiers. Please verify.`
      );
    }

    try {
      setIsSubmitting(true);
      setError(null);
      // TRANSMIT ONLY APPROVED ANONYMIZED CONTENT (Never original CV)
      const res = await fetch('/api/cv/approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: anonymizedText,
          revision: sourceRevision,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to save approved CV');
      }

      const saved = await res.json();
      setServerCV(saved);
      setApprovedRevision(saved.revision);
      setSyncStatus('approved');

      await saveLocalCV({
        sourceText,
        anonymizedText,
        detectedEntities,
        replacementMappings,
        sourceRevision,
        approvedRevision: saved.revision,
        filename,
        customReplacements,
        companyReplacements,
      });

      setMessage('Anonymized CV approved and saved on server! Vacancy compatibility analysis is now unlocked.');
    } catch (err) {
      setError('Approval failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Deanonymize on the client
  const handleDeanonymizePreview = () => {
    if (!anonymizedText) return;
    const restored = deanonymizeCVText(anonymizedText, replacementMappings);
    setSourceText(restored);
    setMessage(`Client-side deanonymization complete: restored text using ${replacementMappings.length} saved mappings.`);
  };
  const handleDeleteServerCV = async () => {
    if (!window.confirm('Are you sure you want to delete your approved CV from the server? This will also remove compatibility analyses.')) return;
    try {
      setIsSubmitting(true);
      await fetch('/api/cv/approved', { method: 'DELETE' });
      setServerCV(null);
      setApprovedRevision(0);
      setSyncStatus(sourceText ? 'draft' : 'none');
      setMessage('Server-side approved CV removed.');
    } catch (err) {
      setError('Delete error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear local storage
  const handleClearLocal = async () => {
    if (!window.confirm('Delete all local CV drafts and data from your browser?')) return;
    await clearLocalCV();
    setSourceText('');
    setAnonymizedText('');
    setDetectedEntities([]);
    setSourceRevision(1);
    setApprovedRevision(0);
    setFilename('');
    setCustomReplacements([]);
    setCompanyReplacements([]);
    setPotentialCompanies([]);
    setSyncStatus('none');
    setMessage('Local CV draft cleared.');
  };

  return (
    <div className="cv-page-container" style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto', color: '#f8fafc' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield style={{ color: '#6366f1' }} size={28} />
            CV Anonymization & Local Storage
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '4px', fontSize: '0.95rem' }}>
            Privacy by design: Your raw CV and personal identifiable information never leave your browser.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {syncStatus === 'approved' && (
            <span style={{ background: '#05966922', color: '#10b981', border: '1px solid #059669', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={16} /> Approved & Synced (Rev {approvedRevision})
            </span>
          )}
          {syncStatus === 'outdated' && (
            <span style={{ background: '#d9770622', color: '#f59e0b', border: '1px solid #d97706', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertTriangle size={16} /> Source Modified (Re-approval Needed)
            </span>
          )}
          {syncStatus === 'draft' && (
            <span style={{ background: '#6366f122', color: '#818cf8', border: '1px solid #6366f1', padding: '6px 14px', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Edit3 size={16} /> Local Draft (Unapproved)
            </span>
          )}
        </div>
      </div>

      {/* Privacy Notice Banner */}
      <div style={{ background: '#1e293b', borderLeft: '4px solid #6366f1', padding: '14px 18px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem', color: '#cbd5e1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
          <Lock size={16} style={{ color: '#818cf8' }} /> Privacy Notice & Residual Risk Warning
        </div>
        Automatic anonymization uses natural-language entity recognition and regex rules to replace emails, phones, names, addresses, and URLs.
        However, rare skill combinations or specific project narratives can still potentially identify you.
        Please inspect the side-by-side view carefully before approving. Only explicitly approved text is transmitted to the server.
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
          {sourceText ? 'Replace CV (PDF, DOCX, TXT)' : 'Upload CV (PDF, DOCX, TXT)'}
          <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>

        {sourceText && (
          <>
            <button
              onClick={() => runAnonymization(sourceText)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#1e293b', color: '#e2e8f0', border: '1px solid #475569', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              <RefreshCw size={16} /> Re-run Anonymization
            </button>

            <button
              onClick={handleDeanonymizePreview}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#334155', color: '#38bdf8', border: '1px solid #475569', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem' }}
              title="Restores placeholders and generalized companies back to original values in the source editor"
            >
              <RotateCcw size={16} /> Restore / Deanonymize on Client
            </button>

            <button
              onClick={handleApproveAndSync}
              disabled={isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#059669', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem' }}
            >
              <CheckCircle2 size={18} /> Approve & Save on Server
            </button>

            <button
              onClick={handleClearLocal}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#334155', color: '#f87171', border: '1px solid #475569', padding: '10px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}
            >
              <Trash2 size={16} /> Clear Local Draft
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Company Anonymization Section */}
          {potentialCompanies.length > 0 && (
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0' }}>
                  <Building2 size={18} style={{ color: '#38bdf8' }} /> Optional Company Anonymization (AI)
                </h3>
                <button
                  onClick={handleRequestCompanyAnonymization}
                  disabled={isAnonymizingCompanies}
                  style={{ background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {isAnonymizingCompanies ? <RefreshCw size={14} className="spin" /> : <Shield size={14} />}
                  Anonymize Selected Companies
                </button>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                Select detected employers to generalize into industry categories (e.g. &ldquo;Example Bank&rdquo; &rarr; &ldquo;Digital bank&rdquo;). Only the selected names are sent to the backend.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {potentialCompanies.map((c) => (
                  <label
                    key={c}
                    style={{
                      background: selectedCompanies[c] ? '#0369a133' : '#0f172a',
                      border: selectedCompanies[c] ? '1px solid #0284c7' : '1px solid #334155',
                      padding: '6px 12px',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: selectedCompanies[c] ? '#38bdf8' : '#94a3b8',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!selectedCompanies[c]}
                      onChange={(e) => setSelectedCompanies({ ...selectedCompanies, [c]: e.target.checked })}
                    />
                    {c}
                  </label>
                ))}
              </div>

              {companyReplacements.length > 0 && (
                <div style={{ marginTop: '14px', borderTop: '1px solid #334155', paddingTop: '10px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Applied Company Replacements: </span>
                  {companyReplacements.map((r, i) => (
                    <span key={i} style={{ background: '#0f172a', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', marginRight: '8px', color: '#a5f3fc' }}>
                      {r.original} &rarr; <b>{r.replacement}</b>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Custom Replacements Input */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '8px', color: '#e2e8f0' }}>Manual Replacements</h4>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Exact text to hide (e.g. Acme Corp)"
                value={manualOriginal}
                onChange={(e) => setManualOriginal(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px 12px', borderRadius: '6px', flex: '1', minWidth: '220px' }}
              />
              <input
                type="text"
                placeholder="Placeholder (e.g. [COMPANY])"
                value={manualPlaceholder}
                onChange={(e) => setManualPlaceholder(e.target.value)}
                style={{ background: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px 12px', borderRadius: '6px', width: '200px' }}
              />
              <button
                onClick={handleAddCustomReplacement}
                style={{ background: '#475569', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={16} /> Add Replacement
              </button>
            </div>
            {customReplacements.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                {customReplacements.map((cr, idx) => (
                  <span key={idx} style={{ background: '#0f172a', border: '1px solid #475569', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {cr.original} &rarr; {cr.replacement}
                    <X size={14} style={{ cursor: 'pointer', color: '#f87171' }} onClick={() => handleRemoveCustomReplacement(cr.original)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Side by Side Review Screen */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
            {/* Left: Original / Editable Source CV */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={16} /> Original CV (Client-Side Only)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Rev {sourceRevision}</span>
              </div>
              <textarea
                value={sourceText}
                onChange={handleSourceTextChange}
                rows={24}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  color: '#e2e8f0',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Right: Anonymized Review CV */}
            <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontWeight: '600', color: '#a5f3fc', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={16} /> Anonymized CV (Review & Approve)
                </span>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{detectedEntities.length} entities masked</span>
              </div>
              <textarea
                value={anonymizedText}
                onChange={(e) => setAnonymizedText(e.target.value)}
                rows={24}
                style={{
                  width: '100%',
                  background: '#0f172a',
                  color: '#38bdf8',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '12px',
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#0f172a', border: '2px dashed #334155', borderRadius: '12px' }}>
          <FileText size={48} style={{ color: '#6366f1', margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '8px' }}>No CV Loaded</h2>
          <p style={{ color: '#94a3b8', maxWidth: '500px', margin: '0 auto 20px', fontSize: '0.9rem' }}>
            Upload your CV in PDF, DOCX, or TXT format. Text extraction and PII anonymization are executed 100% locally in your browser.
          </p>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#6366f1', color: '#ffffff', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
            <Upload size={18} /> Choose CV File
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      )}
    </div>
  );
}
