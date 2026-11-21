'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Edit3,
} from 'lucide-react';
import {
  PageLayout,
  TableHeader,
  Button,
  Icon,
  Text,
  Badge,
  AlertBanner,
  Textarea,
  StatusDot,
} from '@blueprint/ui-kit';
import { extractTextFromFile } from '../utils/textExtractor';
import { getLocalCV, saveLocalCV, clearLocalCV } from '../utils/cvIndexedDB';
import { useTranslation } from '../i18n/I18nContext';

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

  // Fetch server approved CV
  const fetchServerApprovedCV = useCallback(async () => {
    try {
      const res = await fetch('/api/v2/cv');
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

  useEffect(() => {
    let isMounted = true;
    async function init() {
      setLoading(true);
      if (!user) {
        await fetchCurrentUser();
      }
      const sCv = await fetchServerApprovedCV();
      const local = await getLocalCV(user?.id);

      if (!isMounted) return;

      if (local && local.content) {
        setSourceText(local.content);
        setSourceRevision(local.revision || 1);
        setFilename(local.filename || '');
        if (sCv) {
          setApprovedRevision(sCv.revision || 0);
          if (local.content.trim() === (sCv.content || '').trim()) {
            setSyncStatus('approved');
          } else {
            setSyncStatus('outdated');
          }
        } else {
          setSyncStatus('draft');
        }
      } else if (sCv) {
        setSourceText(sCv.content || '');
        setSourceRevision(sCv.revision || 1);
        setApprovedRevision(sCv.revision || 0);
        setSyncStatus('approved');
      } else {
        setSyncStatus('none');
      }
      setLoading(false);
    }
    init();
    return () => {
      isMounted = false;
    };
  }, [user, fetchCurrentUser, fetchServerApprovedCV]);

  // Handle local text editing
  const handleTextChange = async (e) => {
    const newText = e.target.value;
    setSourceText(newText);
    const newRev = sourceRevision + 1;
    setSourceRevision(newRev);

    if (serverCV) {
      if (newText.trim() === (serverCV.content || '').trim()) {
        setSyncStatus('approved');
      } else {
        setSyncStatus('outdated');
      }
    } else {
      setSyncStatus(newText.trim() ? 'draft' : 'none');
    }

    await saveLocalCV({
      content: newText,
      revision: newRev,
      filename,
      updated_at: new Date().toISOString(),
    }, user?.id);
  };

  // Handle File Upload
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);

    try {
      const text = await extractTextFromFile(file);
      if (!text || !text.trim()) {
        throw new Error(t('pages.cv.empty_file_error'));
      }

      const newRev = sourceRevision + 1;
      setSourceText(text);
      setSourceRevision(newRev);
      setFilename(file.name);

      if (serverCV && text.trim() === (serverCV.content || '').trim()) {
        setSyncStatus('approved');
      } else {
        setSyncStatus(serverCV ? 'outdated' : 'draft');
      }

      await saveLocalCV({
        content: text,
        revision: newRev,
        filename: file.name,
        updated_at: new Date().toISOString(),
      }, user?.id);

      setMessage(t('pages.cv.uploaded_success', { filename: file.name }));
    } catch (err) {
      setError(err.message || t('pages.cv.upload_failed'));
    } finally {
      e.target.value = '';
    }
  };

  // Approve & Save to Server
  const handleSaveToServer = async () => {
    if (!sourceText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch('/api/v2/cv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceText,
          revision: sourceRevision,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || t('pages.cv.save_failed'));
      }

      const saved = await res.json();
      setServerCV(saved);
      setApprovedRevision(saved.revision);
      setSyncStatus('approved');
      setMessage(t('pages.cv.approved_saved_success'));

      await saveLocalCV({
        content: sourceText,
        revision: saved.revision,
        filename,
        updated_at: new Date().toISOString(),
      }, user?.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Server CV
  const handleDeleteServerCV = async () => {
    if (!window.confirm(t('pages.cv.confirm_delete_server'))) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/v2/cv', { method: 'DELETE' });
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
    <PageLayout
      gridDeps={[sourceText, syncStatus, error, message, filename, locale]}
      className="cv-page"
      header={
        <div
          className="bp-subbar bp-snap"
          data-min-grids="1"
          style={{
            height: 'var(--ui-grid-cell)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--ui-space-4)',
            backgroundColor: 'var(--ui-bg-surface)',
            borderBottom: '1px solid var(--ui-pixel-line)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <span style={{ width: '8px', height: '8px', backgroundColor: 'var(--ui-primary)' }} />
            <Text variant="mono" weight="bold" tone="primary">
              {t('pages.cv.title')}
            </Text>
            <Text variant="mono" tone="muted">
              /
            </Text>
            <Text variant="caption" tone="secondary">
              {t('pages.cv.subtitle')}
            </Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            {syncStatus === 'approved' && (
              <Badge variant="solid" tone="success" size="xs" icon={<Icon icon={CheckCircle2} size="2xs" />}>
                {t('pages.cv.saved_on_server', { rev: approvedRevision })}
              </Badge>
            )}
            {syncStatus === 'outdated' && (
              <Badge variant="outline" tone="warning" size="xs" icon={<Icon icon={AlertTriangle} size="2xs" />}>
                {t('pages.cv.modified_locally')}
              </Badge>
            )}
            {syncStatus === 'draft' && (
              <Badge variant="outline" tone="accent" size="xs" icon={<Icon icon={Edit3} size="2xs" />}>
                {t('pages.cv.local_draft')}
              </Badge>
            )}
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)', padding: 'var(--ui-space-4)' }}>
        {/* Notifications */}
        {error && <AlertBanner tone="danger" title={error} />}
        {message && <AlertBanner tone="success" title={message} />}

        {/* Document Section */}
        <section
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--ui-bg-card-fill)',
            border: '1px solid var(--ui-border-subtle)',
          }}
        >
          <TableHeader
            size="sm"
            actions={
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
                <label style={{ margin: 0, cursor: 'pointer' }}>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                  <Button
                    as="span"
                    variant="primary"
                    size="sm"
                    startIcon={<Icon icon={Upload} size="xs" />}
                  >
                    {sourceText ? t('pages.cv.replace_btn') : t('pages.cv.upload_btn')}
                  </Button>
                </label>

                {syncStatus !== 'approved' && sourceText.trim() && (
                  <Button
                    variant="success"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleSaveToServer}
                    startIcon={<Icon icon={CheckCircle2} size="xs" />}
                  >
                    {isSubmitting ? t('pages.cv.saving') : t('pages.cv.save_server_btn')}
                  </Button>
                )}

                {serverCV && (
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleDeleteServerCV}
                    startIcon={<Icon icon={Trash2} size="xs" />}
                  >
                    {t('pages.cv.delete_server_btn')}
                  </Button>
                )}

                {sourceText && syncStatus !== 'none' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLocal}
                  >
                    {t('pages.cv.reset_draft_btn')}
                  </Button>
                )}
              </div>
            }
          >
            <Text as="span" variant="mono" weight="semibold" tone="accent">
              [ 01 ]
            </Text>
            <StatusDot tone={sourceText ? 'success' : 'neutral'} size="md" />
            <Text as="span" variant="mono-label" weight="semibold" tone="primary" truncate>
              {sourceText
                ? t('pages.cv.content_header', {
                    filename: filename || t('pages.cv.current_document'),
                  })
                : t('pages.cv.no_cv_title')}
            </Text>
            {sourceText && (
              <Badge variant="counter" size="xs" tone="neutral">
                {t('pages.cv.revision', { rev: sourceRevision })}
              </Badge>
            )}
          </TableHeader>

          <div style={{ padding: 'var(--ui-space-4)' }}>
            <Textarea
              value={sourceText}
              onChange={handleTextChange}
              placeholder={t('pages.cv.textarea_placeholder')}
              rows={20}
              style={{ width: '100%', fontFamily: 'var(--ui-font-mono)', fontSize: 'var(--ui-font-size-xs)' }}
            />
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
