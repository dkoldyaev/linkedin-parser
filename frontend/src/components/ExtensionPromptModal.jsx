import React, { useState } from 'react';
import { 
  Puzzle, ShieldAlert, Layers, 
  HelpCircle, ArrowRight, Download,
  Sparkles
} from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Icon,
  Checkbox,
  Text,
  Paragraph,
  AlertBanner,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { dismissExtensionPrompt, getUpdatesBetween } from '../utils/extension';

export default function ExtensionPromptModal({ 
  isOpen, 
  onClose, 
  onProceed, 
  mode = 'not_installed', // 'not_installed' | 'outdated'
  currentVersion = null,
  latestVersion = null,
  changelog = null
}) {
  const { t, locale } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const isUpdate = mode === 'outdated';

  const handleClose = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true, mode, latestVersion);
    }
    onClose();
  };

  const handleProceed = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true, mode, latestVersion);
    }
    onClose();
    if (onProceed) {
      onProceed();
    }
  };

  const updates = isUpdate ? getUpdatesBetween(changelog, currentVersion, locale) : [];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalHeader
        title={isUpdate ? t('extensionModal.title_update') : t('extensionModal.title')}
        description={
          isUpdate 
            ? t('extensionModal.subtitle_update', { current: currentVersion || '?', latest: latestVersion || '?' })
            : t('extensionModal.subtitle')
        }
        icon={<Icon icon={isUpdate ? Sparkles : Puzzle} size="md" tone={isUpdate ? 'warning' : 'accent'} />}
        onClose={handleClose}
      />

      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
          <Paragraph variant="body" tone="secondary">
            {isUpdate ? t('extensionModal.desc_intro_update') : t('extensionModal.desc_intro')}
          </Paragraph>

          {isUpdate && updates.length > 0 && (
            <div style={{
              background: 'var(--ui-bg-subtle)',
              border: '1px solid var(--ui-border-subtle)',
              padding: 'var(--ui-space-3-5)',
            }}>
              <Text variant="caption" weight="bold" tone="warning" startIcon={<Icon icon={Sparkles} size="xs" />}>
                {updates.length === 1 
                  ? t('extensionModal.whats_new', { version: updates[0].version }) 
                  : t('extensionModal.whats_new_general')}
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-2)', marginTop: 'var(--ui-space-2)' }}>
                {updates.map((up) => (
                  <div key={up.version}>
                    {updates.length > 1 && (
                      <Text variant="caption" weight="medium" tone="muted">
                        v{up.version} {up.date ? `(${up.date})` : ''}
                      </Text>
                    )}
                    <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--ui-text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {up.changes.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isUpdate && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-3)' }}>
              <div style={{ display: 'flex', gap: 'var(--ui-space-3)', alignItems: 'flex-start' }}>
                <Icon icon={Layers} size="sm" tone="accent" style={{ marginTop: '2px' }} />
                <div>
                  <Text variant="body" weight="medium">
                    {t('extensionModal.feature_tabs_title')}
                  </Text>
                  <Text variant="caption" tone="muted" style={{ display: 'block', marginTop: '2px' }}>
                    {t('extensionModal.feature_tabs_desc')}
                  </Text>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 'var(--ui-space-3)', alignItems: 'flex-start' }}>
                <Icon icon={ShieldAlert} size="sm" tone="warning" style={{ marginTop: '2px' }} />
                <div>
                  <Text variant="body" weight="medium">
                    {t('extensionModal.feature_captcha_title')}
                  </Text>
                  <Text variant="caption" tone="muted" style={{ display: 'block', marginTop: '2px' }}>
                    {t('extensionModal.feature_captcha_desc')}
                  </Text>
                </div>
              </div>
            </div>
          )}

          {/* Installation or Update Instructions */}
          <div style={{
            background: 'var(--ui-bg-subtle)',
            border: '1px solid var(--ui-border-subtle)',
            padding: 'var(--ui-space-3-5)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--ui-space-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon icon={HelpCircle} size="xs" tone={isUpdate ? 'warning' : 'accent'} />
                <Text variant="caption" weight="bold">
                  {isUpdate ? t('extensionModal.update_title') : t('extensionModal.install_title')}
                </Text>
              </div>
              <Button
                as="a"
                href="/extension.zip"
                download
                variant="secondary"
                size="xs"
                startIcon={<Icon icon={Download} size="2xs" />}
                title="Скачать ZIP"
              >
                {isUpdate ? `ZIP (v${latestVersion || ''})` : 'ZIP'}
              </Button>
            </div>
            <ol style={{ margin: 0, paddingLeft: '20px', color: 'var(--ui-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: 'var(--ui-font-size-xs)' }}>
              {isUpdate ? (
                <>
                  <li>{t('extensionModal.update_step1')}</li>
                  <li>{t('extensionModal.update_step2')}</li>
                  <li>{t('extensionModal.update_step3')}</li>
                </>
              ) : (
                <>
                  <li>{t('extensionModal.install_step1')}</li>
                  <li>{t('extensionModal.install_step2')}</li>
                  <li>{t('extensionModal.install_step3')}</li>
                </>
              )}
            </ol>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <Checkbox
              id="dontShowExtensionModal"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <Text as="label" htmlFor="dontShowExtensionModal" variant="caption" tone="muted" style={{ cursor: 'pointer' }}>
              {isUpdate ? t('extensionModal.dont_show_again_version') : t('extensionModal.dont_show_again')}
            </Text>
          </div>
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="secondary" onClick={handleClose}>
          {t('extensionModal.close')}
        </Button>
        {onProceed && (
          <Button
            variant="primary"
            onClick={handleProceed}
            endIcon={<Icon icon={ArrowRight} size="xs" />}
          >
            {isUpdate ? t('extensionModal.proceed_outdated') : t('extensionModal.proceed_anyway')}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
