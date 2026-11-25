
import React from 'react';
import { Briefcase } from 'lucide-react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  AlertBanner,
  Icon,
} from '@blueprint/ui-kit';
import { useTranslation } from '../i18n/I18nContext';
import { useLoginController } from './useLoginController';
import LoginGoogleSection from './LoginGoogleSection';
import LoginDevSection from './LoginDevSection';
import type { User } from '../types/models';

export interface LoginModalProps {
  isOpen?: boolean;
  onLoginSuccess?: (user: User) => void;
  onClose?: () => void;
  isGuestPromotion?: boolean;
}

const BRIEFCASE_ICON = <Icon icon={Briefcase} size="sm" />;
const NOOP_CLOSE = () => {};

function resolveLoginModalLabels(
  isGuestPromotion: boolean,
  googleConfigured: boolean,
  loading: boolean,
  t: (key: string) => string
) {
  return {
    title: isGuestPromotion ? t('auth.save_progress_title') : 'LinkedIn Vacancies',
    description: isGuestPromotion ? t('auth.save_progress_subtitle') : t('auth.subtitle'),
    devCaption: googleConfigured ? t('auth.or_dev_login') : t('auth.dev_mode_label'),
    devBtnLabel: loading ? t('auth.logging_in') : t('auth.dev_login'),
  };
}

export default function LoginModal({
  isOpen = true,
  onLoginSuccess,
  onClose,
  isGuestPromotion = false,
}: LoginModalProps): React.ReactElement | null {
  const { t } = useTranslation();
  const ctrl = useLoginController(onLoginSuccess);

  if (!isOpen) return null;

  const googleConfigured = ctrl.authConfig.google_configured;
  const labels = resolveLoginModalLabels(
    isGuestPromotion,
    googleConfigured,
    ctrl.loading,
    t
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose || NOOP_CLOSE} size="sm">
      <ModalHeader
        title={labels.title}
        description={labels.description}
        icon={BRIEFCASE_ICON}
        onClose={onClose}
      />

      <ModalBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--ui-space-4)' }}>
          {ctrl.error && <AlertBanner tone="danger" title={ctrl.error} />}

          <LoginGoogleSection
            googleConfigured={googleConfigured}
            loading={ctrl.loading}
            onGoogleLogin={ctrl.handleGoogleLogin}
          />

          <LoginDevSection
            devMode={ctrl.authConfig.dev_mode}
            devCaption={labels.devCaption}
            devBtnLabel={labels.devBtnLabel}
            loading={ctrl.loading}
            devName={ctrl.devName}
            onDevNameChange={ctrl.setDevName}
            devEmail={ctrl.devEmail}
            onDevEmailChange={ctrl.setDevEmail}
            onSubmit={ctrl.handleDevLogin}
          />
        </div>
      </ModalBody>
    </Modal>
  );
}
