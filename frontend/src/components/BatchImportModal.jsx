import React, { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  Textarea,
  Input,
  Text,
  AlertBanner,
  Badge,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { trackEvent, EVENTS } from '../utils/analytics';
import { checkExtensionPromptRequirement, anyUrlRequiresExtension } from '../utils/extension';
import ExtensionPromptModal from './ExtensionPromptModal';

export default function BatchImportModal({ isOpen, onClose, onImportComplete, queueRemaining = 0 }) {
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
        results_count: (data.results || []).length
      });

      setResult(data);
      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err) {
      trackEvent(EVENTS.BATCH_IMPORT_ERROR, {
        urls_count: urls.length,
        error: err.message
      });
      setError(err.message);
    } finally {
      setLoading(false);
      setDuplicateWarning(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const urls = urlsText
      .split('\n')
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) {
      setError(t('batchModal.error_empty'));
      return;
    }

    const defaultTags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    setLoading(true);
    try {
      const checkRes = await fetch('/api/vacancies/batch/check-duplicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });

      if (checkRes.ok) {
        const checkData = await checkRes.json();
        if (checkData.has_duplicates && checkData.duplicates.length > 0) {
          setDuplicateWarning({
            duplicates: checkData.duplicates,
            urls,
            defaultTags,
            requiresExtension: checkData.requires_extension
          });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to pre-check duplicates:', err);
    }

    const needsExt = anyUrlRequiresExtension(urls);
    if (needsExt) {
      const promptReq = await checkExtensionPromptRequirement();
      if (promptReq.show) {
        setExtModalInfo(promptReq);
        setPendingSubmit(() => () => performSubmit(urls, defaultTags));
        setShowExtModal(true);
        setLoading(false);
        return;
      }
    }

    await performSubmit(urls, defaultTags);
  };

  const handleClose = () => {
    setUrlsText('');
    setTagsInput('');
    setResult(null);
    setError(null);
    setDuplicateWarning(null);
    setPendingSubmit(null);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg">
        <ModalHeader
          title={t('batchModal.title')}
          icon={<Icon icon={UploadCloud} size="md" tone="accent" />}
          onClose={handleClose}
        />

        {duplicateWarning ? (
          <>
            <ModalBody>
              <AlertBanner
                tone="warning"
                title={t('batchModal.duplicate_warning_title')}
                description={t('batchModal.duplicate_warning_desc')}
              />

              <div style={{ marginTop: 'var(--ui-space-4)', maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)' }}>
                {duplicateWarning.duplicates.map((dup) => (
                  <div key={dup.id} style={{
                    padding: 'var(--ui-space-2-5)',
                    background: 'var(--ui-bg-subtle)',
                    border: '1px solid var(--ui-border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <Text variant="body" weight="medium">
                      {dup.title || dup.url}
                    </Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text variant="caption" tone="secondary">{dup.company || 'Unknown'}</Text>
                      {dup.status && (
                        <Badge variant="outline" size="xs" tone="primary">
                          {dup.status}
                        </Badge>
                      )}
                    </div>
                    <Text variant="mono" tone="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {dup.url}
                    </Text>
                  </div>
                ))}
              </div>
            </ModalBody>

            <ModalFooter justify="end">
              <ModalFooter.Actions>
                <Button
                  variant="secondary"
                  onClick={() => setDuplicateWarning(null)}
                  disabled={loading}
                >
                  {t('batchModal.duplicate_warning_cancel')}
                </Button>
                <Button
                  variant="warning"
                  onClick={async () => {
                    const { urls, defaultTags, requiresExtension } = duplicateWarning;
                    const needsExt = typeof requiresExtension === 'boolean'
                      ? requiresExtension
                      : anyUrlRequiresExtension(urls);
                    if (needsExt) {
                      const promptReq = await checkExtensionPromptRequirement();
                      if (promptReq.show) {
                        setExtModalInfo(promptReq);
                        setPendingSubmit(() => () => performSubmit(urls, defaultTags));
                        setShowExtModal(true);
                        return;
                      }
                    }
                    await performSubmit(urls, defaultTags);
                  }}
                  disabled={loading}
                  loading={loading}
                >
                  {t('batchModal.duplicate_warning_proceed')}
                </Button>
              </ModalFooter.Actions>
            </ModalFooter>
          </>
        ) : result ? (
          <>
            <ModalBody>
              <div style={{ textAlign: 'center', padding: 'var(--ui-space-6) 0' }}>
                <Icon icon={CheckCircle} size="xl" tone="success" style={{ margin: '0 auto var(--ui-space-4)' }} />
                <Text as="h3" variant="display" weight="bold" style={{ marginBottom: 'var(--ui-space-2)' }}>
                  {t('batchModal.success_title')}
                </Text>
                <Text variant="body" tone="secondary" style={{ marginBottom: 'var(--ui-space-4)', display: 'block' }}>
                  {t('batchModal.success_desc', { count: result.queued })}
                </Text>

                {result.results && result.results.length > 0 && (
                  <div style={{ textAlign: 'left', marginTop: 'var(--ui-space-4)', maxHeight: '200px', overflowY: 'auto' }}>
                    <Text variant="caption" weight="bold" style={{ marginBottom: 'var(--ui-space-2)', display: 'block' }}>
                      {t('batchModal.details_label')}
                    </Text>
                    {result.results.map((r, i) => (
                      <div key={i} style={{
                        padding: 'var(--ui-space-2)',
                        borderBottom: '1px solid var(--ui-border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Text variant="mono" tone="secondary" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>
                          {r.url}
                        </Text>
                        <Badge variant="outline" size="xs" tone={r.status === 'queued' ? 'success' : 'neutral'}>
                          {r.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ModalBody>
            <ModalFooter justify="end">
              <Button variant="primary" onClick={handleClose}>
                {t('batchModal.done_btn')}
              </Button>
            </ModalFooter>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <ModalBody>
              {error && (
                <AlertBanner
                  tone="danger"
                  title={error}
                  style={{ marginBottom: 'var(--ui-space-4)' }}
                />
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
                  <Text as="label" variant="caption" weight="medium">
                    {t('batchModal.urls_label')}
                  </Text>
                  <Textarea
                    value={urlsText}
                    onChange={(e) => setUrlsText(e.target.value)}
                    placeholder={t('batchModal.urls_placeholder')}
                    rows={6}
                    disabled={loading}
                    autoFocus
                  />
                  <Text variant="caption" tone="muted">
                    {t('batchModal.urls_hint')}
                  </Text>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-1)' }}>
                  <Text as="label" variant="caption" weight="medium">
                    {t('batchModal.tags_label')}
                  </Text>
                  <Input
                    type="text"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder={t('batchModal.tags_placeholder')}
                    disabled={loading}
                  />
                  <Text variant="caption" tone="muted">
                    {t('batchModal.tags_hint')}
                  </Text>
                </div>
              </div>
            </ModalBody>

            <ModalFooter justify="end">
              <ModalFooter.Actions>
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                  {t('batchModal.cancel_btn')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading || !urlsText.trim()}
                  loading={loading}
                >
                  {t('batchModal.submit_btn')}
                </Button>
              </ModalFooter.Actions>
            </ModalFooter>
          </form>
        )}
      </Modal>

      {showExtModal && (
        <ExtensionPromptModal
          isOpen={showExtModal}
          onClose={() => {
            setShowExtModal(false);
            setPendingSubmit(null);
          }}
          reason={extModalInfo?.reason}
          onProceed={() => {
            setShowExtModal(false);
            if (pendingSubmit) {
              const run = pendingSubmit;
              setPendingSubmit(null);
              run();
            }
          }}
        />
      )}
    </>
  );
}
