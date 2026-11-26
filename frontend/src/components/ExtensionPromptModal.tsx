import { ArrowRight, Puzzle, Sparkles } from 'lucide-react';
import {
  Button,
  Checkbox,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Paragraph,
  Text,
} from '@blueprint/ui-kit';
import {
  dismissExtensionPrompt,
  type ExtensionChangelog,
  getUpdatesBetween,
} from '../utils/extension';
import React, { useState } from 'react';
import ExtensionInstructionsSection from './ExtensionInstructionsSection';
import ExtensionUpdatesSection from './ExtensionUpdatesSection';
import { useTranslation } from '../i18n/I18nContext';

export interface ExtensionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  mode?: 'not_installed' | 'outdated' | null;
  reason?: 'not_installed' | 'outdated' | null;
  currentVersion?: string | null;
  latestVersion?: string | null;
  changelog?: ExtensionChangelog | null;
}

const SPARKLES_ICON = <Icon icon={Sparkles} size="md" tone="warning" />;
const PUZZLE_ICON = <Icon icon={Puzzle} size="md" tone="accent" />;
const ARROW_ICON = <Icon icon={ArrowRight} size="xs" />;

function getUpdateCopy(
  currentVersion: string | null | undefined,
  latestVersion: string | null | undefined,
  t: (path: string, params?: Record<string, string | number>) => string,
) {
  return {
    title: t('extensionModal.title_update'),
    description: t('extensionModal.subtitle_update', {
      current: currentVersion || '?',
      latest: latestVersion || '?',
    }),
    intro: t('extensionModal.desc_intro_update'),
    dontShowLabel: t('extensionModal.dont_show_again_version'),
    proceedLabel: t('extensionModal.proceed_outdated'),
    icon: SPARKLES_ICON,
  };
}

function getInstallCopy(t: (path: string) => string) {
  return {
    title: t('extensionModal.title'),
    description: t('extensionModal.subtitle'),
    intro: t('extensionModal.desc_intro'),
    dontShowLabel: t('extensionModal.dont_show_again'),
    proceedLabel: t('extensionModal.proceed_anyway'),
    icon: PUZZLE_ICON,
  };
}

function resolveModalMode(
  mode?: 'not_installed' | 'outdated' | null,
  reason?: 'not_installed' | 'outdated' | null,
): 'not_installed' | 'outdated' {
  if (mode === 'outdated' || reason === 'outdated') return 'outdated';
  return 'not_installed';
}

function resolveModalViewData(
  props: ExtensionPromptModalProps,
  locale: string,
  t: (path: string, params?: Record<string, string | number>) => string,
) {
  const effectiveMode = resolveModalMode(props.mode, props.reason);
  const isUpdate = effectiveMode === 'outdated';
  const updates = isUpdate ? getUpdatesBetween(props.changelog, props.currentVersion, locale) : [];
  const copy = isUpdate
    ? getUpdateCopy(props.currentVersion, props.latestVersion, t)
    : getInstallCopy(t);
  return { effectiveMode, isUpdate, updates, copy };
}

export default function ExtensionPromptModal(
  props: ExtensionPromptModalProps,
): React.ReactElement | null {
  const { t, locale } = useTranslation();
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!props.isOpen) return null;

  const { effectiveMode, isUpdate, updates, copy } = resolveModalViewData(props, locale, t);

  const persistDismiss = () => {
    if (dontShowAgain) {
      dismissExtensionPrompt(true, effectiveMode, props.latestVersion);
    }
  };

  const handleClose = () => {
    persistDismiss();
    props.onClose();
  };

  const handleProceed = () => {
    persistDismiss();
    props.onClose();
    props.onProceed?.();
  };

  return (
    <Modal isOpen={props.isOpen} onClose={handleClose} size="lg">
      <ModalHeader
        title={copy.title}
        description={copy.description}
        icon={copy.icon}
        onClose={handleClose}
      />

      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
          <Paragraph tone="secondary">{copy.intro}</Paragraph>
          <ExtensionUpdatesSection isUpdate={isUpdate} updates={updates} />
          <ExtensionInstructionsSection isUpdate={isUpdate} latestVersion={props.latestVersion} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--ui-space-2)' }}>
            <Checkbox
              id="dontShowExtensionModal"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
            />
            <label htmlFor="dontShowExtensionModal" style={{ cursor: 'pointer' }}>
              <Text variant="caption" tone="muted">
                {copy.dontShowLabel}
              </Text>
            </label>
          </div>
        </div>
      </ModalBody>

      <ModalFooter justify="between">
        <Button variant="secondary" onClick={handleClose}>
          {t('extensionModal.close')}
        </Button>
        {props.onProceed && (
          <Button variant="primary" onClick={handleProceed} endIcon={ARROW_ICON}>
            {copy.proceedLabel}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
